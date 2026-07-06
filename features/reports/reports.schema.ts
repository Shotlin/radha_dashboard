/**
 * features/reports/reports.schema.ts — Zod schemas for report jobs and artefacts.
 */
import { z } from 'zod';

/* ── Report Job ───────────────────────────────────────────────────────── */
export const ReportJobSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.enum(['queued', 'processing', 'done', 'failed']),
  storeId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  format: z.enum(['xlsx', 'pdf', 'csv']).optional(),
  downloadUrl: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  createdAt: z.string(),
  completedAt: z.string().nullable().optional(),
});
export type ReportJob = z.infer<typeof ReportJobSchema>;

/* ── Report Artefact ──────────────────────────────────────────────────── */
export const ReportArtefactSchema = z.object({
  id: z.string(),
  reportId: z.string(),
  fileName: z.string(),
  format: z.enum(['xlsx', 'pdf', 'csv']),
  sizeBytes: z.number(),
  downloadUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  expiresAt: z.string().nullable().optional(),
});
export type ReportArtefact = z.infer<typeof ReportArtefactSchema>;

/* ── Builder form input ───────────────────────────────────────────────── */
export const DATASET_TYPES = [
  { value: 'expiry', label: 'Expiry Report' },
  { value: 'inventory', label: 'Inventory Report' },
  { value: 'grn', label: 'GRN Report' },
  { value: 'tasks', label: 'Tasks Report' },
  { value: 'audit', label: 'EAN Audit Report' },
  { value: 'sales_summary', label: 'Sales Summary' },
] as const;

export const ReportBuilderSchema = z.object({
  type: z.string().min(1, 'Dataset type is required'),
  from: z.string().min(1, 'Start date is required'),
  to: z.string().min(1, 'End date is required'),
  storeId: z.string().optional(),
  format: z.enum(['xlsx', 'pdf', 'csv']),
});
export type ReportBuilderInput = z.infer<typeof ReportBuilderSchema>;
