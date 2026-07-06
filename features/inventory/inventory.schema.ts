/**
 * features/inventory/inventory.schema.ts — Zod schemas for inventory forms.
 */
import { z } from 'zod';

export const stockInSchema = z.object({
  ean: z.string().min(1, 'EAN is required').max(14, 'Invalid EAN'),
  quantity: z.number({ invalid_type_error: 'Enter a number' }).int().positive('Quantity must be positive'),
  reason: z.string().optional(),
});
export type StockInFormValues = z.infer<typeof stockInSchema>;

export const stockOutSchema = z.object({
  ean: z.string().min(1, 'EAN is required').max(14, 'Invalid EAN'),
  quantity: z.number({ invalid_type_error: 'Enter a number' }).int().positive('Quantity must be positive'),
  reason: z.string().optional(),
});
export type StockOutFormValues = z.infer<typeof stockOutSchema>;

export const adjustStockSchema = z.object({
  ean: z.string().min(1, 'EAN is required').max(14, 'Invalid EAN'),
  quantity: z.number({ invalid_type_error: 'Enter a number' }).int('Must be a whole number'),
  reason: z.string().min(1, 'Reason is required for adjustments'),
});
export type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;

export const updateMinStockSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  minStock: z.number({ invalid_type_error: 'Enter a number' }).int().min(0, 'Min stock cannot be negative'),
});
export type UpdateMinStockFormValues = z.infer<typeof updateMinStockSchema>;
