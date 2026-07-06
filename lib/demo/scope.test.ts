// Feature: dashboard-production-ready, Property 3: Scope filtering keeps only in-scope records
//
// Validates: Requirements 1.4, 8.4
//
// Property 3 (design.md): For any set of scoped records and any active StoreScope,
// `filterByScope` returns exactly the records whose `tenantId` matches the scope and
// whose `storeId` matches the scope (or is a tenant-level record `storeId === null`
// under a rollup), and excludes every record whose `tenantId` or `storeId` differs.

import { describe, it, expect } from 'vitest';
import { assertProperty, fc } from '@/test/property';
import { filterByScope } from '@/lib/demo/scope';
import type { Scoped, StoreScope } from '@/lib/api/core/scope-types';
import type { Role } from '@/lib/permissions';

// A record carries a unique `id` payload alongside its scope tags so the test can
// assert that filtering preserves record identity (no fabrication, no duplication).
interface TestRecord extends Scoped {
  id: number;
}

const ROLES: Role[] = ['owner', 'admin', 'manager', 'staff', 'auditor'];

// Small, overlapping pools make tenant/store collisions frequent, so generated
// cases actually exercise matches, cross-tenant exclusions, cross-store exclusions,
// tenant-level (`storeId === null`) records, and the rollup (`scope.storeId === null`)
// branch — rather than near-always-distinct UUIDs that would never match.
const tenantArb = fc.constantFrom('t1', 't2', 't3');
const storeIdArb = fc.constantFrom<string | null>('s1', 's2', 's3', null);
const roleArb = fc.constantFrom(...ROLES);

const recordArb: fc.Arbitrary<Omit<TestRecord, 'id'>> = fc.record({
  tenantId: tenantArb,
  storeId: storeIdArb,
});

const recordsArb: fc.Arbitrary<TestRecord[]> = fc
  .array(recordArb, { maxLength: 30 })
  .map((rs) => rs.map((r, id) => ({ ...r, id })));

const scopeArb: fc.Arbitrary<StoreScope> = fc.record({
  tenantId: tenantArb,
  storeId: storeIdArb,
  role: roleArb,
});

/**
 * Independent reference predicate for "in scope", derived directly from the
 * Property 3 statement (not from the implementation under test).
 */
function inScope(r: Scoped, scope: StoreScope): boolean {
  if (r.tenantId !== scope.tenantId) return false; // different tenant => excluded
  if (scope.storeId === null) return true; // rollup => all stores in tenant
  return r.storeId === null || r.storeId === scope.storeId; // tenant-level or same store
}

describe('filterByScope — Property 3: scope filtering keeps only in-scope records', () => {
  it('returns exactly the in-scope records, in their original order', () => {
    assertProperty(
      fc.property(recordsArb, scopeArb, (records, scope) => {
        const result = filterByScope(records, scope);

        // Exactly the records the reference predicate keeps, in input order.
        const expected = records.filter((r) => inScope(r, scope));
        expect(result).toEqual(expected);
      }),
    );
  });

  it('keeps only records whose tenant and store match the active scope', () => {
    assertProperty(
      fc.property(recordsArb, scopeArb, (records, scope) => {
        for (const r of filterByScope(records, scope)) {
          // Tenant must always match.
          expect(r.tenantId).toBe(scope.tenantId);
          if (scope.storeId !== null) {
            // Under a specific store, only that store or a tenant-level record.
            expect(r.storeId === null || r.storeId === scope.storeId).toBe(true);
          }
        }
      }),
    );
  });

  it('excludes every record whose tenantId or storeId differs from the scope', () => {
    assertProperty(
      fc.property(recordsArb, scopeArb, (records, scope) => {
        const kept = new Set(filterByScope(records, scope).map((r) => r.id));
        for (const r of records) {
          if (!inScope(r, scope)) {
            expect(kept.has(r.id)).toBe(false);
          }
        }
      }),
    );
  });

  it('never fabricates or duplicates records (output is a subsequence of the input)', () => {
    assertProperty(
      fc.property(recordsArb, scopeArb, (records, scope) => {
        const result = filterByScope(records, scope);
        // No more records than the input, and every result id is a distinct input id.
        expect(result.length).toBeLessThanOrEqual(records.length);
        const inputIds = new Set(records.map((r) => r.id));
        const seen = new Set<number>();
        for (const r of result) {
          expect(inputIds.has(r.id)).toBe(true);
          expect(seen.has(r.id)).toBe(false);
          seen.add(r.id);
        }
      }),
    );
  });
});
