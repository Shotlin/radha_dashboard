// Feature: dashboard-production-ready, Property 21: Selectable store is clamped to assigned stores
//
// use-store-scope.ts is a `'use client'` module that imports `next/navigation`
// and `@/lib/auth/use-session` at the top level. Those modules are not available
// (or not meaningful) under the jsdom/vitest test runner, so we mock them with
// `vi.mock(...)` purely so the pure named exports (`clampStoreScope`,
// `canUseRollup`) can be imported and exercised in isolation.
import { describe, it, expect, vi } from 'vitest';
import { assertProperty, fc } from '@/test/property';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: () => {} }),
  usePathname: () => '/',
}));

vi.mock('@/lib/auth/use-session', () => ({
  useSession: () => ({ user: null }),
}));

import { clampStoreScope, canUseRollup } from '@/lib/hooks/use-store-scope';
import type { Role } from '@/lib/permissions';

const ALL_ROLES: readonly Role[] = ['owner', 'admin', 'manager', 'staff', 'auditor'];
const PRIVILEGED_ROLES: readonly Role[] = ['owner', 'admin'];
const NON_PRIVILEGED_ROLES: readonly Role[] = ['manager', 'staff', 'auditor'];

const roleArb = fc.constantFrom<Role>(...ALL_ROLES);
const nonPrivilegedRoleArb = fc.constantFrom<Role>(...NON_PRIVILEGED_ROLES);
const privilegedRoleArb = fc.constantFrom<Role>(...PRIVILEGED_ROLES);

// Store ids drawn from a small pool so generated "assigned" and "requested"
// sets overlap often, exercising the assigned / unassigned / rollup branches.
const storeIdArb = fc.constantFrom('s1', 's2', 's3', 's4', 's5');
const assignedStoreIdsArb = fc.uniqueArray(storeIdArb, { maxLength: 5 });

/**
 * A requested storeId spanning the three meaningful shapes the property calls
 * out: the rollup (`null`), a store that is in the assignments, and a store
 * outside the assignments. Because `requested` and `assigned` are both drawn
 * from the same small `storeIdArb` pool, generated runs frequently produce both
 * the assigned-store and the unassigned-store cases.
 */
const requestedStoreArb = fc.option(storeIdArb, { nil: null });

describe('canUseRollup', () => {
  it('admits the rollup for owner/admin only', () => {
    assertProperty(
      fc.property(roleArb, (role) => {
        expect(canUseRollup(role)).toBe(role === 'owner' || role === 'admin');
      }),
    );
  });
});

describe('clampStoreScope — Property 21: Selectable store is clamped to assigned stores', () => {
  // Validates: Requirements 8.5
  it('for a non-owner/non-admin role, the result is null or a member of assignedStoreIds — never an outside store', () => {
    assertProperty(
      fc.property(
        nonPrivilegedRoleArb,
        assignedStoreIdsArb,
        requestedStoreArb,
        (role, assigned, requested) => {
          const result = clampStoreScope(role, requested, assigned);
          if (result === null) {
            // null is only permitted when there are no assignments at all.
            return assigned.length === 0;
          }
          return assigned.includes(result);
        },
      ),
    );
  });

  // Validates: Requirements 8.5
  it('clamps to the first assigned store whenever assignments exist (never the rollup)', () => {
    assertProperty(
      fc.property(
        nonPrivilegedRoleArb,
        fc.uniqueArray(storeIdArb, { minLength: 1, maxLength: 5 }),
        requestedStoreArb,
        (role, assigned, requested) => {
          const result = clampStoreScope(role, requested, assigned);
          // Never the rollup when assignments exist.
          expect(result).not.toBeNull();
          if (requested !== null && assigned.includes(requested)) {
            // An assigned request is honored as-is.
            expect(result).toBe(requested);
          } else {
            // A rollup or unassigned request collapses to the first assignment.
            expect(result).toBe(assigned[0]);
          }
        },
      ),
    );
  });

  // Validates: Requirements 8.5
  it('clamps to null only when a non-privileged role has no assigned stores', () => {
    assertProperty(
      fc.property(nonPrivilegedRoleArb, fc.option(storeIdArb, { nil: null }), (role, requested) => {
        expect(clampStoreScope(role, requested, [])).toBeNull();
      }),
    );
  });

  // Validates: Requirements 8.5 — never leaks an out-of-assignment store.
  it('never returns a store outside the assignments for a non-privileged role', () => {
    assertProperty(
      fc.property(
        nonPrivilegedRoleArb,
        assignedStoreIdsArb,
        fc.option(storeIdArb, { nil: null }),
        (role, assigned, requested) => {
          const result = clampStoreScope(role, requested, assigned);
          if (result !== null) {
            expect(assigned).toContain(result);
          }
        },
      ),
    );
  });

  // Validates: Requirements 8.5 — owner/admin are exempt: the request passes through.
  it('returns the requested store as-is for owner/admin (including the rollup and outside stores)', () => {
    assertProperty(
      fc.property(
        privilegedRoleArb,
        fc.option(storeIdArb, { nil: null }),
        assignedStoreIdsArb,
        (role, requested, assigned) => {
          expect(clampStoreScope(role, requested, assigned)).toBe(requested);
        },
      ),
    );
  });
});

