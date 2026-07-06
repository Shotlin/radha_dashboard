import 'server-only';

/**
 * lib/api/core/scope-guard.ts — store-scope integrity guard for the API_Proxy.
 *
 * Server-only: importing this from a client component is a build-time error, so
 * the guard only ever runs on the server where backend responses are resolved.
 *
 * `resolveFeatureData` calls `assertRecordsInScope` on every backend response.
 * If any record's `tenantId`/`storeId` falls outside the active scope, the guard
 * throws `CrossScopeError` so the *entire* response is discarded and a region
 * error is shown — never a partially-rendered, cross-tenant/cross-store result
 * (Requirements 8.6, 8.4).
 *
 * The in-scope predicate matches `filterByScope` (lib/demo/scope.ts) exactly so
 * demo and real data are scoped identically.
 */

export type { Scoped, StoreScope } from '@/lib/api/core/scope-types';

import type { Scoped, StoreScope } from '@/lib/api/core/scope-types';

/** Stable error code identifying a cross-scope rejection, used by resolveFeatureData. */
export const CROSS_SCOPE = 'CROSS_SCOPE' as const;

/**
 * Thrown when a backend response contains a record outside the active scope.
 *
 * Carries a stable `code` (`'CROSS_SCOPE'`) so the resolver can map it to an
 * `error` result without relying on the message text.
 */
export class CrossScopeError extends Error {
  readonly code: typeof CROSS_SCOPE = CROSS_SCOPE;

  constructor(message = 'Response contained records outside the active scope') {
    super(message);
    this.name = 'CrossScopeError';
    // Preserve the prototype chain when targeting ES5/down-level output.
    Object.setPrototypeOf(this, CrossScopeError.prototype);
  }
}

/**
 * Pure: true iff the record belongs to the active scope.
 *
 * Mirrors the per-record predicate in `filterByScope`:
 * - the record's `tenantId` must equal the scope's `tenantId`;
 * - under the rollup (`scope.storeId === null`) every store in the tenant is allowed;
 * - a tenant-level record (`r.storeId === null`) is always allowed within the tenant;
 * - otherwise the record's `storeId` must equal the scope's `storeId`.
 */
function isInScope(record: Scoped, scope: StoreScope): boolean {
  if (record.tenantId !== scope.tenantId) return false;
  if (scope.storeId === null) return true; // rollup sees all stores in tenant
  return record.storeId === null || record.storeId === scope.storeId;
}

/**
 * Assert that every record is within the active scope; throw `CrossScopeError`
 * for the whole batch as soon as one out-of-scope record is found (Requirement 8.6).
 *
 * Accepts a single record or an array so callers can guard either shape.
 */
export function assertRecordsInScope<T extends Scoped>(
  records: T | readonly T[],
  scope: StoreScope,
): void {
  const list = Array.isArray(records) ? records : [records as T];
  for (const record of list) {
    if (!isInScope(record, scope)) {
      throw new CrossScopeError();
    }
  }
}
