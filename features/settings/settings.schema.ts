/**
 * features/settings/settings.schema.ts
 * Zod schemas for the Settings feature (Phase 17).
 * Covers profile update, language preference, and password change.
 */
import { z } from 'zod';

/* ── Supported locales ───────────────────────────────────────────────────── */
export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  // gu recommended but not shipped in v1
] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code'];

export const LocaleCodeSchema = z.enum(
  SUPPORTED_LOCALES.map((l) => l.code) as [LocaleCode, ...LocaleCode[]],
);

/* ── Profile update ──────────────────────────────────────────────────────── */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must be at most 80 characters')
    .trim(),
});
export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;

/* ── Language preference ─────────────────────────────────────────────────── */
export const updateLanguageSchema = z.object({
  language: LocaleCodeSchema,
});
export type UpdateLanguagePayload = z.infer<typeof updateLanguageSchema>;

/* ── Password change (step-up re-auth pattern) ───────────────────────────── */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(12, 'New password must be at least 12 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Include at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });
export type ChangePasswordPayload = z.infer<typeof changePasswordSchema>;

/* ── API response shapes ─────────────────────────────────────────────────── */
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.string(),
  mobile: z.string().optional(),
  tenantId: z.string().uuid(),
  storeIds: z.array(z.string().uuid()),
  language: LocaleCodeSchema.optional().default('en'),
  isVerified: z.boolean(),
  createdAt: z.string(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const TenantInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ownerName: z.string().optional(),
  plan: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type TenantInfo = z.infer<typeof TenantInfoSchema>;
