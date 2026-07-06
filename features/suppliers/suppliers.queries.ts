'use client';
/**
 * features/suppliers/suppliers.queries.ts — TanStack Query hooks for suppliers.
 */
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

/* ── Types ───────────────────────────────────────────────────────────────── */
export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SupplierPerformance {
  totalGrns: number;
  onTimeRate: number;
  lastDeliveryAt?: string | null;
}

export interface SuppliersListResult {
  items: Supplier[];
  total: number;
  nextCursor?: string | null;
}

/* ── List ────────────────────────────────────────────────────────────────── */
export function useSuppliersList(filters?: {
  search?: string;
  isActive?: boolean;
  cursor?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
  if (filters?.cursor) params.set('cursor', filters.cursor);

  return useQuery<SuppliersListResult>({
    queryKey: qk.suppliers(filters),
    queryFn: () => apiFetch<SuppliersListResult>(`/api/suppliers?${params.toString()}`),
    staleTime: 30_000,
  });
}

/* ── Detail ──────────────────────────────────────────────────────────────── */
export function useSupplierDetail(id: string | null) {
  return useQuery<Supplier>({
    queryKey: qk.supplier(id ?? ''),
    queryFn: () => apiFetch<Supplier>(`/api/suppliers/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  });
}

/* ── Performance ─────────────────────────────────────────────────────────── */
export function useSupplierPerformance(id: string | null) {
  return useQuery<SupplierPerformance>({
    queryKey: qk.supplierPerformance(id ?? ''),
    queryFn: () => apiFetch<SupplierPerformance>(`/api/suppliers/${id}/performance`),
    enabled: !!id,
    staleTime: 120_000,
  });
}
