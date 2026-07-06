/**
 * features/analytics/analytics.schema.ts — Zod schemas for analytics + leads domain.
 */
import { z } from 'zod';

/* ── Time-series point ─────────────────────────────────────────────────────── */
export const TimeSeriesPointSchema = z.object({
  date: z.string(),
  value: z.number(),
});
export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>;

/* ── Funnel stage ─────────────────────────────────────────────────────────── */
export const FunnelStageSchema = z.object({
  stage: z.string(),
  count: z.number(),
});
export type FunnelStage = z.infer<typeof FunnelStageSchema>;

/* ── Website stats ───────────────────────────────────────────────────────── */
export const WebsiteStatsSchema = z.object({
  visitors: z.number(),
  pageViews: z.number(),
  signups: z.number(),
  conversions: z.number(),
  conversionRate: z.number().optional(),
  funnel: z.array(FunnelStageSchema).optional(),
});
export type WebsiteStats = z.infer<typeof WebsiteStatsSchema>;

/* ── Website time series ─────────────────────────────────────────────────── */
export const WebsiteTimeSeriesSchema = z.object({
  series: z.array(TimeSeriesPointSchema),
});
export type WebsiteTimeSeries = z.infer<typeof WebsiteTimeSeriesSchema>;

/* ── Tenant activity ─────────────────────────────────────────────────────── */
export const TenantActivitySchema = z.object({
  activeUsers: z.number(),
  scans: z.number(),
  tasksCompleted: z.number(),
  series: z.array(TimeSeriesPointSchema).optional(),
});
export type TenantActivity = z.infer<typeof TenantActivitySchema>;

/* ── Lead status ─────────────────────────────────────────────────────────── */
export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LeadStatusSchema = z.enum(LEAD_STATUSES);

/* ── Lead ────────────────────────────────────────────────────────────────── */
export const LeadSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  status: LeadStatusSchema,
  source: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type Lead = z.infer<typeof LeadSchema>;

/* ── Lead list ───────────────────────────────────────────────────────────── */
export const LeadListSchema = z.object({
  items: z.array(LeadSchema),
  total: z.number().optional(),
  nextCursor: z.string().nullable().optional(),
});
export type LeadList = z.infer<typeof LeadListSchema>;

/* ── Lead detail ─────────────────────────────────────────────────────────── */
export const LeadDetailSchema = LeadSchema;
export type LeadDetail = z.infer<typeof LeadDetailSchema>;

/* ── Update lead form ────────────────────────────────────────────────────── */
export const UpdateLeadSchema = z.object({
  status: LeadStatusSchema.optional(),
  notes: z.string().max(2000).optional(),
});
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;

/* ── Convert lead result ─────────────────────────────────────────────────── */
export const ConvertLeadResultSchema = z.object({
  ok: z.boolean(),
  tenantId: z.string().optional(),
});
export type ConvertLeadResult = z.infer<typeof ConvertLeadResultSchema>;

/* ── Date range filter ───────────────────────────────────────────────────── */
export const DateRangeSchema = z.object({
  from: z.string(),
  to: z.string(),
});
export type DateRange = z.infer<typeof DateRangeSchema>;

/* ── Lead filter params ──────────────────────────────────────────────────── */
export const LeadFilterSchema = z.object({
  status: LeadStatusSchema.optional(),
  search: z.string().optional(),
  limit: z.number().optional(),
  cursor: z.string().optional(),
});
export type LeadFilter = z.infer<typeof LeadFilterSchema>;
