/**
 * features/overview/overview.schema.ts — Zod schemas for the Overview screen.
 */
import { z } from 'zod';

export const OverviewKpiSchema = z.object({
  expiringItems: z.number(),
  expiredItems: z.number(),
  lowStockItems: z.number(),
  openTasks: z.number(),
  pendingGrns: z.number().optional(),
  storeHealthScore: z.number().optional(),
});
export type OverviewKpi = z.infer<typeof OverviewKpiSchema>;

export const AlertSchema = z.object({
  id: z.string(),
  type: z.string(),
  severity: z.enum(['info', 'warning', 'critical']),
  message: z.string(),
  storeId: z.string().optional(),
  actionUrl: z.string().optional(),
  resolvedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type Alert = z.infer<typeof AlertSchema>;

export const ActivityItemSchema = z.object({
  id: z.string(),
  actor: z.string(),
  action: z.string(),
  target: z.string().optional(),
  storeId: z.string().optional(),
  createdAt: z.string(),
});
export type ActivityItem = z.infer<typeof ActivityItemSchema>;

export const MultiStoreItemSchema = z.object({
  storeId: z.string(),
  name: z.string(),
  kpis: OverviewKpiSchema.partial(),
  healthScore: z.number().optional(),
});
export type MultiStoreItem = z.infer<typeof MultiStoreItemSchema>;

export const TrendPointSchema = z.object({
  date: z.string(),
  value: z.number(),
});
export type TrendPoint = z.infer<typeof TrendPointSchema>;
