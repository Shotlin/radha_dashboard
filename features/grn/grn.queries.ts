'use client';
/**
 * features/grn/grn.queries.ts — TanStack Query hooks for GRN.
 */
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';

async function apiFetch<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { credentials: 'include', signal });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

/* ── Types ───────────────────────────────────────────────────────────────── */
export type GrnStatus = 'draft' | 'received' | 'partial' | 'cancelled';

export interface Grn {
  id: string;
  storeId: string;
  supplierId?: string;
  supplierName?: string;
  invoiceNo?: string;
  status: GrnStatus;
  itemCount?: number;
  totalAmount?: number;
  receivedAt?: string | null;
  createdAt: string;
}

export interface GrnLineItem {
  id: string;
  grnId: string;
  ean: string;
  productName?: string;
  quantity: number;
  expiryDate?: string;
  batchNo?: string;
  unitCost?: number;
}

export interface GrnKpis {
  pendingCount: number;
  receivedThisMonth: number;
}

export interface GrnListResult {
  items: Grn[];
  total: number;
  nextCursor?: string | null;
}

export interface GrnItemsResult {
  items: GrnLineItem[];
}

/* ── GRN list ────────────────────────────────────────────────────────────── */
export function useGrnList(
  storeId: string | null,
  filters?: {
    status?: string;
    supplierId?: string;
    from?: string;
    to?: string;
    cursor?: string;
  },
) {
  const params = new URLSearchParams();
  if (storeId) params.set('storeId', storeId);
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters?.supplierId) params.set('supplierId', filters.supplierId);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  if (filters?.cursor) params.set('cursor', filters.cursor);

  return useQuery<GrnListResult>({
    queryKey: qk.grns(storeId ?? '', filters),
    queryFn: ({ signal }) => apiFetch<GrnListResult>(`/api/grn?${params.toString()}`, signal),
    enabled: !!storeId,
    staleTime: 30_000,
  });
}

/* ── GRN KPIs ────────────────────────────────────────────────────────────── */
export function useGrnKpis(storeId: string | null) {
  return useQuery<GrnKpis>({
    queryKey: qk.grnKpis(storeId ?? ''),
    queryFn: ({ signal }) => apiFetch<GrnKpis>(`/api/grn/kpis?storeId=${storeId}`, signal),
    enabled: !!storeId,
    staleTime: 60_000,
  });
}

/* ── GRN detail ──────────────────────────────────────────────────────────── */
export function useGrnDetail(id: string | null) {
  return useQuery<Grn>({
    queryKey: qk.grn(id ?? ''),
    queryFn: () => apiFetch<Grn>(`/api/grn/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/* ── GRN items ───────────────────────────────────────────────────────────── */
export function useGrnItems(grnId: string | null) {
  return useQuery<GrnItemsResult>({
    queryKey: qk.grnItems(grnId ?? ''),
    queryFn: () => apiFetch<GrnItemsResult>(`/api/grn/${grnId}/items`),
    enabled: !!grnId,
    staleTime: 30_000,
  });
}
