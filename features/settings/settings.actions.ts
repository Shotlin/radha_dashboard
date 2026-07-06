'use client';
/**
 * features/settings/settings.actions.ts
 * Client-side mutation actions for the Settings feature (Phase 17).
 * Calls Next.js route handlers — no direct backend access from client.
 */
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { settingsQk } from './settings.queries';
import type { UpdateProfilePayload, UpdateLanguagePayload, ChangePasswordPayload } from './settings.schema';

/* ── Update language preference ──────────────────────────────────────────── */
export async function updateLanguage(payload: UpdateLanguagePayload): Promise<{ ok: boolean }> {
  const res = await fetch('/api/settings/language', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? 'Failed to update language preference');
  }
  return res.json() as Promise<{ ok: boolean }>;
}

/* ── Change password (step-up re-auth) ───────────────────────────────────── */
/**
 * Step-up re-auth pattern: current password is re-verified server-side before
 * the new password is accepted. The 401 from a wrong current password is
 * surfaced as a form-level validation error — no token refresh happens.
 */
export async function changePassword(
  payload: Pick<ChangePasswordPayload, 'currentPassword' | 'newPassword'>,
): Promise<{ ok: boolean }> {
  const res = await fetch('/api/settings/change-password', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? 'Failed to change password');
  }
  return res.json() as Promise<{ ok: boolean }>;
}

/* ── Update profile ──────────────────────────────────────────────────────── */
export async function updateProfile(payload: UpdateProfilePayload): Promise<{ ok: boolean }> {
  const res = await fetch('/api/settings/profile', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? 'Failed to update profile');
  }
  return res.json() as Promise<{ ok: boolean }>;
}

/* ── React mutation hooks ────────────────────────────────────────────────── */

export function useUpdateLanguageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateLanguage,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: settingsQk.languagePreference() });
      void qc.invalidateQueries({ queryKey: settingsQk.profile() });
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({ mutationFn: changePassword });
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: settingsQk.profile() });
      // Also invalidate the session cache so shell name updates
      void qc.invalidateQueries({ queryKey: ['session', 'me'] });
    },
  });
}
