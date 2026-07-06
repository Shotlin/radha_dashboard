// Feature: dashboard-production-ready, Property 4: Demo-origin data never appears when demo mode is off
//
// Validates: Requirements 2.4, 2.5
//
// For any backend result and any scope, when demo mode is inactive the value
// returned by `resolveFeatureData` is sourced only from the backend (or is
// `empty`/`error`) and contains no value originating from the
// Demo_Data_Provider. Concretely: with `isDemo: false` a non-empty in-scope
// backend payload resolves to `{ kind: 'ok', data }` where `data` IS the exact
// backend payload, `selectDemo` is NEVER invoked, and the returned value is
// never the distinct demo sentinel.
//
// NOTE: tasks 2.5 / 3.4 / 3.6 / 3.7 also target this file. This block uses a
// uniquely-named `describe` and only the Property-4 helpers below; append new
// blocks rather than editing this one.

import { describe, it, expect } from 'vitest';
import { assertProperty, fc } from '@/test/property';
import { resolveFeatureData, type ResolveArgs } from '@/lib/api/core/resolve';
import { getDemoDataset, type FeatureArea, type DemoDataset } from '@/lib/demo';
import type { StoreScope } from '@/lib/api/core/scope-types';

const FEATURE_AREAS = [
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
] as const;

const TENANTS = ['t1', 't2', 't3'] as const;
const STORES = ['s1', 's2', 's3'] as const;
const ROLES = ['owner', 'admin', 'manager', 'staff', 'auditor'] as const;

/** Any active tenant/store scope (specific store or the rollup). */
const scopeArb: fc.Arbitrary<StoreScope> = fc.record({
  tenantId: fc.constantFrom(...TENANTS),
  storeId: fc.option(fc.constantFrom(...STORES), { nil: null }),
  role: fc.constantFrom(...ROLES),
});

/**
 * A unique marker stamped onto every generated backend payload so an assertion
 * can prove the resolved value truly originated from `fetchReal` and not from
 * any demo source. The demo sentinel below is a DISTINCT object that carries no
 * such marker.
 */
const BACKEND_MARKER = '__from_backend__';

/** A backend record tagged as backend-origin and varied in shape. */
const backendRecordArb = fc.record({
  origin: fc.constant(BACKEND_MARKER),
  id: fc.string({ minLength: 1, maxLength: 6 }),
  value: fc.oneof(fc.integer(), fc.string(), fc.boolean()),
});

/**
 * Varied, guaranteed-NON-EMPTY backend payloads (objects, arrays, primitives)
 * so the resolver always reaches a `{ kind: 'ok' }` result. `isEmptyValue`
 * treats null/undefined, empty arrays, and key-less objects as empty, so each
 * arm below is constructed to be non-empty.
 */
const nonEmptyBackendPayloadArb: fc.Arbitrary<unknown> = fc.oneof(
  // Non-empty array of tagged records.
  fc.array(backendRecordArb, { minLength: 1, maxLength: 5 }),
  // Non-empty object that always has at least the marker key.
  fc.record({
    origin: fc.constant(BACKEND_MARKER),
    tiles: fc.array(backendRecordArb, { minLength: 1, maxLength: 4 }),
    total: fc.integer(),
  }),
  // Primitives (present, never the demo sentinel object).
  fc.integer(),
  fc.boolean(),
  fc.string({ minLength: 1, maxLength: 8 }),
);

