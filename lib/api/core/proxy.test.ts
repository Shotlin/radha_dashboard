// Feature: dashboard-production-ready, Property 20: Forwarded scope always carries the session tenant and the active store
//
// Validates: Requirements 8.1, 8.3, 8.4
//
// Property 20 (design.md): The scope forwarded to the backend always carries the
// session tenant and the active store (or the owner/admin tenant-rollup marker
// when no store is selected).
//
// The pure, testable function under test is `scopeQuery(scope)` → `{ tenantId, storeId }`:
//   • `tenantId` is always the session tenant (Requirements 8.1, 8.4).
//   • `storeId` is the active store when one is selected, or the tenant-rollup
//     marker (`ROLLUP_MARKER === 'all'`) when `scope.storeId === null` (Requirement 8.3).
//
// `buildStoreScope(session, req)` is also exercised: it derives the active scope
// from the authoritative session tenant and the `storeId` query param (absent or
// `'all'` ⇒ the rollup, `storeId: null`), which `scopeQuery` then forwards.

import { describe, it, expect } from 'vitest';
import { assertProperty, fc } from '@/test/property';
import { buildStoreScope, scopeQuery, ROLLUP_MARKER } from '@/lib/api/core/proxy';
import type { StoreScope } from '@/lib/api/core/scope-types';
import type { Role } from '@/lib/permissions';
import type { SessionPayload } from '@/lib/auth/session';
import type { NextRequest } from 'next/server';

const ROLES: Role[] = ['owner', 'admin', 'manager', 'staff', 'auditor'];
const roleArb = fc.constantFrom(...ROLES);

// Overlapping small pools keep tenant/store ids realistic while still exercising
// the rollup branch (`storeId === null`) frequently. Non-empty strings model real
// tenant/store ids; `null` models the owner/admin "all stores" rollup.
const tenantArb = fc.string({ minLength: 1, maxLength: 12 });
const storeIdArb = fc.oneof(fc.string({ minLength: 1, maxLength: 12 }), fc.constant(null));

const scopeArb: fc.Arbitrary<StoreScope> = fc.record({
  tenantId: tenantArb,
  storeId: storeIdArb,
  role: roleArb,
});

describe('scopeQuery — Property 20: forwarded scope carries the session tenant and active store', () => {
  it('always forwards the session tenant unchanged (R8.1, R8.4)', () => {
    assertProperty(
      fc.property(scopeArb, (scope) => {
        expect(scopeQuery(scope).tenantId).toBe(scope.tenantId);
      }),
    );
  });

  it('forwards the active store when one is selected (R8.3)', () => {
    assertProperty(
      fc.property(scopeArb, (scope) => {
        const { storeId } = scopeQuery(scope);
        if (scope.storeId !== null) {
          expect(storeId).toBe(scope.storeId);
        } else {
          expect(storeId).toBe(ROLLUP_MARKER);
        }
      }),
    );
  });

  it('substitutes the tenant-rollup marker exactly when no store is selected (R8.3)', () => {
    assertProperty(
      fc.property(scopeArb, (scope) => {
        const { storeId } = scopeQuery(scope);
        // The forwarded storeId is the rollup marker iff the scope has no store.
        expect(storeId === ROLLUP_MARKER).toBe(scope.storeId === null);
        // The forwarded storeId is always a concrete string (never null/undefined),
        // so the backend always receives a usable scope param.
        expect(typeof storeId).toBe('string');
        expect(storeId.length).toBeGreaterThan(0);
      }),
    );
  });
});

/**
 * Build a minimal fake {@link NextRequest} carrying only what `buildStoreScope`
 * reads: `req.nextUrl.searchParams.get('storeId')`. A `null` `storeIdParam`
 * models an absent query param.
 */
function fakeReq(storeIdParam: string | null): NextRequest {
  const params = new URLSearchParams();
  if (storeIdParam !== null) params.set('storeId', storeIdParam);
  return { nextUrl: { searchParams: params } } as unknown as NextRequest;
}

/** Build a minimal fake {@link SessionPayload} carrying the tenant and role. */
function fakeSession(tenantId: string, role: Role): SessionPayload {
  return {
    accessToken: 'a',
    refreshToken: 'r',
    expiresAt: 0,
    user: {
      id: 'u',
      name: 'n',
      role,
      tenantId,
      storeIds: [],
      permissions: [],
    },
  };
}

// The query param value: a concrete store id, the literal rollup marker, or an
// absent param (modeled as `null`).
const storeParamArb = fc.oneof(
  fc.string({ minLength: 1, maxLength: 12 }),
  fc.constant(ROLLUP_MARKER),
  fc.constant(null),
);

describe('buildStoreScope + scopeQuery — Property 20: end-to-end forwarded scope', () => {
  it('forwards the session tenant and resolves the active store/rollup from the request (R8.1, R8.3, R8.4)', () => {
    assertProperty(
      fc.property(tenantArb, roleArb, storeParamArb, (tenantId, role, storeParam) => {
        const scope = buildStoreScope(fakeSession(tenantId, role), fakeReq(storeParam));
        const forwarded = scopeQuery(scope);

        // Tenant is always the authoritative session tenant.
        expect(forwarded.tenantId).toBe(tenantId);

        // A concrete, non-rollup param becomes the active store; an absent param
        // or the rollup marker collapses to the tenant rollup.
        if (storeParam !== null && storeParam !== ROLLUP_MARKER) {
          expect(forwarded.storeId).toBe(storeParam);
        } else {
          expect(forwarded.storeId).toBe(ROLLUP_MARKER);
        }
      }),
    );
  });
});
