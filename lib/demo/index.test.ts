// Feature: dashboard-production-ready, Property 1: Demo datasets meet coverage minimums
//
// Validates: Requirements 1.1
//
// Property 1 (design.md): For any Feature_Area, the demo dataset returned by
// `getDemoDataset(area, scope)` provides at least one record for every primary
// region and at least five records for every list or table region.
//
// The Demo_Data_Provider modules under `lib/demo/data/*` are `import 'server-only'`;
// vitest aliases `server-only` to a noop stub (see vitest.config.ts) so this pure
// logic is testable without a backend. Each dataset region is the output of
// `filterByScope`, so coverage must hold for every valid demo scope — both the
// owner/admin "all stores" rollup (`storeId === null`) and each individual demo
// store. Tenant-level records (`storeId === null`) are rollup-visible and also
// surface under a single store, which is how list regions keep ≥5 records under any
// scope while per-store records still demonstrate filtering.

import { describe, it, expect } from 'vitest';
import { assertProperty, fc } from '@/test/property';
import { getDemoDataset, type FeatureArea } from '@/lib/demo';
import type { StoreScope } from '@/lib/api/core/scope-types';
import type { Role } from '@/lib/permissions';

/** The demo tenant every `lib/demo/data/*` module tags its records with. */
const DEMO_TENANT = 'demo-tenant-001';

/** The demo stores plus the owner/admin "all stores" rollup (`null`). */
const DEMO_STORES: ReadonlyArray<string | null> = [null, 'demo-store-001', 'demo-store-002'];

/** Roles for which the "all stores" rollup (`storeId === null`) is valid (R8.2). */
const ROLLUP_ROLES: Role[] = ['owner', 'admin'];

/** All 13 dashboard Feature_Areas that have a registered demo dataset (R1.3). */
const FEATURE_AREAS: FeatureArea[] = [
  'overview',
  'analytics',
  'audit',
  'expiry',
  'grn',
  'inventory',
  'tasks',
  'billing',
  'suppliers',
  'reports',
  'notifications',
  'settings',
  'admin',
];

// Per-Feature_Area classification of which regions are list/table regions (R1.1:
// ≥5 records). Every region NOT listed here is a primary region (≥1 record) —
// KPI tiles, gauges, single-record summaries, and per-store rollups. This map
// encodes the design's primary-vs-list distinction; the test then verifies the
// actual dataset meets the corresponding minimum under every valid demo scope,
// so a regression that drains a list region below 5 (or empties a primary region)
// is caught.
const LIST_REGIONS: Record<FeatureArea, readonly string[]> = {
  overview: ['trends', 'alerts', 'activity'],
  analytics: ['scanTrends', 'topProducts', 'categoryBreakdown'],
  audit: ['eanLists', 'items', 'scanSessions'],
  expiry: ['list', 'calendar', 'thresholds'],
  grn: ['list', 'items', 'suppliersSummary'],
  inventory: ['list', 'lowStock', 'movements'],
  tasks: ['list', 'activity'],
  billing: ['plans', 'usage', 'invoices'],
  suppliers: ['list', 'topSuppliers', 'contacts'],
  reports: ['available', 'recent', 'scheduled'],
  notifications: ['list', 'channels'],
  settings: ['members', 'integrations'],
  admin: ['tenants', 'flags', 'webhooks', 'auditLogs'],
};

const PRIMARY_MIN = 1;
const LIST_MIN = 5;

/**
 * Count the records a region holds. Regions are arrays of scoped records; a
 * non-array value counts as a single present record when defined (a primary
 * region may be a single object) and as zero when null/undefined.
 */
function regionCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value === null || value === undefined) return 0;
  return 1;
}

// A valid demo scope: the demo tenant, one of the demo stores (or the rollup),
// and a role for which that scope is valid. Generating both stores and the
// rollup ensures the ≥5 minimum holds even when a single store is selected.
const scopeArb: fc.Arbitrary<StoreScope> = fc
  .record({
    storeId: fc.constantFrom(...DEMO_STORES),
    role: fc.constantFrom(...ROLLUP_ROLES),
  })
  .map(({ storeId, role }) => ({ tenantId: DEMO_TENANT, storeId, role }));

describe('getDemoDataset — Property 1: demo datasets meet coverage minimums', () => {
  it('returns ≥1 record for every primary region and ≥5 for every list/table region, for every Feature_Area and scope', () => {
    assertProperty(
      fc.property(scopeArb, (scope) => {
        for (const area of FEATURE_AREAS) {
          const dataset = getDemoDataset(area, scope);

          // Every Feature_Area has a registered dataset (R1.3) — never null here.
          expect(dataset, `dataset for "${area}"`).not.toBeNull();
          const regions = dataset!.regions;

          const listRegions = LIST_REGIONS[area];

          // Every region the page renders meets its minimum for this scope.
          for (const [name, value] of Object.entries(regions)) {
            const isList = listRegions.includes(name);
            const min = isList ? LIST_MIN : PRIMARY_MIN;
            const kind = isList ? 'list/table' : 'primary';
            const count = regionCount(value);

            expect(
              count,
              `${area}.${name} (${kind}) under scope ${JSON.stringify(scope)} has ${count} records, expected >= ${min}`,
            ).toBeGreaterThanOrEqual(min);

            // A list/table region must actually be a collection of records.
            if (isList) {
              expect(Array.isArray(value), `${area}.${name} must be an array`).toBe(true);
            }
          }

          // Every region classified as a list/table region must exist in the dataset.
          for (const listName of listRegions) {
            expect(
              Object.prototype.hasOwnProperty.call(regions, listName),
              `${area}.${listName} list region present`,
            ).toBe(true);
          }
        }
      }),
    );
  });
});
