// Feature: dashboard-production-ready, Property 13: Retry backoff schedule is bounded and monotonic
import { describe, expect, it } from 'vitest';
import { assertProperty, fc } from '@/test/property';
import { backoffSchedule, isTransient } from '@/lib/auth/retry';

/**
 * Property 13: Retry backoff schedule is bounded and monotonic
 *
 * For any retry count up to the maximum of 3, `backoffSchedule` produces delays
 * starting at 1000 ms, growing by a factor of two, each capped at 8000 ms and
 * non-decreasing (i.e. `[1000, 2000, 4000]` for 3).
 *
 * Validates: Requirements 6.3
 */
describe('backoffSchedule — Property 13: bounded and monotonic', () => {
  const BASE = 1000;
  const FACTOR = 2;
  const CAP = 8000;

  it('produces the exact canonical schedule [1000, 2000, 4000] for the max of 3 retries', () => {
    expect(backoffSchedule(3)).toEqual([1000, 2000, 4000]);
  });

  it('length equals the requested count for counts up to a sensible bound', () => {
    assertProperty(
      fc.property(fc.integer({ min: 0, max: 12 }), (count) => {
        expect(backoffSchedule(count)).toHaveLength(count);
      }),
    );
  });

  it('first delay is 1000 ms whenever the count is at least 1', () => {
    assertProperty(
      fc.property(fc.integer({ min: 1, max: 12 }), (count) => {
        const schedule = backoffSchedule(count);
        expect(schedule[0]).toBe(BASE);
      }),
    );
  });

  it('every element is positive and capped at 8000 ms', () => {
    assertProperty(
      fc.property(fc.integer({ min: 0, max: 20 }), (count) => {
        for (const delay of backoffSchedule(count)) {
          expect(delay).toBeGreaterThan(0);
          expect(delay).toBeLessThanOrEqual(CAP);
        }
      }),
    );
  });

  it('the sequence is non-decreasing', () => {
    assertProperty(
      fc.property(fc.integer({ min: 0, max: 20 }), (count) => {
        const schedule = backoffSchedule(count);
        for (let i = 1; i < schedule.length; i += 1) {
          expect(schedule[i]).toBeGreaterThanOrEqual(schedule[i - 1]);
        }
      }),
    );
  });

  it('each delay equals base*factor^i capped at 8000 (growth by factor 2 until the cap)', () => {
    assertProperty(
      fc.property(fc.integer({ min: 0, max: 20 }), (count) => {
        const schedule = backoffSchedule(count);
        schedule.forEach((delay, i) => {
          expect(delay).toBe(Math.min(BASE * FACTOR ** i, CAP));
        });
      }),
    );
  });

  it('non-positive counts yield an empty schedule', () => {
    assertProperty(
      fc.property(fc.integer({ min: -20, max: 0 }), (count) => {
        expect(backoffSchedule(count)).toEqual([]);
      }),
    );
  });
});

/**
 * Companion classification check for `isTransient`: 502/503/504, 'timeout', and
 * 'no-response' are transient; every other status (200/400/401/500, etc.) is not.
 *
 * Validates: Requirements 6.3
 */
describe('isTransient — transient-failure classification', () => {
  it('classifies 502/503/504 and timeout/no-response as transient', () => {
    expect(isTransient(502)).toBe(true);
    expect(isTransient(503)).toBe(true);
    expect(isTransient(504)).toBe(true);
    expect(isTransient('timeout')).toBe(true);
    expect(isTransient('no-response')).toBe(true);
  });

  it('classifies common non-transient statuses (200/400/401/500) as non-transient', () => {
    expect(isTransient(200)).toBe(false);
    expect(isTransient(400)).toBe(false);
    expect(isTransient(401)).toBe(false);
    expect(isTransient(500)).toBe(false);
    expect(isTransient(501)).toBe(false);
  });

  it('only 502, 503, 504 are transient among all HTTP status codes', () => {
    assertProperty(
      fc.property(fc.integer({ min: 100, max: 599 }), (status) => {
        const transient = status === 502 || status === 503 || status === 504;
        expect(isTransient(status)).toBe(transient);
      }),
    );
  });
});
