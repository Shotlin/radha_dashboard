/**
 * lib/api/core/api-fetch.ts — the ONLY place the dashboard issues HTTP requests.
 *
 * SECURITY:
 * - Runs server-side (Server Components, Route Handlers, Server Actions).
 *   Client components must go through /api/* proxies or Server Actions —
 *   they NEVER call apiFetch directly.
 * - Bearer is attached from the httpOnly session cookie server-side only.
 * - Tokens, PII must never appear in query strings or log lines.
 *
 * SESSION HARDENING (R6.2–R6.6):
 * - Proactive refresh: when the access token is within 60 s of expiry, refresh
 *   it (single-flight, ≤5 s) BEFORE issuing the request (R6.4).
 * - 401 → single-flight refresh via `refreshSessionOnce()` so concurrent 401s
 *   trigger at most one refresh, then retry once (R6.6).
 * - Hard refresh failure (refresh token invalid/expired) → clear the cookie and
 *   throw `UnauthorizedError`; the client redirects to /login (R6.5).
 * - Transient failures (HTTP 502/503/504, request timeout, no network response)
 *   on `/auth/me` are retried up to 3 times with exponential backoff
 *   ([1000, 2000, 4000] ms) WITHOUT ever clearing the cookie; on exhaustion a
 *   non-fatal error is surfaced and the session is retained (R6.2, R6.3).
 * - Validates response body with caller-supplied Zod schema.
 * - Normalises backend error shapes to ApiRequestError.
 */
import 'server-only';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getSession, isTokenExpiringSoon } from '@/lib/auth/session';
import { refreshSessionOnce, endSession } from '@/lib/auth/refresh-session';
import { isTransient, backoffSchedule } from '@/lib/auth/retry';
import {
  ApiRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ResponseValidationError,
} from './errors';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/** Max transient retries for `/auth/me` (R6.3) → backoff [1000, 2000, 4000]. */
const ME_MAX_RETRIES = 3;

export interface FetchOptions<TSchema extends z.ZodTypeAny> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Query params as a plain object; values are stringified. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Zod schema to validate and parse the response body. */
  schema: TSchema;
  signal?: AbortSignal;
  /** If true, skip JSON parse + schema validation (e.g. 204 No Content). */
  noBody?: boolean;
}

/** Build a query string from an object, skipping null/undefined values. */
function buildQS(query: FetchOptions<never>['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) params.append(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

/** Sleep helper for backoff between transient retries. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Internal marker thrown when a request fails transiently. The outer retry loop
 * catches it; it is NEVER surfaced to callers (it is mapped to a non-fatal
 * ApiRequestError on retry exhaustion). Only used on the `/auth/me` path so the
 * behaviour of all other routes is unchanged.
 */
class TransientFetchError extends Error {
  readonly outcome: number | 'timeout' | 'no-response';
  constructor(outcome: number | 'timeout' | 'no-response') {
    super(`Transient fetch failure: ${outcome}`);
    this.name = 'TransientFetchError';
    this.outcome = outcome;
  }
}

/** Normalise a non-2xx response to an ApiRequestError. */
async function normaliseError(res: Response, requestId: string): Promise<ApiRequestError> {
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    // Swallow — body may be empty
  }
  const code = (body.code as string) || (body.error as string) || `HTTP_${res.status}`;
  const message = (body.message as string) || res.statusText || 'An error occurred';
  const fields = body.errors as Record<string, string> | undefined;

  switch (res.status) {
    case 401:
      return new UnauthorizedError(requestId);
    case 403:
      return new ForbiddenError(message, requestId);
    case 404:
      return new NotFoundError(message, requestId);
    case 429: {
      const retryAfter = res.headers.get('retry-after');
      const ms = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
      return new RateLimitError(ms, requestId);
    }
    default:
      return new ApiRequestError({ code, message, fields, status: res.status, requestId });
  }
}

/**
 * apiFetch<T> — the single typed HTTP client for the RADHA dashboard.
 *
 * @example
 * const kpis = await apiFetch('/dashboard/kpis', {
 *   schema: DashboardKpisSchema,
 *   query: { storeId: id },
 * });
 */
export async function apiFetch<TSchema extends z.ZodTypeAny>(
  path: string,
  options: FetchOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const { method = 'GET', body, query, schema, signal, noBody = false } = options;
  const requestId = randomUUID();

  // Only the auth/me probe gets transient retry/backoff (R6.2, R6.3); every
  // other route keeps its original single-attempt behaviour.
  const isAuthMe = path === '/auth/me' || path.startsWith('/auth/me');

  // ── Proactive refresh (R6.4, R6.6) ──────────────────────────────────────
  // If the access token is within 60 s of expiry, refresh BEFORE the request.
  // A hard failure ends the session; a transient failure keeps it and proceeds.
  const current = await getSession();
  if (current && isTokenExpiringSoon(current.expiresAt)) {
    const outcome = await refreshSessionOnce();
    if (!outcome.ok && outcome.hard) {
      await endSession();
      throw new UnauthorizedError(requestId);
    }
  }

  /** Issue one request attempt. `refreshed` guards the 401 → refresh → retry path. */
  async function doRequest(refreshed: boolean): Promise<z.infer<TSchema>> {
    const session = await getSession();
    const qs = buildQS(query);
    const url = `${API_BASE}${path}${qs}`;

    const headers: HeadersInit = {
      'x-request-id': requestId,
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal,
        next: { revalidate: 0 },
      });
    } catch (err) {
      // Network-level failure: classify as transient for /auth/me so the outer
      // loop can retry. Other routes keep their original throw-through behaviour.
      if (isAuthMe) {
        const marker = (err as { name?: string })?.name === 'AbortError' ? 'timeout' : 'no-response';
        throw new TransientFetchError(marker);
      }
      throw err;
    }

    if (!res.ok) {
      // 401 → single-flight refresh once, then retry (R6.6).
      if (res.status === 401 && !refreshed) {
        const outcome = await refreshSessionOnce();
        if (outcome.ok) return doRequest(true);
        // Hard failure: refresh token invalid/expired → end session (R6.5).
        if (outcome.hard) await endSession();
        // Transient refresh failure: leave the cookie intact (do not log out).
        throw new UnauthorizedError(requestId);
      }

      // Transient backend status on /auth/me → let the retry loop handle it,
      // keeping the cookie intact throughout (R6.2, R6.3).
      if (isAuthMe && isTransient(res.status)) {
        throw new TransientFetchError(res.status);
      }

      throw await normaliseError(res, requestId);
    }

    if (noBody) {
      // Parse and validate an empty/no-content schema
      return schema.parse(undefined) as z.infer<TSchema>;
    }

    // Parse JSON body
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throw new ResponseValidationError('Response body was not valid JSON');
    }

    // Validate with Zod
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      throw new ResponseValidationError(parsed.error.issues);
    }

    return parsed.data as z.infer<TSchema>;
  }

  // ── Transient-retry loop (only attempts > 1 for /auth/me) ────────────────
  const schedule = isAuthMe ? backoffSchedule(ME_MAX_RETRIES) : [];
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await doRequest(false);
    } catch (err) {
      if (err instanceof TransientFetchError) {
        if (attempt < schedule.length) {
          await delay(schedule[attempt]);
          continue;
        }
        // Retries exhausted on /auth/me: surface a NON-FATAL error and KEEP the
        // session cookie — never a 401, never a logout (R6.2, R6.3).
        throw new ApiRequestError({
          code: 'UPSTREAM_TRANSIENT',
          message: 'The service is temporarily unavailable. Please try again.',
          status: 503,
          requestId,
        });
      }
      throw err;
    }
  }
}
