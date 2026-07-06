'use client';
/**
 * features/inventory/inventory.actions.ts — TanStack Mutation wrappers for stock ops.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import type {
  StockInFormValues,
  StockOutFormValues,
  AdjustStockFormValues,
  UpdateMinStockFormValues,
} from './inventory.schema';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function patch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ── Stock In ────────────────────────────────────────────────────────────── */
export function useStockIn(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StockInFormValues) =>
      post('/api/inventory/movements', { ...data, storeId, type: 'in' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.inventory(storeId) });
      void qc.invalidateQueries({ queryKey: qk.inventoryKpis(storeId) });
      void qc.invalidateQueries({ queryKey: qk.stockMovements(storeId) });
      void qc.invalidateQueries({ queryKey: qk.lowStock(storeId) });
    },
  });
}

/* ── Stock Out ───────────────────────────────────────────────────────────── */
export function useStockOut(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StockOutFormValues) =>
      post('/api/inventory/movements', { ...data, storeId, type: 'out' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.inventory(storeId) });
      void qc.invalidateQueries({ queryKey: qk.inventoryKpis(storeId) });
      void qc.invalidateQueries({ queryKey: qk.stockMovements(storeId) });
      void qc.invalidateQueries({ queryKey: qk.lowStock(storeId) });
    },
  });
}

/* ── Adjust Stock ────────────────────────────────────────────────────────── */
export function useAdjustStock(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AdjustStockFormValues) =>
      post('/api/inventory/movements', { ...data, storeId, type: 'adjustment' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.inventory(storeId) });
      void qc.invalidateQueries({ queryKey: qk.inventoryKpis(storeId) });
      void qc.invalidateQueries({ queryKey: qk.stockMovements(storeId) });
      void qc.invalidateQueries({ queryKey: qk.lowStock(storeId) });
    },
  });
}

/* ── Update Min Stock ────────────────────────────────────────────────────── */
export function useUpdateMinStock(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMinStockFormValues) =>
      patch(`/api/inventory/${data.productId}/min-stock`, {
        storeId,
        minStock: data.minStock,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.inventory(storeId) });
      void qc.invalidateQueries({ queryKey: qk.inventoryKpis(storeId) });
      void qc.invalidateQueries({ queryKey: qk.lowStock(storeId) });
    },
  });
}
