/**
 * lib/auth/refresh-lock.ts — single-flight token-refresh lock.
 *
 * The central server fetcher (`lib/api/core/api-fetch.ts`) and the
 * `/api/auth/{me,refresh}` route handlers can each trigger a token refresh when
 * the access token is expired or about to expire. Under concurrency, several
 * requests can detect the expired token at the same time and each kick off its
 * own refresh — racing the refresh-token rotation and producing redundant
 * upstream calls.
 *
 * `refreshOnce` collapses that fan-out: a module-level in-flight promise ensures
 * that while a refresh is running, every additional caller awaits the *same*
 * promise and receives the *same* result. The promise is cleared on settle
 * (success or failure) so the next genuine expiry can refresh again.
 *
 * Pure coordination only — no I/O of its own. The actual refresh work is the
 * `run` callback supplied by the caller, so this module stays framework-free and
 * trivially testable.
 */

/**
 * Result of a single refresh attempt.
 *
 * Mirrors the refresh shape already used across the auth route handlers and the
 * server fetcher: a successful refresh rotates the access/refresh tokens and
 * yields a new absolute expiry, while a failure simply reports `ok: false` (the
 * caller is then responsible for clearing the session and redirecting).
 *
 * `refreshOnce` itself is generic, so callers may substitute their own result
 * type (e.g. a plain `boolean`) where that is more convenient; this type is the
 * canonical default that matches the codebase.
 */
export type RefreshResult =
  | {
      ok: true;
      /** New short-lived access token. */
      accessToken: string;
      /** Rotated refresh token. */
      refreshToken: string;
      /** Unix timestamp (ms) when the new access token expires. */
      expiresAt: number;
    }
  | { ok: false };

/**
 * The currently in-flight refresh, or `null` when no refresh is running.
 *
 * Typed as `Promise<unknown>` so a single module-level slot can back any caller
 * result type; `refreshOnce` casts it back to the caller's `T` on return.
 */
let inFlight: Promise<unknown> | null = null;

/**
 * Run `run` under a single-flight lock.
 *
 * If no refresh is in progress, `run` is invoked and its promise is stored as
 * the in-flight refresh (cleared once it settles). If a refresh is already in
 * progress, `run` is **not** invoked and the existing in-flight promise is
 * returned instead, so N concurrent callers trigger at most one refresh and all
 * receive the same resolved (or rejected) result.
 *
 * @param run Performs the actual refresh. Called at most once per in-flight window.
 * @returns The shared in-flight refresh promise.
 */
export function refreshOnce<T = RefreshResult>(run: () => Promise<T>): Promise<T> {
  if (!inFlight) {
    inFlight = run().finally(() => {
      inFlight = null;
    });
  }
  return inFlight as Promise<T>;
}
