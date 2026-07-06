/**
 * features/grn/grn.schema.ts — Zod schemas for GRN forms.
 */
import { z } from 'zod';

export const createGrnSchema = z.object({
  supplierId: z.string().uuid('Invalid supplier').optional().or(z.literal('')),
  invoiceNo: z.string().optional(),
});
export type CreateGrnFormValues = z.infer<typeof createGrnSchema>;

export const updateGrnSchema = z.object({
  invoiceNo: z.string().optional(),
  status: z.enum(['draft', 'received', 'partial', 'cancelled']).optional(),
  receivedAt: z.string().optional(),
});
export type UpdateGrnFormValues = z.infer<typeof updateGrnSchema>;

export const addLineItemSchema = z.object({
  ean: z.string().min(1, 'EAN is required').max(14, 'Invalid EAN'),
  quantity: z
    .number({ invalid_type_error: 'Enter a number' })
    .int()
    .positive('Quantity must be positive'),
  expiryDate: z.string().optional(),
  batchNo: z.string().optional(),
  unitCost: z
    .number({ invalid_type_error: 'Enter a number' })
    .nonnegative('Cost cannot be negative')
    .optional(),
});
export type AddLineItemFormValues = z.infer<typeof addLineItemSchema>;

export const grnFiltersSchema = z.object({
  status: z.enum(['draft', 'received', 'partial', 'cancelled', 'all']).default('all'),
  supplierId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
export type GrnFiltersValues = z.infer<typeof grnFiltersSchema>;
