/**
 * lib/api/clients/suppliers.ts — Suppliers endpoints (Doc 1 §6.12)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { SupplierSchema } from '../schemas/common';
import { PaginatedSchema, cursorParams, type CursorParams } from '../core/pagination';

export interface SupplierFilters extends CursorParams {
  tenantId?: string;
  search?: string;
  isActive?: boolean;
}

export async function listSuppliers(filters?: SupplierFilters) {
  const { search, isActive, ...paging } = filters ?? {};
  return apiFetch('/suppliers', {
    schema: PaginatedSchema(SupplierSchema),
    query: { search, isActive, ...cursorParams(paging) },
  });
}

export async function getSupplier(id: string) {
  return apiFetch(`/suppliers/${id}`, { schema: SupplierSchema });
}

export async function createSupplier(data: { name: string; contactName?: string; phone?: string; email?: string; address?: string }) {
  return apiFetch('/suppliers', { method: 'POST', body: data, schema: SupplierSchema });
}

export async function updateSupplier(id: string, data: Partial<{ name: string; contactName: string; phone: string; email: string; address: string; isActive: boolean }>) {
  return apiFetch(`/suppliers/${id}`, { method: 'PATCH', body: data, schema: SupplierSchema });
}

export async function deleteSupplier(id: string) {
  return apiFetch(`/suppliers/${id}`, { method: 'DELETE', schema: z.object({}), noBody: true });
}

export async function importSuppliers(csvData: string) {
  return apiFetch('/suppliers/import', {
    method: 'POST',
    body: { csv: csvData },
    schema: z.object({ imported: z.number(), errors: z.number() }),
  });
}

export async function getSupplierPerformance(id: string) {
  return apiFetch(`/suppliers/${id}/performance`, {
    schema: z.object({
      totalGrns: z.number(),
      onTimeRate: z.number(),
      lastDeliveryAt: z.string().nullable().optional(),
    }),
  });
}
