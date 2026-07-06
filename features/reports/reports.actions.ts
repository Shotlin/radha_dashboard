'use client';
/**
 * features/reports/reports.actions.ts — Mutation helpers for reports domain.
 */
import { ReportJobSchema } from './reports.schema';
import { z } from 'zod';

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

/* ── createReport ─────────────────────────────────────────────────────── */
export async function createReport(payload: {
  type: string;
  storeId?: string;
  from?: string;
  to?: string;
  format?: 'xlsx' | 'pdf' | 'csv';
}) {
  return apiPost('/api/reports/export', payload, ReportJobSchema);
}

/* ── reExportReport ───────────────────────────────────────────────────── */
export async function reExportReport(reportId: string) {
  return apiPost(`/api/reports/${reportId}/export`, {}, ReportJobSchema);
}

/* ── deleteReport ─────────────────────────────────────────────────────── */
export async function deleteReport(reportId: string): Promise<void> {
  const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`API error ${res.status}`);
}
