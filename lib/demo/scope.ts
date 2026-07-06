import 'server-only';

/**
 * lib/demo/scope.ts — pure scope filtering for the Demo_Data_Provider.
 *
 * Server-only: importing this from a client component is a build-time error,
 * guaranteeing demo data never bundles to the browser (Requirement 2.7).
 *
 * The scope types live in `lib/api/core/scope-types.ts` so tenant/store scoping
 * is described identically everywhere it is enforced (Requirement 8.4); they are
 * re-exported here for the convenience of demo dataset modules.
 */

export type { Scoped, StoreScope } from '@/lib/api/core/scope-types';

import type { Scoped, StoreScope } from '@/lib/api/core/scope-types';

/**
 * Pure: keep only the records that match the active scope (Requirements 1.4, 8.4).
 *
 * Semantics:
 * - The record's `tenantId` must equal the scope's `tenantId`; any other tenant
 *   is excluded.
 * - When `scope.storeId === null` (the owner/admin "all stores" rollup), every
 *   record in the matching tenant is included.
 * - A tenant-level record (`r.storeId === null`) is visible under any scope of
 *   the same tenant.
 * - Otherwise the record's `storeId` must equal the scope's `storeId`.
 */
export function filterByScope<T extends Scoped>(records: T[], scope: StoreScope): T[] {
  return records.filter((r) => {
    if (r.tenantId !== scope.tenantId) return false;
    if (scope.storeId === null) return true; // rollup sees all stores in tenant
    return r.storeId === null || r.storeId === scope.storeId;
  });
}
