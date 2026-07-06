/**
 * features/expiry/expiry.schema.ts — Zod schemas for expiry module forms.
 * Mirrors ExpiryRecordSchema from lib/api/schemas/common.ts.
 */
import { z } from 'zod';

/* ── Expiry status ───────────────────────────────────────── */
export const expiryStatusValues = ['fresh', 'expiring_soon', 'expired'] as const;
export type ExpiryStatus = (typeof expiryStatusValues)[number];

/* ── Filters ─────────────────────────────────────────────── */
export const expiryFiltersSchema = z.object({
  status: z.enum(expiryStatusValues).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  categoryId: z.string().optional(),
  search: z.string().optional(),
});
export type ExpiryFilters = z.infer<typeof expiryFiltersSchema>;

/* ── Add / create expiry record ──────────────────────────── */
export const addExpirySchema = z.object({
  ean: z
    .string()
    .min(8, 'EAN must be at least 8 digits')
    .max(14, 'EAN must be at most 14 digits')
    .regex(/^\d+$/, 'EAN must contain only digits'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1'),
  batchNo: z.string().optional(),
});
export type AddExpiryFormValues = z.infer<typeof addExpirySchema>;

/* ── Update expiry record ────────────────────────────────── */
export const updateExpirySchema = z.object({
  expiryDate: z.string().optional(),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .optional(),
  status: z.enum(expiryStatusValues).optional(),
});
export type UpdateExpiryFormValues = z.infer<typeof updateExpirySchema>;

/* ── Threshold editor ────────────────────────────────────── */
export const thresholdEntrySchema = z.object({
  category: z.string().min(1, 'Category is required'),
  warningDays: z
    .number({ invalid_type_error: 'Days must be a number' })
    .int('Days must be a whole number')
    .min(1, 'Must be at least 1 day')
    .max(365, 'Cannot exceed 365 days'),
});
export type ThresholdEntry = z.infer<typeof thresholdEntrySchema>;

export const thresholdsSchema = z.object({
  thresholds: z.array(thresholdEntrySchema).min(1, 'Add at least one category threshold'),
});
export type ThresholdsFormValues = z.infer<typeof thresholdsSchema>;

/* ── KPIs response ───────────────────────────────────────── */
export const expiryKpisSchema = z.object({
  expiring7d: z.number(),
  expiring30d: z.number(),
  expired: z.number(),
});
export type ExpiryKpis = z.infer<typeof expiryKpisSchema>;

/* ── Calendar day ────────────────────────────────────────── */
export const calendarDaySchema = z.object({
  date: z.string(),
  count: z.number(),
  severity: z.string(),
});
export type CalendarDay = z.infer<typeof calendarDaySchema>;

export const expiryCalendarSchema = z.object({
  month: z.string(),
  days: z.array(calendarDaySchema),
});
export type ExpiryCalendar = z.infer<typeof expiryCalendarSchema>;
