'use client';
/**
 * use-store-scope — current storeId from URL searchParams.
 *
 * Guards selection to the user's access so a user cannot scope outside it:
 * - owner/admin may view the "all stores" rollup (storeId === null) or any store.
 * - every other role is clamped to its assigned `session.storeIds`; the rollup is
 *   not permitted for them, so a null/out-of-assignment request collapses to their
 *   first assigned store (Requirements 8.2, 8.5).
 */
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { useSession } from '@/lib/auth/use-session';
import type { Role } from '@/lib/permissions';

export interface UseStoreScopeResult {
  storeId: string | null; // null = "all stores" rollup (owner/admin only)
  setStoreId: (id: string | null) => void;
}

/**
 * Whether a role may use the multi-store "all stores" rollup (storeId === null)
 * and access any tenant store. Only owner/admin qualify (Requirement 8.2).
 */
export function canUseRollup(role: Role): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Pure clamping decision for the effective store scope (Requirements 8.2, 8.5).
 *
 * - owner/admin: the requested store is honored as-is, including the rollup
 *   (`null`) and any tenant store.
 * - any other role: the effective store must be one of `assignedStoreIds`. A
 *   rollup request (`null`) or a store outside the assignments is clamped to the
 *   first assigned store, or `null` when the role has no assigned stores.
 */
export function clampStoreScope(
  role: Role,
  requestedStoreId: string | null,
  assignedStoreIds: readonly string[],
): string | null {
  if (canUseRollup(role)) {
    return requestedStoreId;
  }
  if (requestedStoreId !== null && assignedStoreIds.includes(requestedStoreId)) {
    return requestedStoreId;
  }
  return assignedStoreIds.length > 0 ? assignedStoreIds[0] : null;
}

export function useStoreScope(): UseStoreScopeResult {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSession();

  const rawStoreId = params.get('storeId');

  // Clamp the requested store to what the role is allowed to view. Until the
  // session resolves, no store assignments are known, so the scope stays null.
  const storeId = user
    ? clampStoreScope(user.role as Role, rawStoreId, user.storeIds ?? [])
    : null;

  const setStoreId = useCallback(
    (id: string | null) => {
      const sp = new URLSearchParams(params.toString());
      if (id) {
        sp.set('storeId', id);
      } else {
        sp.delete('storeId');
      }
      router.push(`${pathname}?${sp.toString()}`);
    },
    [params, pathname, router],
  );

  return { storeId, setStoreId };
}