// Feature: dashboard-production-ready, Property 22: Rollup view is shown only to
// owner/admin with no store selected. The "all stores" rollup is the effective
// scope `storeId === null`; it is permitted iff the role is owner/admin AND no
// specific store is selected. For every other role the effective scope is never
// the rollup when assignments exist (it is gated away to an assigned store).
describe('Property 22: Rollup view is shown only to owner/admin with no store selected', () => {
  // Validates: Requirements 8.2 — the rollup gate admits owner/admin only.
  it('canUseRollup(role) is true iff role is owner or admin', () => {
    assertProperty(
      fc.property(roleArb, (role) => {
        expect(canUseRollup(role)).toBe(PRIVILEGED_ROLES.includes(role));
      }),
    );
  });

  // Validates: Requirements 8.2 — non-privileged roles never reach the rollup
  // when they have assignments; the null scope is gated away.
  it('never yields the rollup (null) for a non-privileged role when assignments exist', () => {
    assertProperty(
      fc.property(
        nonPrivilegedRoleArb,
        fc.uniqueArray(storeIdArb, { minLength: 1, maxLength: 5 }),
        requestedStoreArb,
        (role, assigned, requested) => {
          const result = clampStoreScope(role, requested, assigned);
          // The rollup is gated away: a non-privileged role with assignments is
          // always pinned to a concrete (assigned) store, never the rollup.
          expect(result).not.toBeNull();
          expect(assigned).toContain(result as string);
        },
      ),
    );
  });

  // Validates: Requirements 8.2 — owner/admin with no store selected (null
  // request) are granted the rollup regardless of any assignment list.
  it('grants the rollup (null) to owner/admin when no specific store is selected', () => {
    assertProperty(
      fc.property(privilegedRoleArb, assignedStoreIdsArb, (role, assigned) => {
        expect(clampStoreScope(role, null, assigned)).toBeNull();
      }),
    );
  });

  // Validates: Requirements 8.2 — the iff, end to end: the effective scope is the
  // rollup precisely when the role may use it AND no specific store is requested.
  it('effective scope is the rollup iff role may roll up and no specific store is requested', () => {
    assertProperty(
      fc.property(
        roleArb,
        requestedStoreArb,
        assignedStoreIdsArb,
        (role, requested, assigned) => {
          const isRollup = clampStoreScope(role, requested, assigned) === null;
          // Owner/admin roll up exactly when nothing specific is requested. A
          // non-privileged role only "rolls up" degenerately (no assignments at
          // all), which is the no-access case, never a true multi-store view.
          const expected = canUseRollup(role)
            ? requested === null
            : assigned.length === 0;
          expect(isRollup).toBe(expected);
        },
      ),
    );
  });
});
