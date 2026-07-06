'use client';
/**
 * features/inventory/inventory.queries.ts — TanStack Query hooks for inventory.
 */
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
async function apiFetch<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { credentials: 'include', signal });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

/* ── KPIs ────────────────────────────────────────────────────────────────── */
export interface InventoryKpis {
  totalSkus: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export function useInventoryKpis(storeId: string | null) {
  return useQuery<InventoryKpis>({
    queryKey: qk.inventoryKpis(storeId ?? ''),
    queryFn: ({ signal }) =>
      apiFetch<InventoryKpis>(`/api/inventory/kpis?storeId=${storeId}`, signal),
    enabled: !!storeId,
    staleTime: 60_000,
  });
}

/* ── Inventory list ──────────────────────────────────────────────────────── */
export interface InventoryItem {
  id: string;
  storeId: string;
  productId: string;
  ean: string;
  productName: string;
  currentStock: number;
  minStock?: number;
  unit?: string;
  lastMovedAt?: string | null;
}

export interface InventoryListResult {
  items: InventoryItem[];
  total: number;
  nextCursor?: string | null;
}

export function useInventoryList(
  storeId: string | null,
  filters?: { search?: string; lowStock?: boolean; cursor?: string },
) {
  const params = new URLSearchParams();
  if (storeId) params.set('storeId', storeId);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.lowStock) params.set('lowStock', 'true');
  if (filters?.cursor) params.set('cursor', filters.cursor);

  return useQuery<InventoryListResult>({
    queryKey: qk.inventory(storeId ?? '', filters),
    queryFn: ({ signal }) =>
      apiFetch<InventoryListResult>(`/api/inventory?${params.toString()}`, signal),
    enabled: !!storeId,
    staleTime: 30_000,
  });
}

/* ── Low stock ───────────────────────────────────────────────────────────── */
export interface LowStockResult {
  items: InventoryItem[];
  total: number;
}

export function useLowStock(storeId: string | null) {
  return useQuery<LowStockResult>({
    queryKey: qk.lowStock(storeId ?? ''),
    queryFn: ({ signal }) =>
      apiFetch<LowStockResult>(`/api/inventory/low-stock?storeId=${storeId}`, signal),
    enabled: !!storeId,
    staleTime: 60_000,
  });
}

/* ── Stock movements ─────────────────────────────────────────────────────── */
export interface StockMovement {
  id: string;
  storeId: string;
  productId?: string;
  ean: string;
  type: 'in' | 'out' | 'adjustment' | 'count';
  quantity: number;
  reason?: string;
  createdAt: string;
}

export interface StockMovementsResult {
  items: StockMovement[];
  total: number;
  nextCursor?: string | null;
}

export function useStockMovements(storeId: string | null, cursor?: string) {
  const params = new URLSearchParams();
  if (storeId) params.set('storeId', storeId);
  if (cursor) params.set('cursor', cursor);

  return useQuery<StockMovementsResult>({
    queryKey: qk.stockMovements(storeId ?? '', cursor),
    queryFn: ({ signal }) =>
      apiFetch<StockMovementsResult>(`/api/inventory/movements?${params.toString()}`, signal),
    enabled: !!storeId,
    staleTime: 30_000,
  });
}
