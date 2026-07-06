import fc from 'fast-check';

/**
 * Shared property-based-test configuration for the dashboard spec.
 *
 * Every property test in this spec MUST run a minimum of 100 generated cases
 * (Requirements 1.1, 9.1 — test infrastructure for all properties). Use these
 * helpers instead of calling `fc.assert` directly so the `numRuns: 100` floor
 * is enforced in one place and cannot drift per-test.
 *
 * Usage:
 *   import { assertProperty } from '@/test/property';
 *   assertProperty(fc.property(fc.integer(), (n) => n + 0 === n));
 *
 * To raise the case count for a specific test, pass `numRuns` >= 100; lower
 * values are clamped up to 100.
 */

/** Minimum number of generated cases for every property test in this spec. */
export const MIN_PROPERTY_RUNS = 100;

export type PropertyParameters = Parameters<typeof fc.assert>[1];

/**
 * Run a fast-check property with the spec's enforced minimum of 100 runs.
 * Any provided `numRuns` below the floor is clamped up to `MIN_PROPERTY_RUNS`.
 *
 * Returns whatever `fc.assert` returns: `void` for synchronous properties and a
 * `Promise<void>` for async properties (`fc.asyncProperty`). Callers running an
 * async property MUST `await` the result so generated cases are awaited before
 * the test completes.
 */
export function assertProperty(
  property: Parameters<typeof fc.assert>[0],
  params?: PropertyParameters,
): void | Promise<void> {
  const numRuns = Math.max(params?.numRuns ?? MIN_PROPERTY_RUNS, MIN_PROPERTY_RUNS);
  return fc.assert(property, { ...params, numRuns });
}

export { fc };
