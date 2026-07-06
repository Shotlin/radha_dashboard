'use client';
/**
 * features/settings/settings.queries.ts
 * TanStack Query hooks for the Settings feature (Phase 17).
 * All fetches go through Next.js route handlers — never directly to the backend.
 */
import { useQuery } from '@tanstack/react-query';
import type { UserProfile, TenantInfo } from './settings.schema';

/* ── Query keys ──────────────────────────────────────────────────────────── */
export const settingsQk = {
  profile: () => ['settings', 'profile'] as const,
  tenantInfo: () => ['settings', 'tenant'] as const,
  languagePreference: () => ['settings', 'language'] as const,
} as const;

/* ── Fetch helpers ───────────────────────────────────────────────────────── */

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load profile');
  // /api/auth/me returns { user: SessionUser } — map to UserProfile shape
  const data = (await res.json()) as {
    user: {
      id: string;
      name: string;
      role: string;
      tenantId: string;
      storeIds: string[];
      permissions: string[];
    };
  };
  return {
    id: data.user.id,
    name: data.user.name,
    role: data.user.role,
    mobile: undefined,
    tenantId: data.user.tenantId,
    storeIds: data.user.storeIds,
    language: 'en',
    isVerified: false,
    createdAt: new Date().toISOString(),
  };
}

async function fetchTenantInfo(): Promise<TenantInfo> {
  const res = await fetch('/api/settings/tenant', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load tenant info');
  return res.json() as Promise<TenantInfo>;
}

async function fetchLanguagePreference(): Promise<{ language: string }> {
  const res = await fetch('/api/settings/language', { credentials: 'include' });
  if (!res.ok) return { language: 'en' };
  return res.json() as Promise<{ language: string }>;
}

/* ── Hooks ───────────────────────────────────────────────────────────────── */

/** Current user profile (name, role, mobile, stores). */
export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: settingsQk.profile(),
    queryFn: fetchProfile,
    staleTime: 5 * 60_000,
  });
}

/** Tenant info (name, plan, created date). */
export function useTenantInfo() {
  return useQuery<TenantInfo>({
    queryKey: settingsQk.tenantInfo(),
    queryFn: fetchTenantInfo,
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

/** User's saved language preference. */
export function useLanguagePreference() {
  return useQuery<{ language: string }>({
    queryKey: settingsQk.languagePreference(),
    queryFn: fetchLanguagePreference,
    staleTime: 10 * 60_000,
  });
}
