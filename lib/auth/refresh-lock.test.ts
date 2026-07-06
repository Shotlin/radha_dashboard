// Feature: dashboard-production-ready, Property 16: Token refresh is single-flight under concurrency
import { describe, expect, it } from 'vitest';
import { assertProperty, fc } from '@/test/property';
import { refreshOnce, type RefreshResult } from '@/lib/auth/refresh-lock';

/**
 * A deferred promise whose resolution the test controls, so we can hold a
 * refresh "in flight" while we fire concurrent callers at `refreshOnce`.
 */
interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/**
 * Property 16: Token refresh is single-flight under concurrency
 *
 * For any number N >= 2 of concurrent callers invoking `refreshOnce(run)` while
 * a refresh is in flight, `run` is invoked at most once and all N callers
 * receive the same refreshed result. Once the in-flight promise settles the
 * lock is cleared, so a subsequent call invokes `run` again.
 *
 * Validates: Requirements 6.6
 */
describe('refreshOnce — Property 16: single-flight under concurrency', () => {
  it('invokes run once for N>=2 concurrent callers and resolves them all with the same result', async () => {
    await assertProperty(
      fc.asyncProperty(
        // N concurrent callers (>= 2), plus a generated successful refresh result.
        fc.integer({ min: 2, max: 8 }),
        fc.record({
          accessToken: fc.string(),
          refreshToken: fc.string(),
          expiresAt: fc.integer({ min: 0 }),
        }),
        async (n, payload) => {
          let runCalls = 0;
          const pending = deferred<RefreshResult>();
          const run = (): Promise<RefreshResult> => {
            runCalls += 1;
            return pending.promise;
          };

          // Fire N concurrent callers *before* the in-flight refresh settles.
          const callers = Array.from({ length: n }, () => refreshOnce(run));

          // While the refresh is in flight, run must have been invoked at most
          // once across all N concurrent callers.
          expect(runCalls).toBe(1);

          // Settle the in-flight refresh, then every caller resolves identically.
          const expected: RefreshResult = { ok: true, ...payload };
          pending.resolve(expected);
          const results = await Promise.all(callers);

          for (const result of results) {
            expect(result).toEqual(expected);
            // Same shared promise => same resolved reference for all callers.
            expect(result).toBe(results[0]);
          }
          expect(runCalls).toBe(1);

          // After settle the lock is cleared: a fresh call invokes run again.
          let secondRunCalls = 0;
          const second = await refreshOnce<RefreshResult>(() => {
            secondRunCalls += 1;
            return Promise.resolve({ ok: false });
          });
          expect(secondRunCalls).toBe(1);
          expect(second).toEqual({ ok: false });
        },
      ),
    );
  });

  it('clears the lock on rejection so a subsequent call can refresh again', async () => {
    await assertProperty(
      fc.asyncProperty(fc.integer({ min: 2, max: 8 }), async (n) => {
        let runCalls = 0;
        const pending = deferred<RefreshResult>();
        const failing = (): Promise<RefreshResult> => {
          runCalls += 1;
          // Reject via a rejected continuation of the controlled promise.
          return pending.promise.then(() => {
            throw new Error('refresh failed');
          });
        };

        const callers = Array.from({ length: n }, () => refreshOnce(failing));
        expect(runCalls).toBe(1);

        pending.resolve({ ok: false });
        // All concurrent callers observe the same rejection.
        const settled = await Promise.allSettled(callers);
        for (const outcome of settled) {
          expect(outcome.status).toBe('rejected');
        }
        expect(runCalls).toBe(1);

        // Lock cleared on settle (even on failure): the next call runs again.
        let nextRunCalls = 0;
        const next = await refreshOnce<RefreshResult>(() => {
          nextRunCalls += 1;
          return Promise.resolve({ ok: false });
        });
        expect(nextRunCalls).toBe(1);
        expect(next).toEqual({ ok: false });
      }),
    );
  });
});
