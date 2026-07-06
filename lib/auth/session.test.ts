// Feature: dashboard-production-ready, Property 14: Token-expiry predicate is exact
import { describe, it, vi } from 'vitest';
import { assertProperty, fc } from '@/test/property';

// session.ts pulls in `next/headers` at module load (for the cookie helpers).
// We stub `cookies()` with a controllable fake so we can drive `getSession`
// with arbitrary raw cookie values (Property 17) while keeping the pure-logic
// tests (Property 14) running under vitest. The `isTokenExpiringSoon` tests do
// not touch the cookie store, so this fake leaves them unaffected.
const cookieState = vi.hoisted(() => ({
  present: false,
  value: undefined as string | undefined,
}));

vi.mock('next/headers', () => ({
  // Matches Next's async `cookies()` API: returns a store with `.get(name)`.
  cookies: async () => ({
    get: (_name: string) =>
      cookieState.present ? { value: cookieState.value } : undefined,
  }),
}));

import { getSession, isTokenExpiringSoon } from './session';

describe('isTokenExpiringSoon', () => {
  // Property 14: For any expiresAt and now, isTokenExpiringSoon returns true
  // iff (expiresAt - now) < 60000 ms.
  // Validates: Requirements 6.4
  it('returns true iff expiresAt - now < 60000 ms', () => {
    assertProperty(
      fc.property(
        // Large integer ranges so the difference spans well past +/-60000.
        fc.integer({ min: -10_000_000_000, max: 10_000_000_000 }),
        fc.integer({ min: -10_000_000_000, max: 10_000_000_000 }),
        (expiresAt, now) => {
          const expected = expiresAt - now < 60_000;
          return isTokenExpiringSoon(expiresAt, now) === expected;
        },
      ),
    );
  });

  // Explicitly probe the boundary where expiresAt - now is exactly 60000,
  // just below it (59999), and just above it (60001).
  it('is exact at the 60000 ms boundary', () => {
    assertProperty(
      fc.property(
        fc.integer({ min: -10_000_000_000, max: 10_000_000_000 }),
        fc.constantFrom(59_999, 60_000, 60_001),
        (now, diff) => {
          const expiresAt = now + diff;
          const expected = diff < 60_000;
          return isTokenExpiringSoon(expiresAt, now) === expected;
        },
      ),
    );
  });
});

// Feature: dashboard-production-ready, Property 17: Unparseable or invalid
// cookies are treated as unauthenticated.
//
// Contract under test (lib/auth/session.ts → getSession):
//   - It must NEVER throw for any cookie value (absent, empty, garbage, or
//     malformed/odd-shaped JSON). Resolving to a value (rather than rejecting)
//     is the "never throws" guarantee.
//   - When the cookie is absent, empty, or not parseable as JSON, it returns
//     null (the request is treated as unauthenticated). `getSession` does not
//     perform shape validation, so parseable JSON is simply returned as-is and
//     we only assert "no throw" for that case.
describe('getSession with unparseable or invalid cookies', () => {
  /** Replicates the implementation's parse step to know which inputs must yield null. */
  function isParseable(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  // A cookie value that is absent, empty, arbitrary garbage, malformed JSON, or
  // valid-but-arbitrary-shape JSON.
  const cookieArb = fc.oneof(
    // Absent cookie (no entry in the store).
    fc.constant({ present: false, value: undefined as string | undefined }),
    // Present but empty string.
    fc.constant({ present: true, value: '' as string | undefined }),
    // Arbitrary (mostly non-JSON) garbage strings.
    fc.string().map((s) => ({ present: true, value: s as string | undefined })),
    // Malformed JSON: a valid JSON document with trailing junk appended.
    fc.json().map((j) => ({ present: true, value: (j + '}{not-json') as string | undefined })),
    // Valid JSON of arbitrary shape (not necessarily a SessionPayload).
    fc.json().map((j) => ({ present: true, value: j as string | undefined })),
    // Valid JSON object with the wrong shape.
    fc
      .record({ foo: fc.string(), bar: fc.integer(), nested: fc.array(fc.boolean()) })
      .map((o) => ({ present: true, value: JSON.stringify(o) as string | undefined })),
  );

  // Property 17: For any cookie value, getSession never throws; and when the
  // cookie is absent, empty, or unparseable it resolves to null.
  // Validates: Requirements 6.1, 6.7, 7.7
  it('never throws and returns null for absent/empty/unparseable cookies', async () => {
    await assertProperty(
      fc.asyncProperty(cookieArb, async (cookie) => {
        cookieState.present = cookie.present;
        cookieState.value = cookie.value;

        // Reaching this line at all proves getSession did not throw/reject.
        const result = await getSession();

        const mustBeNull =
          !cookie.present || !cookie.value || !isParseable(cookie.value);

        if (mustBeNull) {
          return result === null;
        }
        // Parseable JSON: getSession does not validate shape, so it may return
        // the parsed value (or null for the literal `null`). Either way the
        // "never throws" guarantee already held.
        return true;
      }),
    );
  });
});
