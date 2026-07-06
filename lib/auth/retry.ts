/**
 * lib/auth/retry.ts — pure transient-error classification and backoff schedule.
 *
 * Used by the server fetcher (`lib/api/core/api-fetch.ts`) to decide whether a
 * failed `/api/auth/me` request is worth retrying and how long to wait between
 * attempts. Pure functions only — no I/O, no `server-only` needed.
 */

/** HTTP statuses treated as transient (worth retrying). */
const TRANSIENT_STATUSES: ReadonlySet<number> = new Set([502, 503, 504]);

/** Non-HTTP transient outcomes: a request timeout or no network response. */
type TransientOutcome = 'timeout' | 'no-response';

/** Starting backoff delay in ms. */
const BASE_DELAY_MS = 1000;
/** Exponential growth factor between attempts. */
const FACTOR = 2;
/** Upper bound on any single backoff delay in ms. */
const MAX_DELAY_MS = 8000;

/**
 * Classify a failure as transient.
 *
 * Returns true for HTTP 502/503/504, a request timeout, and a missing network
 * response; false for every other status (including 401 and other 4xx/5xx).
 */
export function isTransient(status: number | TransientOutcome): boolean {
  if (status === 'timeout' || status === 'no-response') return true;
  return TRANSIENT_STATUSES.has(status);
}

/**
 * Backoff delays in ms for attempts `1..maxRetries`.
 *
 * Starts at 1000 ms, grows by a factor of 2, and each delay is capped at
 * 8000 ms. The resulting array is non-decreasing. For `maxRetries === 3` this
 * yields `[1000, 2000, 4000]`. Non-positive `maxRetries` yields `[]`.
 */
export function backoffSchedule(maxRetries: number): number[] {
  const count = Math.max(0, Math.floor(maxRetries));
  const schedule: number[] = [];
  for (let attempt = 0; attempt < count; attempt += 1) {
    const delay = BASE_DELAY_MS * FACTOR ** attempt;
    schedule.push(Math.min(delay, MAX_DELAY_MS));
  }
  return schedule;
}
