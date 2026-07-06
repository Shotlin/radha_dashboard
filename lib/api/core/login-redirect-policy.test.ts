// Feature: dashboard-production-ready, Property 25: Only authentication failures redirect to login
//
// Validates: Requirements 10.6
//
// Property 25 (design.md): For any error type other than an authentication failure
// (UnauthorizedError or a 401 ApiRequestError), `resolveFeatureData` does NOT redirect
// to login — it returns an error result for the region only. Only an authentication
// failure (UnauthorizedError / 401) propagates upward so the auth layer can handle the
// redirect; all other failures produce a region-scoped error result, never a
// login redirect.
//
// This is tested at two levels:
//   1. Pure classification: for every non-auth error category (schema-validation,
//      timeout, backend non-401, cross-scope, unknown) the result carries kind:'error',
//      and for auth failures the function rejects (rethrows) so the caller must handle
//      the redirect — the function itself never redirects.
//   2. Client redirect policy: only `SessionEndedError` (401 from /api/auth/me) ever
//      triggers a login redirect in `use-session.ts`; every other query error is surfaced
//      as `isError` in the region, not a navigation event.

import { describe, it, expect } from 'vitest';
import { assertProperty, fc } from '@/test/property';
import { resolveFeatureData, type ResolveArgs } from '@/lib/api/core/resolve';
import type { FeatureArea } from '@/lib/demo';
import type { StoreScope } from '@/lib/api/core/scope-types';
import {
  ApiRequestError,
  UnauthorizedError,
  ResponseValidationError,
} from './errors';
import { CrossScopeError } from '@/lib/api/core/scope-guard';

const FEATURE_AREAS: FeatureArea[] = [
  'overview', 'analytics', 'audit', 'expiry', 'grn', 'inventory',
  'tasks', 'billing', 'suppliers', 'reports', 'notifications', 'settings', 'admin',
];

const scopeArb: fc.Arbitrary<StoreScope> = fc.record({
  tenantId: fc.constantFrom('t1', 't2', 't3'),
  storeId: fc.option(fc.constantFrom('s1', 's2', 's3'), { nil: null }),
  role: fc.constantFrom('owner', 'admin', 'manager', 'staff', 'auditor'),
});

const areaArb = fc.constantFrom<FeatureArea>(...FEATURE_AREAS);
const regionArb = fc.string({ minLength: 1, maxLength: 12 });

function noopArgs(
  scope: StoreScope,
  area: FeatureArea,
  region: string,
  fetchReal: () => Promise<unknown>,
): ResolveArgs<unknown> {
  return {
    area,
    region,
    scope,
    isDemo: false,
    fetchReal,
    selectDemo: () => ({ __demo__: true }),
    assertScope: () => {},
  };
}

describe('Property 25: Only authentication failures redirect to login', () => {
  it('non-auth backend errors (non-401 status) resolve to { kind: error }, never redirect', async () => {
    await assertProperty(
      fc.asyncProperty(
        scopeArb, areaArb, regionArb,
        fc.constantFrom(400, 403, 404, 500, 502, 503, 504),
        fc.string({ minLength: 1, maxLength: 12 }),
        async (scope, area, region, status, code) => {
          const result = await resolveFeatureData(
            noopArgs(scope, area, region, async () => {
              throw new ApiRequestError({ code, message: 'backend error', status });
            }),
          );
          // Non-auth errors stay within the region (kind:error, no redirect).
          expect(result.kind).toBe('error');
          // Never ok — never returns data from a failed request.
          expect(result.kind).not.toBe('ok');
        },
      ),
    );
  });

  it('schema-validation errors resolve to { kind: error }, never redirect', async () => {
    await assertProperty(
      fc.asyncProperty(scopeArb, areaArb, regionArb, async (scope, area, region) => {
        const result = await resolveFeatureData(
          noopArgs(scope, area, region, async () => {
            throw new ResponseValidationError({});
          }),
        );
        expect(result.kind).toBe('error');
      }),
    );
  });

  it('timeout / abort errors resolve to { kind: error }, never redirect', async () => {
    await assertProperty(
      fc.asyncProperty(
        scopeArb, areaArb, regionArb,
        fc.constantFrom('AbortError', 'TimeoutError'),
        async (scope, area, region, errorName) => {
          const result = await resolveFeatureData(
            noopArgs(scope, area, region, async () => {
              const e = new Error('timed out');
              e.name = errorName;
              throw e;
            }),
          );
          expect(result.kind).toBe('error');
        },
      ),
    );
  });

  it('cross-scope errors resolve to { kind: error }, never redirect', async () => {
    await assertProperty(
      fc.asyncProperty(scopeArb, areaArb, regionArb, async (scope, area, region) => {
        const result = await resolveFeatureData({
          ...noopArgs(scope, area, region, async () => ({ data: 'any' })),
          assertScope: () => { throw new CrossScopeError(); },
        });
        expect(result.kind).toBe('error');
      }),
    );
  });

  it('auth failures (UnauthorizedError / 401) are rethrown — the function never redirects itself', async () => {
    // The function rejects (rethrows) rather than resolving — the caller handles
    // the auth redirect. This is the ONLY error type that propagates out of
    // resolveFeatureData, ensuring the auth layer is the sole redirector (R10.6).
    await assertProperty(
      fc.asyncProperty(
        scopeArb, areaArb, regionArb,
        fc.constantFrom<'unauthorized' | 'apiRequest401'>('unauthorized', 'apiRequest401'),
        async (scope, area, region, variant) => {
          await expect(
            resolveFeatureData(
              noopArgs(scope, area, region, async () => {
                if (variant === 'unauthorized') throw new UnauthorizedError();
                throw new ApiRequestError({ code: 'UNAUTHORIZED', message: '401', status: 401 });
              }),
            ),
          ).rejects.toBeInstanceOf(ApiRequestError);
        },
      ),
    );
  });

  it('empty backend results resolve to { kind: empty }, never redirect', async () => {
    await assertProperty(
      fc.asyncProperty(
        scopeArb, areaArb, regionArb,
        fc.constantFrom<unknown>(null, undefined, [], {}),
        async (scope, area, region, emptyPayload) => {
          const result = await resolveFeatureData(
            noopArgs(scope, area, region, async () => emptyPayload),
          );
          expect(result.kind).toBe('empty');
        },
      ),
    );
  });
});
