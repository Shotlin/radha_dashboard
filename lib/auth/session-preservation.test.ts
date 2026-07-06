// Feature: dashboard-production-ready, Property 12: Transient /me failures preserve the session
import { describe, expect, it } from 'vitest';
import { assertProperty, fc } from '@/test/property';
import { isTransient } from '@/lib/auth/retry';

/**
 * Property 12: Transient `/me` failures preserve the session
 *
 * For any transient error (HTTP 502/503/504, request timeout, or no network
 * response) while the session cookie is valid, the Session_Manager decision is
 * to KEEP the session — it does not clear the cookie and does not redirect to
 * login. A hard auth failure (HTTP 401) instead CLEARS the session.
 *
 * This mirrors the wiring in `lib/api/core/api-fetch.ts`, where the keep/clear
 * outcome of an `/auth/me` failure is decided directly by the exported pure
 * `isTransient` classifier: when `isTransient(outcome)` is true the request is
 * retried with backoff and, on exhaustion, a NON-FATAL error is surfaced while
 * the cookie is retained; a 401 takes the refresh-or-end-session path (clear).
 * The decision below is the pure projection of that branch.
 *
 * Validates: Requirements 6.2
 */

/** Failure outcomes the `/auth/me` probe can encounter. */
type MeFailure = number | 'timeout' | 'no-response';

/** The keep/clear decision the Session_Manager makes for an `/auth/me` failure. */
type SessionDecision = 'keep' | 'clear';

/**
 * Pure projection of the api-fetch.ts `/auth/me` failure branch: a transient
 * outcome retains the session ('keep'); a 401 (hard auth failure) clears it.
 * Built directly on the exported `isTransient` so the property exercises the
 * real classifier that drives the production decision.
 */
function decideSessionOnMeFailure(outcome: MeFailure): SessionDecision {
  if (isTransient(outcome)) return 'keep';
  return 'clear';
}

const TRANSIENT_OUTCOMES: MeFailure[] = [502, 503, 504, 'timeout', 'no-response'];

describe('Property 12: transient /me failures preserve the session', () => {
  it('every enumerated transient outcome keeps the session (no clear, no redirect)', () => {
    for (const outcome of TRANSIENT_OUTCOMES) {
      expect(isTransient(outcome)).toBe(true);
      expect(decideSessionOnMeFailure(outcome)).toBe('keep');
    }
  });

  it('a 401 hard auth failure clears the session', () => {
    expect(isTransient(401)).toBe(false);
    expect(decideSessionOnMeFailure(401)).toBe('clear');
  });

  // Property: for any transient classification, the decision is always 'keep'.
  it('classified-transient outcomes always decide keep', () => {
    assertProperty(
      fc.property(fc.constantFrom<MeFailure>(...TRANSIENT_OUTCOMES), (outcome) => {
        expect(isTransient(outcome)).toBe(true);
        expect(decideSessionOnMeFailure(outcome)).toBe('keep');
      }),
    );
  });

  // Property: across the whole HTTP status space, the keep-decision holds iff
  // the status is transient (502/503/504); every non-transient status clears.
  it('transient ⇒ keep and non-transient ⇒ clear across all HTTP statuses', () => {
    assertProperty(
      fc.property(fc.integer({ min: 100, max: 599 }), (status) => {
        const transient = status === 502 || status === 503 || status === 504;
        expect(isTransient(status)).toBe(transient);
        expect(decideSessionOnMeFailure(status)).toBe(transient ? 'keep' : 'clear');
      }),
    );
  });

  // Property: a 401 is never classified transient and never keeps the session,
  // no matter what other transient outcomes coexist in the same run.
  it('401 is never transient and never preserves the session', () => {
    assertProperty(
      fc.property(fc.constantFrom<MeFailure>(...TRANSIENT_OUTCOMES), (transientOutcome) => {
        // The transient outcome keeps the session...
        expect(decideSessionOnMeFailure(transientOutcome)).toBe('keep');
        // ...while a 401 in the same world clears it.
        expect(decideSessionOnMeFailure(401)).toBe('clear');
      }),
    );
  });
});
