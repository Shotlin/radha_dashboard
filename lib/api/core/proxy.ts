import 'server-only';

/**
 * lib/api/core/proxy.ts — shared API_Proxy plumbing for Feature_Area handlers.
 *
 * Server-only: importing this from a client component is a build-time error.
 *
 * Every `app/api/*` Feature_Area GET handler is a thin wrapper around
 * {@link resolveFeatureData}. This module factors out the four things every one
 * of those handlers must do identically so the honest-data + scope + timeout
 * rules are described in exactly one place:
 *
 *   1. {@link buildStoreScope} — derive the active {@link StoreScope} from the
 *      session tenant (authoritative) and the `storeId` query param (absent or
 *      `'all'` ⇒ the owner/admin tenant-rollup, `storeId: null`).
 *   2. {@link scopeQuery} — the scope params forwarded to the backend on every
 *      request: the session `tenantId` plus the active `storeId`, or the
 *      tenant-rollup marker when no store is selected (Requirements 8.1, 8.3).
 *   3. {@link withBackendTimeout} — bound every backend call with a 30-second
 *      `AbortController` (Requirement 10.2).
 *   4. {@link resolveToResponse} — map a {@link ResolveResult} to the HTTP
 *      response while preserving the handler's existing contract.
 *
 * Honest-data discipline lives inside `resolveFeatureData`: in demo mode the
 * backend is never touched and data comes only from the Demo_Data_Provider; with
 * demo mode off a backend failure yields an `error`/`empty` result, never demo
 * data (Requirements 1.6, 2.4, 2.5).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Role } from '@/lib/permissions';
import type { StoreScope } from '@/lib/api/core/scope-types';
import type { SessionPayload } from '@/lib/auth/session';
import { resolveFeatureData, type ResolveArgs } from './resolve';
import { ApiRequestError, UnauthorizedError } from './errors';

/** The wall-clock bound every backend call is held to (Requirement 10.2). */
export const BACKEND_TIMEOUT_MS = 30_000;

/**
 * The tenant-rollup marker forwarded to the backend when no specific store is
 * selected for an owner/admin session (Requirement 8.3). The backend treats this
 * sentinel as "aggregate across every store in the tenant".
 */
export const ROLLUP_MARKER = 'all';

/**
 * True when the request is running under a demo session or `DEMO_MODE`.
 *
 * Hard production guard: demo data/mock metrics are **impossible** in a
 * production build (`NODE_ENV === 'production'`) regardless of env or a stray
 * `_demo` cookie — so fabricated dashboard metrics can never ship. Demo mode
 * remains available in development/test for backend-free exploration.
 */
export function isDemoRequest(session: SessionPayload | null): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return (
    process.env.DEMO_MODE === 'true' ||
    Boolean((session as unknown as Record<string, unknown> | null)?._demo)
  );
}

/**
 * Build the active {@link StoreScope}: the session tenant always governs; the
 * active store comes from the `storeId` query param. An absent param or the
 * literal `'all'` collapses to the owner/admin "all stores" rollup
 * (`storeId: null`).
 */
export function buildStoreScope(session: SessionPayload, req: NextRequest): StoreScope {
  const raw = req.nextUrl.searchParams.get('storeId');
  const storeId = raw && raw !== ROLLUP_MARKER ? raw : null;
  return {
    tenantId: session.user.tenantId,
    storeId,
    role: session.user.role as Role,
  };
}

/**
 * The scope params forwarded to the backend on every Feature_Area request: the
 * session `tenantId` plus the active `storeId`, or the tenant-rollup marker when
 * no store is selected (Requirements 8.1, 8.3).
 */
export function scopeQuery(scope: StoreScope): { tenantId: string; storeId: string } {
  return { tenantId: scope.tenantId, storeId: scope.storeId ?? ROLLUP_MARKER };
}

/**
 * Run a backend call bounded by a 30-second `AbortController` (Requirement 10.2).
 *
 * The created signal is handed to `run`, so callers that forward it (raw `fetch`
 * or signal-aware clients) genuinely abort the in-flight request. The race
 * against the abort guarantees a `TimeoutError` is surfaced even for callers that
 * cannot accept a signal — `resolveFeatureData` maps that `TimeoutError` to a
 * `504` region error.
 */
export async function withBackendTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  ms: number = BACKEND_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  const onTimeout = new Promise<never>((_, reject) => {
    controller.signal.addEventListener('abort', () => {
      const err = new Error(`Backend request exceeded ${ms}ms`);
      err.name = 'TimeoutError';
      reject(err);
    });
  });
  try {
    return await Promise.race([run(controller.signal), onTimeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A no-op scope assertion for backend payloads that carry no per-record
 * tenant/store tags.
 *
 * The backend enforces tenant/store scoping server-side using the forwarded
 * tenant (carried by the server-side Bearer token) and the forwarded `storeId`
 * ({@link scopeQuery}); the payloads these Feature_Area endpoints return do not
 * include per-record `tenantId`/`storeId`, so there is nothing to re-assert in
 * the proxy. Handlers whose payloads DO carry scope tags pass
 * `assertRecordsInScope` instead so an out-of-scope record discards the whole
 * response (Requirement 8.6).
 */
export function noScopeAssertion(): void {
  /* backend scopes server-side; payload carries no per-record scope tags */
}

/** Throw an {@link ApiRequestError} for a non-2xx raw `fetch` Response. */
export async function throwIfNotOk(res: Response): Promise<Response> {
  if (res.ok) return res;
  throw new ApiRequestError({
    code: `HTTP_${res.status}`,
    message: res.statusText || 'Backend request failed',
    status: res.status,
  });
}

/**
 * Resolve a Feature_Area request and map the {@link ResolveResult} to an HTTP
 * response, preserving the handler's existing contract:
 *
 *   • `ok`    → `200` with the resolved data.
 *   • `empty` → `200` with `emptyPayload` (the handler's designed empty-state
 *     contract, e.g. `{ items: [] }`), so the UI renders its empty state (R2.6).
 *   • `error` → the resolver's status with `{ error: { code } }` (R10.1).
 *   • a rethrown `401` → `401` so the client auth layer can refresh/redirect.
 */
export async function resolveToResponse<T>(
  args: ResolveArgs<T>,
  emptyPayload: unknown,
): Promise<NextResponse> {
  try {
    const result = await resolveFeatureData(args);
    if (result.kind === 'ok') {
      return NextResponse.json(result.data, { status: 200 });
    }
    if (result.kind === 'empty') {
      return NextResponse.json(emptyPayload, { status: 200 });
    }
    return NextResponse.json({ error: { code: result.code } }, { status: result.status });
  } catch (err) {
    if (
      err instanceof UnauthorizedError ||
      (err instanceof ApiRequestError && err.status === 401)
    ) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }
    // resolveFeatureData maps every non-401 failure internally; reaching here is
    // an unexpected runtime fault — surface a region error, never a stack/data.
    return NextResponse.json({ error: { code: 'UNKNOWN' } }, { status: 500 });
  }
}