describe('resolveFeatureData — Property 4: demo-origin data never appears when demo mode is off', () => {
  it('returns the exact backend payload and never invokes selectDemo (demo off)', async () => {
    await assertProperty(
      fc.asyncProperty(
        scopeArb,
        fc.constantFrom(...FEATURE_AREAS),
        fc.string({ minLength: 1, maxLength: 10 }),
        nonEmptyBackendPayloadArb,
        async (scope, area, region, backendPayload) => {
          // A DISTINCT demo sentinel; if any demo-origin value leaked it would
          // equal this reference. selectDemo also counts its own invocations.
          const demoSentinel = { __demo_sentinel__: true } as const;
          let selectDemoCalls = 0;

          const args: ResolveArgs<unknown> = {
            area: area as FeatureArea,
            region,
            scope,
            isDemo: false,
            fetchReal: async () => backendPayload,
            selectDemo: () => {
              selectDemoCalls += 1;
              return demoSentinel as unknown;
            },
            assertScope: () => {
              /* in-scope: never throws */
            },
          };

          const result = await resolveFeatureData(args);

          // (1) Non-empty in-scope backend data → ok with the EXACT backend payload.
          expect(result.kind).toBe('ok');
          if (result.kind === 'ok') {
            expect(result.data).toBe(backendPayload); // exact backend value
            expect(result.data).not.toBe(demoSentinel); // never the demo value
          }

          // (2) selectDemo is NEVER invoked when demo mode is off.
          expect(selectDemoCalls).toBe(0);
        },
      ),
    );
  });

  it('never emits the demo sentinel for any backend outcome — ok, empty, or error (demo off)', async () => {
    // Outcome generator: a non-empty payload (ok), an empty payload (empty), or
    // a thrown backend error (error). In every case the result must be sourced
    // from the backend path only — never the demo sentinel — and selectDemo is
    // never called.
    const outcomeArb = fc.oneof(
      nonEmptyBackendPayloadArb.map((p) => ({ tag: 'ok' as const, payload: p })),
      fc
        .constantFrom<unknown>(null, undefined, [], {})
        .map((p) => ({ tag: 'empty' as const, payload: p })),
      fc.constant({ tag: 'throw' as const, payload: undefined }),
    );

    await assertProperty(
      fc.asyncProperty(
        scopeArb,
        fc.constantFrom(...FEATURE_AREAS),
        fc.string({ minLength: 1, maxLength: 10 }),
        outcomeArb,
        async (scope, area, region, outcome) => {
          const demoSentinel = { __demo_sentinel__: true } as const;
          let selectDemoCalls = 0;

          const args: ResolveArgs<unknown> = {
            area: area as FeatureArea,
            region,
            scope,
            isDemo: false,
            fetchReal: async () => {
              if (outcome.tag === 'throw') {
                throw new Error('backend unavailable');
              }
              return outcome.payload;
            },
            selectDemo: () => {
              selectDemoCalls += 1;
              return demoSentinel as unknown;
            },
            assertScope: () => {
              /* in-scope: never throws */
            },
          };

          const result = await resolveFeatureData(args);

          // Result is one of the honest shapes; never demo-origin data.
          expect(['ok', 'empty', 'error']).toContain(result.kind);
          if (result.kind === 'ok') {
            expect(result.data).not.toBe(demoSentinel);
            expect(result.data).toBe(outcome.payload);
          }

          // The demo selector is never consulted with demo mode off.
          expect(selectDemoCalls).toBe(0);
        },
      ),
    );
  });
});

// Feature: dashboard-production-ready, Property 2: A defined demo region always resolves non-empty in demo mode
//
// Validates: Requirements 1.2
//
// Property 2 (design.md): For any Feature_Area whose dataset defines a given region,
// `resolveFeatureData` in demo mode returns `kind: 'ok'` with a non-empty region —
// never an `empty` result for a region that has demo data, and never touching the
// backend in demo mode.
//
// Implementation under test: lib/api/core/resolve.ts `resolveFeatureData` (demo branch).
// Demo datasets (lib/demo/data/*) all tag records with tenant 'demo-tenant-001' and
// stores 'demo-store-001' / 'demo-store-002', and include tenant-level (storeId: null)
// records that surface under any in-tenant scope — so a valid demo scope always yields
// at least one populated region.

// Self-contained: this block dynamically imports the values it needs inside the
// test (the shared file's top-level imports are owned by another property block),
// and relies on Vitest globals for describe/it/expect.

/** The demo tenant every dataset module tags its records with. */
const P2_DEMO_TENANT = 'demo-tenant-001';

