'use client';
/**
 * features/billing/billing.queries.ts — TanStack Query hooks for billing.
 * All calls go through /api/* proxies (server-side auth).
 */
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import type { Subscription, PlanList, Usage } from './billing.schema';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ── Subscription ────────────────────────────────────────────────────────── */
export function useSubscription(tenantId: string) {
  return useQuery<Subscription>({
    queryKey: qk.subscription(tenantId),
    queryFn: () =>
      apiFetch<Subscription>(`/api/billing/subscription?tenantId=${encodeURIComponent(tenantId)}`),
    enabled: Boolean(tenantId),
    staleTime: 60_000,
  });
}

/* ── Plans ───────────────────────────────────────────────────────────────── */
export function usePlans() {
  return useQuery<PlanList>({
    queryKey: qk.plans(),
    queryFn: () => apiFetch<PlanList>('/api/billing/plans'),
    staleTime: 5 * 60_000,
  });
}

/* ── Usage ───────────────────────────────────────────────────────────────── */
export function useUsage(tenantId: string) {
  return useQuery<Usage>({
    queryKey: qk.usage(tenantId),
    queryFn: () =>
      apiFetch<Usage>(`/api/billing/usage?tenantId=${encodeURIComponent(tenantId)}`),
    enabled: Boolean(tenantId),
    staleTime: 60_000,
  });
}
