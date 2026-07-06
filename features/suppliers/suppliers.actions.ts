'use client';
/**
 * features/suppliers/suppliers.actions.ts — TanStack Mutation wrappers for suppliers.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import type { SupplierFormValues, SupplierUpdateValues } from './suppliers.schema';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

/* ── Create ──────────────────────────────────────────────────────────────── */
export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplierFormValues) =>
      apiFetch('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

/* ── Update ──────────────────────────────────────────────────────────────── */
export function useUpdateSupplier(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplierUpdateValues) =>
      apiFetch(`/api/suppliers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.supplier(id) });
      void qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

/* ── Delete ──────────────────────────────────────────────────────────────── */
export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/suppliers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

/* ── Activate ────────────────────────────────────────────────────────────── */
export function useActivateSupplier(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/api/suppliers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.supplier(id) });
      void qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

/* ── Deactivate ──────────────────────────────────────────────────────────── */
export function useDeactivateSupplier(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/api/suppliers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: false }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.supplier(id) });
      void qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

/* ── Import ──────────────────────────────────────────────────────────────── */
export function useImportSuppliers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (csvData: string) =>
      apiFetch<{ imported: number; errors: number }>('/api/suppliers/import', {
        method: 'POST',
        body: JSON.stringify({ csv: csvData }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}