/** Every Feature_Area registered in the Demo_Data_Provider. */
const P2_AREAS: FeatureArea[] = [
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

/**
 * Mirror of the resolver's own "empty" notion (`resolve.ts#isEmptyValue`):
 * null/undefined, an empty array, or an object with no own enumerable keys.
 */
function isEmptyValueP2(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

describe('resolveFeatureData — Property 2: a defined demo region always resolves non-empty in demo mode', () => {
  it('returns kind:ok with non-empty data for every defined non-empty region, without calling the backend', async () => {
    // Dynamically imported here so this block does not depend on the shared
    // file's top-level imports (owned by a sibling property block).
    const { resolveFeatureData } = await import('@/lib/api/core/resolve');
    const { getDemoDataset } = await import('@/lib/demo');
    const { assertProperty, fc } = await import('@/test/property');

    await assertProperty(
      fc.asyncProperty(
        fc.constantFrom<FeatureArea>(...P2_AREAS),
        // Valid demo store scope: the "all stores" rollup (null) or one of the two
        // demo stores every dataset module defines.
        fc.constantFrom<string | null>(null, 'demo-store-001', 'demo-store-002'),
        // Only owner/admin may hold the rollup / cross-store scope.
        fc.constantFrom<'owner' | 'admin'>('owner', 'admin'),
        async (area, storeId, role) => {
          const scope: StoreScope = { tenantId: P2_DEMO_TENANT, storeId, role };

          // The dataset must exist (all 13 areas are registered) and define at least
          // one non-empty region for a valid demo scope.
          const dataset = getDemoDataset(area, scope);
          expect(dataset).not.toBeNull();
          const ds = dataset!;

          const regionKeys = Object.keys(ds.regions).filter(
            (key) => !isEmptyValueP2(ds.regions[key]),
          );
          // Precondition: a valid demo scope always yields at least one populated region.
          expect(regionKeys.length).toBeGreaterThan(0);

          for (const region of regionKeys) {
            let backendCalled = false;
            const result = await resolveFeatureData<unknown>({
              area,
              region,
              scope,
              isDemo: true,
              // Demo mode must NEVER touch the backend.
              fetchReal: () => {
                backendCalled = true;
                throw new Error('backend must not be called in demo mode');
              },
              selectDemo: (d) => d.regions[region],
              // Scope is already applied by the dataset builder; nothing to assert.
              assertScope: () => {},
            });

            // A region that has demo data always resolves ok + non-empty, never to
            // `empty` (Property 2 / Requirement 1.2).
            expect(result.kind).toBe('ok');
            if (result.kind === 'ok') {
              expect(isEmptyValueP2(result.data)).toBe(false);
            }
            // Honest-data: demo resolution never calls the backend.
            expect(backendCalled).toBe(false);
          }
        },
      ),
    );
  });
});

// Feature: dashboard-production-ready, Property 6: Missing demo dataset yields an empty state and a log, never a crash
//
// Validates: Requirements 1.7
//
// Property 6 (design.md): For any Feature_Area/region with no defined demo dataset,
// `resolveFeatureData` in demo mode returns `kind: 'empty'`, logs the missing dataset
// exactly once, and does not throw.
//
// Implementation under test:
//   • lib/demo/index.ts `getDemoDataset` — returns null for an unregistered area and
//     logs the gap exactly once per area via a module-level dedupe Set (never throws).
//   • lib/api/core/resolve.ts `resolveFeatureData` — in demo mode resolves a missing
//     dataset OR a missing region to `{ kind: 'empty' }` without touching the backend.
//
// All 13 real Feature_Areas are registered by the data modules, so to exercise the
// "missing dataset" path this block uses areas that are never registered (a fresh,
// unique fake area string per generated case, cast to FeatureArea). Because the dedupe
// Set is module-lifetime, "exactly once" is asserted per never-seen area: repeated
// `getDemoDataset` calls for the same fake area warn exactly once total.
//
// NOTE: tasks 3.4 / 3.5 / 3.6 / 3.7 also target this file. This block uses a uniquely
// named `describe` plus `*P6`-aliased imports so it cannot collide with sibling blocks;
// it reuses the shared module-scope bindings (describe/it/expect/assertProperty/fc/
// resolveFeatureData/FeatureArea/StoreScope) already imported at the top of the file.

import { vi as viP6 } from 'vitest';
import { getDemoDataset as getDemoDatasetP6, type DemoDataset as DemoDatasetP6 } from '@/lib/demo';

/** Every Feature_Area registered in the Demo_Data_Provider (for the missing-region case). */
const P6_REGISTERED_AREAS: FeatureArea[] = [
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

const p6ScopeArb: fc.Arbitrary<StoreScope> = fc.record({
  tenantId: fc.constantFrom('t1', 't2', 't3'),
  storeId: fc.constantFrom<string | null>('s1', 's2', null),
  role: fc.constantFrom('owner', 'admin', 'manager', 'staff', 'auditor'),
});

// Module-level counter guarantees every generated fake area is brand new and has never
// been seen by `getDemoDataset`'s module-lifetime dedupe Set, so the "exactly once"
// warn assertion is meaningful for each generated case.
let p6FakeAreaCounter = 0;
function freshFakeAreaP6(suffix: string): FeatureArea {
  return `__never_registered_${p6FakeAreaCounter++}_${suffix}` as unknown as FeatureArea;
}

describe('resolveFeatureData / getDemoDataset — Property 6: missing demo dataset yields empty + a single log, never a crash', () => {
  it('getDemoDataset returns null for an unregistered area and logs exactly once across repeated calls', () => {
    assertProperty(
      fc.property(
        fc.string({ maxLength: 8 }),
        fc.integer({ min: 1, max: 6 }),
        p6ScopeArb,
        (suffix, calls, scope) => {
          const fakeArea = freshFakeAreaP6(suffix);
          const fakeAreaStr = fakeArea as unknown as string;
          const warnSpy = viP6.spyOn(console, 'warn').mockImplementation(() => {});
          try {
            const results: (DemoDatasetP6 | null)[] = [];
            for (let i = 0; i < calls; i++) {
              // Must never throw, even when called repeatedly for a missing area.
              results.push(getDemoDatasetP6(fakeArea, scope));
            }
            // Every call returns null (no fabricated dataset).
            expect(results.every((r) => r === null)).toBe(true);
            // The missing dataset is logged exactly once for this never-seen area.
            const warnsForArea = warnSpy.mock.calls.filter((c) =>
              String(c[0]).includes(fakeAreaStr),
            ).length;
            expect(warnsForArea).toBe(1);
          } finally {
            warnSpy.mockRestore();
          }
        },
      ),
    );
  });

  it('resolveFeatureData in demo mode resolves a missing dataset to empty without calling the backend or throwing', async () => {
    await assertProperty(
      fc.asyncProperty(fc.string({ maxLength: 8 }), p6ScopeArb, async (suffix, scope) => {
        const fakeArea = freshFakeAreaP6(suffix);
        const warnSpy = viP6.spyOn(console, 'warn').mockImplementation(() => {});
        try {
          const result = await resolveFeatureData<unknown>({
            area: fakeArea,
            region: 'anything',
            scope,
            isDemo: true,
            // The backend must never be touched in demo mode; calling it fails the test.
            fetchReal: () => {
              throw new Error('fetchReal must not be called in demo mode');
            },
            selectDemo: (ds) => (ds.regions as Record<string, unknown>).anything,
            assertScope: () => {},
          });
          expect(result.kind).toBe('empty');
        } finally {
          warnSpy.mockRestore();
        }
      }),
    );
  });

  it('resolveFeatureData in demo mode resolves a missing region (registered area) to empty without throwing', async () => {
    await assertProperty(
      fc.asyncProperty(
        fc.constantFrom(...P6_REGISTERED_AREAS),
        fc.string({ minLength: 1, maxLength: 12 }),
        p6ScopeArb,
        async (area, region, scope) => {
          const warnSpy = viP6.spyOn(console, 'warn').mockImplementation(() => {});
          try {
            const result = await resolveFeatureData<unknown>({
              area,
              region: `__missing_region_${region}`,
              scope,
              isDemo: true,
              fetchReal: () => {
                throw new Error('fetchReal must not be called in demo mode');
              },
              // No such region exists in any real dataset -> undefined -> empty.
              selectDemo: () => undefined,
              assertScope: () => {},
            });
            expect(result.kind).toBe('empty');
          } finally {
            warnSpy.mockRestore();
          }
        },
      ),
    );
  });
});

// Feature: dashboard-production-ready, Property 24: Backend failures map to a region error, not data
//
// Validates: Requirements 10.1, 10.2, 10.4
//
// Property 24 (design.md): For any backend outcome that is a non-2xx status other
// than 401, a timeout/abort, or a schema-validation failure, `resolveFeatureData`
// (with demo off) returns `kind: 'error'` — never `ok`/data — carrying the
// appropriate code, and emits no field sourced from the failed/unvalidated body.
// Additionally: a CrossScopeError thrown by `assertScope` maps to `error` with
// code 'CROSS_SCOPE' (R8.6), while a 401 (UnauthorizedError OR ApiRequestError
// status 401) is RETHROWN — never mapped to a region error — so the auth layer
// can refresh/redirect (R10.6, R6.5).
//
// Implementation under test: lib/api/core/resolve.ts `resolveFeatureData` (demo-off
// catch branch). This block uses a uniquely-named `describe` and `*P24`-suffixed
// bindings; it reuses the shared module-scope imports (describe/it/expect/
// assertProperty/fc/resolveFeatureData/ResolveArgs/FeatureArea/StoreScope) and adds
// the error classes it asserts against below. It does not edit sibling blocks.

import {
  ApiRequestError as ApiRequestErrorP24,
  UnauthorizedError as UnauthorizedErrorP24,
  ResponseValidationError as ResponseValidationErrorP24,
} from './errors';
import { CrossScopeError as CrossScopeErrorP24, CROSS_SCOPE as CROSS_SCOPE_P24 } from '@/lib/api/core/scope-guard';

/** Stable codes the resolver emits (mirrors the private consts in resolve.ts). */
const P24_SCHEMA_VALIDATION = 'SCHEMA_VALIDATION';
const P24_TIMEOUT = 'TIMEOUT';

const P24_AREAS: FeatureArea[] = [
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

const p24ScopeArb: fc.Arbitrary<StoreScope> = fc.record({
  tenantId: fc.constantFrom('t1', 't2', 't3'),
  storeId: fc.constantFrom<string | null>('s1', 's2', null),
  role: fc.constantFrom('owner', 'admin', 'manager', 'staff', 'auditor'),
});

const p24AreaArb = fc.constantFrom<FeatureArea>(...P24_AREAS);
const p24RegionArb = fc.string({ minLength: 1, maxLength: 12 });

/** A non-empty payload so `assertScope` is reached before any "empty" check. */
const p24NonEmptyPayloadArb: fc.Arbitrary<unknown> = fc.oneof(
  fc.array(fc.record({ id: fc.string({ minLength: 1, maxLength: 6 }) }), {
    minLength: 1,
    maxLength: 4,
  }),
  fc.record({ tiles: fc.array(fc.integer(), { minLength: 1, maxLength: 3 }), total: fc.integer() }),
  fc.integer(),
);

describe('resolveFeatureData — Property 24: backend failures map to a region error, not data', () => {
  it('maps a non-2xx ApiRequestError (≠401) to { kind: error } carrying the upstream status + code (R10.1)', async () => {
    await assertProperty(
      fc.asyncProperty(
        p24ScopeArb,
        p24AreaArb,
        p24RegionArb,
        // Non-401 non-2xx statuses the backend may surface.
        fc.constantFrom(400, 403, 404, 500, 502, 503, 504),
        fc.string({ minLength: 1, maxLength: 16 }),
        async (scope, area, region, status, code) => {
          let selectDemoCalls = 0;
          const args: ResolveArgs<unknown> = {
            area,
            region,
            scope,
            isDemo: false,
            fetchReal: async () => {
              throw new ApiRequestErrorP24({ code, message: 'backend failed', status });
            },
            selectDemo: () => {
              selectDemoCalls += 1;
              return { __demo__: true };
            },
            assertScope: () => {},
          };

          const result = await resolveFeatureData(args);

          expect(result.kind).toBe('error');
          if (result.kind === 'error') {
            expect(result.status).toBe(status);
            expect(result.code).toBe(code);
          }
          // Never ok/data, and the demo source is never consulted with demo off.
          expect(result.kind).not.toBe('ok');
          expect(selectDemoCalls).toBe(0);
        },
      ),
    );
  });

  it('maps a ResponseValidationError to { kind: error, code: SCHEMA_VALIDATION } with no body field surfaced (R10.4)', async () => {
    await assertProperty(
      fc.asyncProperty(
        p24ScopeArb,
        p24AreaArb,
        p24RegionArb,
        // Arbitrary "unvalidated body" the failure carries; none of it may leak.
        fc.object(),
        async (scope, area, region, unvalidatedBody) => {
          const args: ResolveArgs<unknown> = {
            area,
            region,
            scope,
            isDemo: false,
            fetchReal: async () => {
              throw new ResponseValidationErrorP24(unvalidatedBody);
            },
            selectDemo: () => ({ __demo__: true }),
            assertScope: () => {},
          };

          const result = await resolveFeatureData(args);

          expect(result.kind).toBe('error');
          if (result.kind === 'error') {
            expect(result.code).toBe(P24_SCHEMA_VALIDATION);
            // Result carries only a status + code — no field of the unvalidated body.
            expect(Object.keys(result).sort()).toEqual(['code', 'kind', 'status']);
          }
        },
      ),
    );
  });

  it('maps a timeout/abort error to { kind: error, status: 504, code: TIMEOUT } (R10.2)', async () => {
    await assertProperty(
      fc.asyncProperty(
        p24ScopeArb,
        p24AreaArb,
        p24RegionArb,
        fc.constantFrom('AbortError', 'TimeoutError'),
        async (scope, area, region, errorName) => {
          const args: ResolveArgs<unknown> = {
            area,
            region,
            scope,
            isDemo: false,
            fetchReal: async () => {
              const err = new Error('aborted');
              err.name = errorName;
              throw err;
            },
            selectDemo: () => ({ __demo__: true }),
            assertScope: () => {},
          };

          const result = await resolveFeatureData(args);

          expect(result.kind).toBe('error');
          if (result.kind === 'error') {
            expect(result.status).toBe(504);
            expect(result.code).toBe(P24_TIMEOUT);
          }
        },
      ),
    );
  });

  it('maps a CrossScopeError from assertScope to { kind: error, code: CROSS_SCOPE } (R8.6)', async () => {
    await assertProperty(
      fc.asyncProperty(
        p24ScopeArb,
        p24AreaArb,
        p24RegionArb,
        p24NonEmptyPayloadArb,
        async (scope, area, region, backendPayload) => {
          const args: ResolveArgs<unknown> = {
            area,
            region,
            scope,
            isDemo: false,
            // Backend returns data, but it is out of scope.
            fetchReal: async () => backendPayload,
            selectDemo: () => ({ __demo__: true }),
            assertScope: () => {
              throw new CrossScopeErrorP24();
            },
          };

          const result = await resolveFeatureData(args);

          expect(result.kind).toBe('error');
          if (result.kind === 'error') {
            expect(result.code).toBe(CROSS_SCOPE_P24);
          }
          // The entire (out-of-scope) response is discarded — never ok/data.
          expect(result.kind).not.toBe('ok');
        },
      ),
    );
  });

  it('rethrows 401 (UnauthorizedError OR ApiRequestError status 401) — never a region error (R10.6)', async () => {
    await assertProperty(
      fc.asyncProperty(
        p24ScopeArb,
        p24AreaArb,
        p24RegionArb,
        // Two distinct ways a 401 can surface from the backend layer.
        fc.constantFrom<'unauthorized' | 'apiRequest401'>('unauthorized', 'apiRequest401'),
        async (scope, area, region, variant) => {
          const args: ResolveArgs<unknown> = {
            area,
            region,
            scope,
            isDemo: false,
            fetchReal: async () => {
              if (variant === 'unauthorized') {
                throw new UnauthorizedErrorP24();
              }
              throw new ApiRequestErrorP24({ code: 'UNAUTHORIZED', message: '401', status: 401 });
            },
            selectDemo: () => ({ __demo__: true }),
            assertScope: () => {},
          };

          // 401 propagates (rethrown) rather than mapping to a region error.
          await expect(resolveFeatureData(args)).rejects.toBeInstanceOf(ApiRequestErrorP24);
        },
      ),
    );
  });
});
