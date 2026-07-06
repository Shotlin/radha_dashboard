/**
 * lib/api/clients/reports.ts — Reports & exports (Doc 1 §6.13)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { PaginatedSchema, cursorParams, type CursorParams } from '../core/pagination';

const ReportJobSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.enum(['queued', 'processing', 'done', 'failed']),
  storeId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  downloadUrl: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  createdAt: z.string(),
  completedAt: z.string().nullable().optional(),
});

export async function listReportJobs(storeId: string, params?: CursorParams) {
  return apiFetch('/reports', {
    schema: PaginatedSchema(ReportJobSchema),
    query: { storeId, ...cursorParams(params) },
  });
}

export async function createReport(data: { type: string; storeId: string; from?: string; to?: string; format?: 'xlsx' | 'pdf' | 'csv' }) {
  return apiFetch('/reports', { method: 'POST', body: data, schema: ReportJobSchema });
}

export async function getReportJob(id: string) {
  return apiFetch(`/reports/${id}`, { schema: ReportJobSchema });
}

export async function getReportDownloadUrl(id: string) {
  return apiFetch(`/reports/${id}/download`, {
    schema: z.object({ url: z.string(), expiresAt: z.string() }),
  });
}

export async function deleteReportJob(id: string) {
  return apiFetch(`/reports/${id}`, { method: 'DELETE', schema: z.object({}), noBody: true });
}
