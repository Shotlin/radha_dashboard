// Feature: dashboard-production-ready, Property 23: Out-of-scope responses are rejected wholesale
//
// Validates: Requirements 8.6
//
// For any batch of records, if any record's tenantId/storeId is outside the
// active scope, `assertRecordsInScope` throws `CrossScopeError` (rejecting the
// whole batch); if all records are in-scope it does not throw.

import { describe, it, expect } from 'vitest';
import { assertProperty, fc } from '@/test/property';
import {
  assertRecordsInScope,
  CrossScopeError,
  CROSS_SCOPE,
  type Scoped,
  type StoreScope,
} from '@/lib/api/core/scope-guard';

// Small fixed pools so collisions (and genuine alternatives) are both reachable.
const TENANTS = ['t1', 't2', 't3'] as const;
const STORES = ['s1', 's2', 's3'] as const;
const ROLES = ['owner', 'admin', 'manager', 'staff', 'auditor'] as const;

/** Mirror of the guard's in-scope predicate, used only to sanity-check generators. */
function isInScope(record: Scoped, scope: StoreScope): boolean {
  if (record.tenantId !== scope.tenantId) return false;
  if (scope.storeId === null) return true;
  return record.storeId === null || record.storeId === scope.storeId;
}

/** Any active scope: a tenant, either a specific store or the rollup, and a role. */
const scopeArb: fc.Arbitrary<StoreScope> = fc.record({
  tenantId: fc.constantFrom(...TENANTS),
  storeId: fc.option(fc.constantFrom(...STORES), { nil: null }),
  role: fc.constantFrom(...ROLES),
});

/** A record guaranteed to be IN the given scope. */
function inScopeArb(scope: StoreScope): fc.Arbitrary<Scoped> {
  const storeId: fc.Arbitrary<string | null> =
    scope.storeId === null
      ? // Rollup: every store in the tenant (and tenant-level rows) is in scope.
        fc.option(fc.constantFrom(...STORES), { nil: null })
      : // Specific store: only the same store, or a tenant-level (null) record.
        fc.constantFrom<string | null>(scope.storeId, null);
  return storeId.map((s) => ({ tenantId: scope.tenantId, storeId: s }));
}

/** A record guaranteed to be OUT of the given scope. */
function outOfScopeArb(scope: StoreScope): fc.Arbitrary<Scoped> {
  const otherTenants = TENANTS.filter((t) => t !== scope.tenantId);
  // Always available: a different tenant entirely (any storeId is then out of scope).
  const wrongTenant: fc.Arbitrary<Scoped> = fc.record({
    tenantId: fc.constantFrom(...otherTenants),
    storeId: fc.option(fc.constantFrom(...STORES), { nil: null }),
  });
  if (scope.storeId === null) {
    // Under a rollup the only way out of scope is a foreign tenant.
    return wrongTenant;
  }
  // Same tenant but a different concrete store is also out of scope.
  const otherStores = STORES.filter((s) => s !== scope.storeId);
  const wrongStore: fc.Arbitrary<Scoped> = fc.record({
    tenantId: fc.constant(scope.tenantId),
    storeId: fc.constantFrom(...otherStores),
  });
  return fc.oneof(wrongTenant, wrongStore);
}

describe('assertRecordsInScope — Property 23: out-of-scope responses are rejected wholesale', () => {
  it('throws CrossScopeError when any record is out of scope (whole batch rejected)', () => {
    assertProperty(
      fc.property(
        scopeArb.chain((scope) =>
          fc.record({
            scope: fc.constant(scope),
            inScope: fc.array(inScopeArb(scope), { maxLength: 8 }),
            // At least one guaranteed out-of-scope record.
            outOfScope: fc.array(outOfScopeArb(scope), { minLength: 1, maxLength: 4 }),
            // Where to splice the out-of-scope records among the in-scope ones.
            insertAt: fc.nat(),
          }),
        ),
        ({ scope, inScope, outOfScope, insertAt }) => {
          const batch = [...inScope];
          const at = inScope.length === 0 ? 0 : insertAt % (inScope.length + 1);
          batch.splice(at, 0, ...outOfScope);

          // Sanity: the batch really does contain at least one out-of-scope record.
          expect(batch.some((r) => !isInScope(r, scope))).toBe(true);

          let thrown: unknown;
          expect(() => {
            try {
              assertRecordsInScope(batch, scope);
            } catch (e) {
              thrown = e;
              throw e;
            }
          }).toThrow(CrossScopeError);
          expect(thrown).toBeInstanceOf(CrossScopeError);
          expect((thrown as CrossScopeError).code).toBe(CROSS_SCOPE);
        },
      ),
    );
  });

  it('does not throw when every record is in scope', () => {
    assertProperty(
      fc.property(
        scopeArb.chain((scope) =>
          fc.record({
            scope: fc.constant(scope),
            records: fc.array(inScopeArb(scope), { maxLength: 12 }),
          }),
        ),
        ({ scope, records }) => {
          // Sanity: generator really produced only in-scope records.
          expect(records.every((r) => isInScope(r, scope))).toBe(true);
          expect(() => assertRecordsInScope(records, scope)).not.toThrow();
        },
      ),
    );
  });

  it('handles a single record (non-array) form for both in- and out-of-scope', () => {
    assertProperty(
      fc.property(
        scopeArb.chain((scope) =>
          fc.record({
            scope: fc.constant(scope),
            inScope: inScopeArb(scope),
            outOfScope: outOfScopeArb(scope),
          }),
        ),
        ({ scope, inScope, outOfScope }) => {
          expect(() => assertRecordsInScope(inScope, scope)).not.toThrow();
          expect(() => assertRecordsInScope(outOfScope, scope)).toThrow(CrossScopeError);
        },
      ),
    );
  });
});
