/**
 * lib/api/clients/recall.ts — Recall alerts endpoints (Doc 1 §6 / recall module)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { PaginatedSchema, cursorParams, type CursorParams } from '../core/pagination';

const RecallAlertSchema = z.object({
  id: z.string(),
  ean: z.string(),
  productName: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  reason: z.string(),
  issuedAt: z.string(),
  resolvedAt: z.string().nullable().optional(),
});

export async function listRecallAlerts(params?: CursorParams) {
  return apiFetch('/recall-alerts', {
    schema: PaginatedSchema(RecallAlertSchema),
    query: cursorParams(params),
  });
}

export async function getRecallAlert(id: string) {
  return apiFetch(`/recall-alerts/${id}`, { schema: RecallAlertSchema });
}
