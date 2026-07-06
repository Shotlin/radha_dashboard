'use client';
/**
 * features/analytics/analytics.queries.ts — TanStack Query hooks for analytics + leads.
 * Client components call /api/analytics/* and /api/leads/* proxies.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import type {
  WebsiteStats,
  TenantActivity,
  LeadList,
  LeadDetail,
  LeadFilter,
  UpdateLeadInput,
  ConvertLeadResult,
} from './analytics.schema';

/* ── Shared fetch helper (client-side → Next.js API proxy) ─────────────── */
async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(path, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ── Website stats ───────────────────────────────────────────────────────── */
export function useWebsiteStats(from: string, to: string) {
  return useQuery<WebsiteStats>({
    queryKey: qk.websiteStats(from, to),
    queryFn: () =>
      apiFetch<WebsiteStats>(
        `/api/analytics/website?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ),
    enabled: Boolean(from && to),
    staleTime: 60_000,
  });
}

/* ── Funnel (derived from website stats) ────────────────────────────────── */
export function useFunnel(from: string, to: string) {
  return useQuery<WebsiteStats['funnel']>({
    queryKey: [...qk.websiteStats(from, to), 'funnel'],
    queryFn: async () => {
      const data = await apiFetch<WebsiteStats>(
        `/api/analytics/website?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      return data.funnel ?? [];
    },
    enabled: Boolean(from && to),
    staleTime: 60_000,
  });
}

/* ── Tenant activity ─────────────────────────────────────────────────────── */
export function useTenantActivity(tenantId: string, from: string, to: string) {
  return useQuery<TenantActivity>({
    queryKey: qk.tenantActivity(tenantId, from, to),
    queryFn: () =>
      apiFetch<TenantActivity>(
        `/api/analytics/tenant-activity?tenantId=${encodeURIComponent(tenantId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ),
    enabled: Boolean(tenantId && from && to),
    staleTime: 60_000,
  });
}

/* ── Leads list ──────────────────────────────────────────────────────────── */
export function useLeads(params?: LeadFilter) {
  return useQuery<LeadList>({
    queryKey: qk.leads(params),
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.search) qs.set('search', params.search);
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.cursor) qs.set('cursor', params.cursor);
      return apiFetch<LeadList>(`/api/analytics/leads${qs.toString() ? `?${qs.toString()}` : ''}`);
    },
    staleTime: 30_000,
  });
}

/* ── Lead detail ─────────────────────────────────────────────────────────── */
export function useLeadDetail(id: string | null) {
  return useQuery<LeadDetail>({
    queryKey: ['analytics', 'leads', 'detail', id],
    queryFn: () => apiFetch<LeadDetail>(`/api/analytics/leads/${id}`),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/* ── Update lead mutation ────────────────────────────────────────────────── */
export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadInput }) =>
      apiFetch<LeadDetail>(`/api/analytics/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: qk.leads() });
      void queryClient.invalidateQueries({ queryKey: ['analytics', 'leads', 'detail', id] });
    },
  });
}

/* ── Convert lead mutation ───────────────────────────────────────────────── */
export function useConvertLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) =>
      apiFetch<ConvertLeadResult>(`/api/analytics/leads/${leadId}/convert`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.leads() });
    },
  });
}
