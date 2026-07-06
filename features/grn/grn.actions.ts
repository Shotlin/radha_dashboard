'use client';
/**
 * features/grn/grn.actions.ts — TanStack Mutation wrappers for GRN operations.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import type { CreateGrnFormValues, UpdateGrnFormValues, AddLineItemFormValues } from './grn.schema';

async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
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

/* ── Create GRN ──────────────────────────────────────────────────────────── */
export function useCreateGrn(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGrnFormValues) =>
      apiFetch('/api/grn', {
        method: 'POST',
        body: JSON.stringify({ ...data, storeId, supplierId: data.supplierId || undefined }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.grns(storeId) });
      void qc.invalidateQueries({ queryKey: qk.grnKpis(storeId) });
    },
  });
}

/* ── Update GRN ──────────────────────────────────────────────────────────── */
export function useUpdateGrn(id: string, storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateGrnFormValues) =>
      apiFetch(`/api/grn/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.grn(id) });
      void qc.invalidateQueries({ queryKey: qk.grns(storeId) });
      void qc.invalidateQueries({ queryKey: qk.grnKpis(storeId) });
    },
  });
}

/* ── Delete GRN ──────────────────────────────────────────────────────────── */
export function useDeleteGrn(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/grn/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.grns(storeId) });
      void qc.invalidateQueries({ queryKey: qk.grnKpis(storeId) });
    },
  });
}

/* ── Receive GRN ─────────────────────────────────────────────────────────── */
export function useReceiveGrn(id: string, storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/api/grn/${id}/receive`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.grn(id) });
      void qc.invalidateQueries({ queryKey: qk.grns(storeId) });
      void qc.invalidateQueries({ queryKey: qk.grnKpis(storeId) });
      void qc.invalidateQueries({ queryKey: qk.inventoryKpis(storeId) });
      void qc.invalidateQueries({ queryKey: qk.inventory(storeId) });
    },
  });
}

/* ── Add Line Item ───────────────────────────────────────────────────────── */
export function useAddGrnLineItem(grnId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddLineItemFormValues) =>
      apiFetch(`/api/grn/${grnId}/items`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.grnItems(grnId) });
      void qc.invalidateQueries({ queryKey: qk.grn(grnId) });
    },
  });
}

/* ── Remove Line Item ────────────────────────────────────────────────────── */
export function useRemoveGrnLineItem(grnId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      apiFetch(`/api/grn/${grnId}/items/${itemId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.grnItems(grnId) });
      void qc.invalidateQueries({ queryKey: qk.grn(grnId) });
    },
  });
}
