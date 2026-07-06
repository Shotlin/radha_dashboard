/**
 * lib/api/clients/ean-lists.ts — EAN audit lists & scan sessions (Doc 1 §6.6, §6.7, §7.3)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { EanListSchema } from '../schemas/common';
import { PaginatedSchema, cursorParams, type CursorParams } from '../core/pagination';

const EanItemSchema = z.object({
  id: z.string(),
  listId: z.string(),
  ean: z.string(),
  productName: z.string().optional(),
  isActive: z.boolean(),
});

const ScanSessionSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  listId: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled']),
  scansCount: z.number(),
  matchedCount: z.number(),
  unmatchedCount: z.number(),
  startedAt: z.string(),
  completedAt: z.string().nullable().optional(),
});

export async function listEanLists(storeId: string, params?: CursorParams) {
  return apiFetch('/ean-lists', {
    schema: PaginatedSchema(EanListSchema),
    query: { storeId, ...cursorParams(params) },
  });
}

export async function getEanList(id: string) {
  return apiFetch(`/ean-lists/${id}`, { schema: EanListSchema });
}

export async function createEanList(data: { storeId: string; name: string }) {
  return apiFetch('/ean-lists', { method: 'POST', body: data, schema: EanListSchema });
}

export async function activateEanList(id: string) {
  return apiFetch(`/ean-lists/${id}/activate`, { method: 'POST', schema: EanListSchema });
}

export async function deactivateEanList(id: string) {
  return apiFetch(`/ean-lists/${id}/deactivate`, { method: 'POST', schema: EanListSchema });
}

export async function importEanItems(listId: string, csv: string) {
  return apiFetch(`/ean-lists/${listId}/import`, {
    method: 'POST',
    body: { csv },
    schema: z.object({ imported: z.number(), errors: z.number(), errorRows: z.array(z.object({ row: z.number(), error: z.string() })).optional() }),
  });
}

export async function listEanItems(listId: string, params?: CursorParams) {
  return apiFetch(`/ean-lists/${listId}/items`, {
    schema: PaginatedSchema(EanItemSchema),
    query: cursorParams(params),
  });
}

export async function listScanSessions(storeId: string, params?: CursorParams) {
  return apiFetch('/scan-sessions', {
    schema: PaginatedSchema(ScanSessionSchema),
    query: { storeId, ...cursorParams(params) },
  });
}

export async function getScanSession(id: string) {
  return apiFetch(`/scan-sessions/${id}`, { schema: ScanSessionSchema });
}

export async function getEanAuditKpis(storeId: string) {
  return apiFetch('/ean-lists/kpis', {
    schema: z.object({ matchRate: z.number(), activeLists: z.number(), totalScans: z.number() }),
    query: { storeId },
  });
}

/**
 * Response of `POST /ean-lists/validate` — the store-scoped single-EAN scan
 * lookup used by the Scan_Result_View proxy.
 *
 * `valid` indicates the barcode is well-formed and verifiable; `matched`
 * indicates it is present on the active approved EAN list for the scope.
 * `product` (when present) carries the catalog record; its `name`/`imageUrl`
 * may be absent, which the view renders as a designed placeholder rather than a
 * fabricated value. Unknown keys are stripped by Zod, so backend additions to
 * the product row do not break validation.
 */
export const ValidateEanResponseSchema = z.object({
  valid: z.boolean(),
  ean: z.string(),
  matched: z.boolean(),
  reason: z.string().optional(),
  product: z
    .object({
      id: z.string().optional(),
      ean: z.string().optional(),
      name: z.string().nullable().optional(),
      imageUrl: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  validatedAt: z.union([z.string(), z.coerce.date()]).optional(),
});
export type ValidateEanResponse = z.infer<typeof ValidateEanResponseSchema>;

/**
 * Validate a single scanned EAN against the active approved list, scoped to the
 * active store. The session tenant is carried by the server-side Bearer token
 * (the backend reads it from `@CurrentTenant`); the active `storeId` is
 * forwarded explicitly so the lookup is store-scoped (Requirements 3.1, 8.1).
 *
 * `signal` lets the caller bound the lookup with an `AbortController` (the scan
 * proxy uses a 5-second window — Requirement 3.5).
 */
export async function validateEan(ean: string, storeId: string | null, signal?: AbortSignal) {
  return apiFetch('/ean-lists/validate', {
    method: 'POST',
    body: { ean, storeId: storeId ?? undefined },
    schema: ValidateEanResponseSchema,
    signal,
  });
}
