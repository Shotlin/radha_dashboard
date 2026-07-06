/**
 * features/audit/audit.schema.ts — Zod schemas for EAN lists, items, import jobs,
 * and scan sessions (Phase 11).
 */
import { z } from 'zod';

/* ── EAN List ─────────────────────────────────────────────────────────── */
export const EanListSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  itemCount: z.number(),
  createdAt: z.string(),
});
export type EanList = z.infer<typeof EanListSchema>;

/* ── EAN Item ─────────────────────────────────────────────────────────── */
export const EanItemSchema = z.object({
  id: z.string(),
  listId: z.string(),
  ean: z.string(),
  productName: z.string().optional(),
  isActive: z.boolean(),
});
export type EanItem = z.infer<typeof EanItemSchema>;

/* ── Import Error Row ─────────────────────────────────────────────────── */
export const ImportErrorRowSchema = z.object({
  row: z.number(),
  ean: z.string().optional(),
  error: z.string(),
});
export type ImportErrorRow = z.infer<typeof ImportErrorRowSchema>;

/* ── Import Job ───────────────────────────────────────────────────────── */
export const ImportJobSchema = z.object({
  id: z.string(),
  listId: z.string(),
  status: z.enum(['queued', 'processing', 'done', 'failed', 'cancelled']),
  total: z.number().optional(),
  processed: z.number().optional(),
  imported: z.number().optional(),
  errors: z.number().optional(),
  errorRows: z.array(ImportErrorRowSchema).optional(),
  errorCsvUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  completedAt: z.string().nullable().optional(),
});
export type ImportJob = z.infer<typeof ImportJobSchema>;

/* ── Sync Batch ───────────────────────────────────────────────────────── */
export const SyncBatchSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  status: z.enum(['pending', 'processing', 'done', 'failed', 'cancelled']),
  itemCount: z.number().optional(),
  createdAt: z.string(),
  completedAt: z.string().nullable().optional(),
});
export type SyncBatch = z.infer<typeof SyncBatchSchema>;

/* ── Scan Session ─────────────────────────────────────────────────────── */
export const ScanSessionSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  listId: z.string().optional(),
  listName: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled']),
  scansCount: z.number(),
  matchedCount: z.number(),
  unmatchedCount: z.number(),
  startedAt: z.string(),
  completedAt: z.string().nullable().optional(),
});
export type ScanSession = z.infer<typeof ScanSessionSchema>;

/* ── EAN Audit KPIs ───────────────────────────────────────────────────── */
export const EanAuditKpisSchema = z.object({
  matchRate: z.number(),
  activeLists: z.number(),
  totalScans: z.number(),
});
export type EanAuditKpis = z.infer<typeof EanAuditKpisSchema>;

/* ── Create / Import form inputs ──────────────────────────────────────── */
export const CreateEanListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(100),
});
export type CreateEanListInput = z.infer<typeof CreateEanListSchema>;
