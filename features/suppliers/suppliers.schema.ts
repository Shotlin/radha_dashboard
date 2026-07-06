/**
 * features/suppliers/suppliers.schema.ts — Zod schemas for supplier forms.
 */
import { z } from 'zod';

export const supplierFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  contactName: z.string().max(100).optional(),
  phone: z
    .string()
    .regex(/^[+\d\s()-]{7,20}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Enter a valid email')
    .optional()
    .or(z.literal('')),
  address: z.string().max(250).optional(),
});
export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export const supplierUpdateSchema = supplierFormSchema.partial();
export type SupplierUpdateValues = z.infer<typeof supplierUpdateSchema>;

export const supplierFiltersSchema = z.object({
  search: z.string().optional(),
  isActive: z.enum(['all', 'active', 'inactive']).default('all'),
});
export type SupplierFiltersValues = z.infer<typeof supplierFiltersSchema>;
