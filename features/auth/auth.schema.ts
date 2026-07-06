/**
 * features/auth/auth.schema.ts — Zod schemas for auth forms.
 * Mirror backend DTOs (Doc 1 §4).
 */
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const resetRequestSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});
export type ResetRequestFormValues = z.infer<typeof resetRequestSchema>;

export const resetCompleteSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetCompleteFormValues = z.infer<typeof resetCompleteSchema>;

export const inviteAcceptSchema = z
  .object({
    token: z.string().min(1),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type InviteAcceptFormValues = z.infer<typeof inviteAcceptSchema>;
