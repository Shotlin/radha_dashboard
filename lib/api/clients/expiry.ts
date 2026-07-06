/**
 * lib/api/clients/expiry.ts — Expiry endpoints (Doc 1 §6.8, §7.2)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { ExpiryRecordSchema } from '../schemas/common';
import { PaginatedSchema, cursorParams, type CursorParams } from '../core/pagination';

export interface ExpiryFilters extends CursorParams {
  storeId: string;
  status?: 'fresh' | 'expiring_soon' | 'expired';
  from?: string;
  to?: string;
  categoryId?: string;
}

export async function listExpiry(filters: ExpiryFilters) {
  const { storeId, status, from, to, categoryId, ...paging } = filters;
  return apiFetch('/expiry', {
    schema: PaginatedSchema(ExpiryRecordSchema),
    query: { storeId, status, from, to, categoryId, ...cursorParams(paging) },
  });
}

export async function getExpiryRecord(id: string) {
  return apiFetch(`/expiry/${id}`, { schema: ExpiryRecordSchema });
}

export async function createExpiry(data: {
  storeId: string;
  ean: string;
  expiryDate: string;
  quantity: number;
  batchNo?: string;
}) {
  return apiFetch('/expiry', { method: 'POST', body: data, schema: ExpiryRecordSchema });
}

export async function updateExpiry(id: string, data: Partial<{ expiryDate: string; quantity: number; status: string }>) {
  return apiFetch(`/expiry/${id}`, { method: 'PATCH', body: data, schema: ExpiryRecordSchema });
}

export async function deleteExpiry(id: string) {
  return apiFetch(`/expiry/${id}`, { method: 'DELETE', schema: z.object({}), noBody: true });
}

export async function getExpiryCalendar(storeId: string, month: string) {
  return apiFetch('/expiry/calendar', {
    schema: z.object({
      month: z.string(),
      days: z.array(z.object({ date: z.string(), count: z.number(), severity: z.string() })),
    }),
    query: { storeId, month },
  });
}

export async function getExpiryKpis(storeId: string) {
  return apiFetch('/expiry/kpis', {
    schema: z.object({ expiring7d: z.number(), expiring30d: z.number(), expired: z.number() }),
    query: { storeId },
  });
}

export async function acknowledgeExpiryAlert(id: string) {
  return apiFetch(`/expiry/${id}/acknowledge`, { method: 'POST', schema: z.object({}), noBody: true });
}

export async function getExpiryThresholds(storeId: string) {
  return apiFetch('/expiry/thresholds', {
    schema: z.object({ thresholds: z.array(z.object({ category: z.string(), warningDays: z.number() })) }),
    query: { storeId },
  });
}

export async function updateExpiryThresholds(storeId: string, thresholds: Array<{ category: string; warningDays: number }>) {
  return apiFetch('/expiry/thresholds', {
    method: 'PUT',
    body: { storeId, thresholds },
    schema: z.object({ ok: z.boolean() }),
  });
}
