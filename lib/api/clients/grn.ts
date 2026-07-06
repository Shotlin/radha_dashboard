/**
 * lib/api/clients/grn.ts — GRN (Goods Received Note) endpoints (Doc 1 §6.11, §7.4)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { GrnSchema } from '../schemas/common';
import { PaginatedSchema, cursorParams, type CursorParams } from '../core/pagination';

const GrnLineItemSchema = z.object({
  id: z.string(),
  grnId: z.string(),
  ean: z.string(),
  productName: z.string().optional(),
  quantity: z.number(),
  expiryDate: z.string().optional(),
  batchNo: z.string().optional(),
  unitCost: z.number().optional(),
});

export interface GrnFilters extends CursorParams {
  storeId: string;
  status?: string;
  supplierId?: string;
  from?: string;
  to?: string;
}

export async function listGrns(filters: GrnFilters) {
  const { storeId, status, supplierId, from, to, ...paging } = filters;
  return apiFetch('/grn', {
    schema: PaginatedSchema(GrnSchema),
    query: { storeId, status, supplierId, from, to, ...cursorParams(paging) },
  });
}

export async function getGrn(id: string) {
  return apiFetch(`/grn/${id}`, { schema: GrnSchema });
}

export async function createGrn(data: { storeId: string; supplierId?: string; invoiceNo?: string }) {
  return apiFetch('/grn', { method: 'POST', body: data, schema: GrnSchema });
}

export async function updateGrn(id: string, data: Partial<{ status: string; invoiceNo: string; receivedAt: string }>) {
  return apiFetch(`/grn/${id}`, { method: 'PATCH', body: data, schema: GrnSchema });
}

export async function deleteGrn(id: string) {
  return apiFetch(`/grn/${id}`, { method: 'DELETE', schema: z.object({}), noBody: true });
}

export async function listGrnLineItems(grnId: string) {
  return apiFetch(`/grn/${grnId}/items`, {
    schema: z.object({ items: z.array(GrnLineItemSchema) }),
  });
}

export async function addGrnLineItem(grnId: string, data: { ean: string; quantity: number; expiryDate?: string; batchNo?: string; unitCost?: number }) {
  return apiFetch(`/grn/${grnId}/items`, { method: 'POST', body: data, schema: GrnLineItemSchema });
}

export async function removeGrnLineItem(grnId: string, itemId: string) {
  return apiFetch(`/grn/${grnId}/items/${itemId}`, { method: 'DELETE', schema: z.object({}), noBody: true });
}

export async function receiveGrn(id: string) {
  return apiFetch(`/grn/${id}/receive`, { method: 'POST', schema: GrnSchema });
}

export async function getGrnKpis(storeId: string) {
  return apiFetch('/grn/kpis', {
    schema: z.object({ pendingCount: z.number(), receivedThisMonth: z.number() }),
    query: { storeId },
  });
}
