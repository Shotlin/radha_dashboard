'use client';
/**
 * features/audit/audit.actions.ts — Mutation helpers for EAN audit domain.
 * All calls route through Next.js /api/audit/* proxies.
 */
import { EanListSchema, ImportJobSchema } from './audit.schema';
import { z } from 'zod';

/* ── helpers ──────────────────────────────────────────────────────────── */
async function apiPost<T>(url: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || `API error ${res.status}`);
  }
  const data = await res.json();
  return schema.parse(data);
}

async function apiDelete(url: string): Promise<void> {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`API error ${res.status}`);
}

async function apiPatch<T>(url: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || `API error ${res.status}`);
  }
  const data = await res.json();
  return schema.parse(data);
}

/* ── createList ───────────────────────────────────────────────────────── */
export async function createList(storeId: string, name: string) {
  return apiPost('/api/audit/ean-lists', { storeId, name }, EanListSchema);
}

/* ── activateList ─────────────────────────────────────────────────────── */
export async function activateList(id: string) {
  return apiPost(`/api/audit/ean-lists/${id}/activate`, {}, EanListSchema);
}

/* ── deactivateList ───────────────────────────────────────────────────── */
export async function deactivateList(id: string) {
  return apiPost(`/api/audit/ean-lists/${id}/deactivate`, {}, EanListSchema);
}

/* ── importCsv ────────────────────────────────────────────────────────── */
export async function importCsv(listId: string, csv: string) {
  return apiPost(`/api/audit/ean-lists/${listId}/import`, { csv }, ImportJobSchema);
}

/* ── deleteList ───────────────────────────────────────────────────────── */
export async function deleteList(id: string): Promise<void> {
  return apiDelete(`/api/audit/ean-lists/${id}`);
}

/* ── cancelImport ─────────────────────────────────────────────────────── */
export async function cancelImport(batchId: string): Promise<void> {
  const res = await fetch(`/api/audit/imports/${batchId}/cancel`, { method: 'POST' });
  if (!res.ok) throw new Error(`API error ${res.status}`);
}

/* ── cancelSyncBatch ──────────────────────────────────────────────────── */
export async function cancelSyncBatch(batchId: string): Promise<void> {
  const res = await fetch(`/api/audit/sync-batches/${batchId}/cancel`, { method: 'POST' });
  if (!res.ok) throw new Error(`API error ${res.status}`);
}

/* ── updateList (name) ────────────────────────────────────────────────── */
export async function updateList(id: string, name: string) {
  return apiPatch(`/api/audit/ean-lists/${id}`, { name }, EanListSchema);
}
