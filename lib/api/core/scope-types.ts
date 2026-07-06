/**
 * lib/api/core/scope-types.ts — shared multi-tenant scope types.
 *
 * Pure type declarations (no runtime, framework-free) shared by the API proxy,
 * the Demo_Data_Provider, the scope guard, and the store-scope hook. Keeping
 * these in one place guarantees tenant/store scoping is described identically
 * everywhere it is enforced (Requirement 8.4).
 */

/**
 * Role identifiers used across the dashboard. Re-exported from `lib/permissions`
 * so there is a single source of truth for the role union.
 */
export type { Role } from '@/lib/permissions';

import type { Role } from '@/lib/permissions';

/**
 * Base shape for any record that participates in tenant/store scoping.
 * `storeId === null` denotes a tenant-level record that is visible under a
 * multi-store rollup.
 */
export interface Scoped {
  tenantId: string;
  storeId: string | null;
}

/**
 * The active data scope for a request or view.
 * `storeId === null` denotes the owner/admin "all stores" rollup; `role` gates
 * whether that rollup (and cross-store access) is permitted (Requirements 8.2, 8.5).
 */
export interface StoreScope {
  tenantId: string;
  storeId: string | null;
  role: Role;
}
