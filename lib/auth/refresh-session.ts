/**
 * lib/auth/refresh-session.ts — server-only token refresh, single-flight + bounded.
 *
 * This is the ONE place a real token refresh is performed. Both the central
 * server fetcher (`lib/api/core/api-fetch.ts`) and the `/api/auth/{me,refresh}`
 * route handlers call `refreshSessionOnce()` so that:
 *
 *  - Under concurrency, N callers collapse to AT MOST ONE upstream refresh and
 *    all receive the same outcome (single-flight — R6.6). The lock lives in
 *    `refresh-lock.ts` at module scope, so it is shared across every call site.
 *  - The refresh is bounded to 5 s via an AbortController (R6.4).
 *  - A failure is classified as HARD (the refresh token itself is invalid or
 *    expired → the session is over, clear it and redirect) versus TRANSIENT (a
 *    network error or timeout → keep the session and let the caller proceed /
 *    retry). This distinction is what keeps a flaky network from logging the
 *    user out (R6.2, R6.5).
 *
 * Tokens never leave the server: the rotated tokens are written straight back
 * into the httpOnly session cookie and are NEVER returned to the caller.
 */
import 'server-only';
import { getSession, setSession, clearSession } from './session';
import { refreshOnce } from './refresh-lock';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/** Upper bound on a single refresh round-trip (R6.4). */
const REFRESH_TIMEOUT_MS = 5000;

/**
 * Outcome of a refresh attempt.
 *
 * - `{ ok: true }` — tokens rotated and written to the cookie.
 * - `{ ok: false, hard: true }` — refresh token invalid/expired; the session is
 *   over (caller should clear + redirect — R6.5).
 * - `{ ok: false, hard: false }` — transient network/timeout failure; keep the
 *   session and proceed with the existing token (R6.2).
 */
export type RefreshOutcome = { ok: true } | { ok: false; hard: boolean };

/** Perform the actual upstream refresh. Invoked at most once per in-flight window. */
async function runRefresh(): Promise<RefreshOutcome> {
  const session = await getSession();
  if (!session) return { ok: false, hard: true };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      signal: controller.signal,
    });

    // A non-2xx here means the refresh token was rejected — a HARD failure.
    if (!res.ok) return { ok: false, hard: true };

    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };

    await setSession({
      ...session,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
    });
    return { ok: true };
  } catch {
    // Aborted (timeout) or network error — TRANSIENT, keep the session.
    return { ok: false, hard: false };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Refresh the session under the shared single-flight lock (R6.4, R6.6).
 *
 * Concurrent callers — whether in the fetcher or a route handler — await the
 * same in-flight refresh and receive the same {@link RefreshOutcome}.
 */
export function refreshSessionOnce(): Promise<RefreshOutcome> {
  return refreshOnce<RefreshOutcome>(runRefresh);
}

/**
 * End the session on a hard refresh failure (R6.5): clear the httpOnly cookie so
 * no client-side session state survives. The browser-side redirect to `/login`
 * (with a validated `next`) is driven by the client session hook reacting to the
 * resulting 401.
 */
export async function endSession(): Promise<void> {
  await clearSession();
}
