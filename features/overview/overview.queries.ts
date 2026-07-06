'use client';
/**
 * features/overview/overview.queries.ts — TanStack Query hooks for Overview screen.
 */
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import { UnauthorizedError } from '@/lib/api/core/errors';
import type { OverviewKpi, Alert, ActivityItem, MultiStoreItem, TrendPoint } from './overview.schema';

async function apiFetch<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { credentials: 'include', signal });
  if (!res.ok) {
    // Surface a 401 distinctly so the global query client skips retrying it
    // (query-client `retry`: UnauthorizedError → no retry). This NEVER triggers a
    // login redirect — only `lib/auth/use-session.ts` (the /api/auth/me path)
    // redirects on a hard session end. A failed feature region simply renders its
    // RegionError + retry while sibling regions keep their data (R10.1, R10.6).
    if (res.status === 401) throw new UnauthorizedError(res.headers.get('x-request-id') ?? undefined);
    throw new Error(`API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useOverviewKpis(storeId: string | null) {
  const qs = storeId ? `?storeId=${storeId}` : '';
  return useQuery<OverviewKpi>({
    // storeId in the key → a scope change is a new key (refetch + loading); the
    // forwarded `signal` aborts the previous scope's in-flight request (R8.7/R8.8).
    queryKey: qk.kpis(storeId ?? ''),
    queryFn: ({ signal }) => apiFetch<OverviewKpi>(`/api/overview/kpis${qs}`, signal),
    enabled: true,
    staleTime: 60_000,
  });
}

export function useOverviewAlerts(storeId: string | null) {
  const qs = storeId ? `?storeId=${storeId}` : '';
  return useQuery<{ alerts: Alert[] }>({
    queryKey: qk.alerts(storeId ?? ''),
    queryFn: ({ signal }) => apiFetch<{ alerts: Alert[] }>(`/api/overview/alerts${qs}`, signal),
    staleTime: 60_000,
  });
}

export function useOverviewActivity(storeId: string | null, limit = 10) {
  const qs = new URLSearchParams();
  if (storeId) qs.set('storeId', storeId);
  qs.set('limit', String(limit));
  return useQuery<{ items: ActivityItem[] }>({
    queryKey: qk.activity(storeId ?? ''),
    queryFn: ({ signal }) =>
      apiFetch<{ items: ActivityItem[] }>(`/api/overview/activity?${qs.toString()}`, signal),
    staleTime: 60_000,
  });
}

export function useOverviewTrends(storeId: string | null, from: string, to: string) {
  const qs = new URLSearchParams({ from, to });
  if (storeId) qs.set('storeId', storeId);
  return useQuery<{ series: TrendPoint[] }>({
    queryKey: qk.quickStats(storeId ?? '', from, to),
    queryFn: ({ signal }) =>
      apiFetch<{ series: TrendPoint[] }>(`/api/overview/trends?${qs.toString()}`, signal),
    staleTime: 120_000,
  });
}

export function useMultiStoreRollup(enabled: boolean) {
  return useQuery<{ stores: MultiStoreItem[] }>({
    queryKey: qk.multiStore(),
    queryFn: ({ signal }) => apiFetch<{ stores: MultiStoreItem[] }>(`/api/overview/multi-store`, signal),
    enabled,
    staleTime: 120_000,
  });
}

export function useHealthScore(storeId: string | null) {
  const qs = storeId ? `?storeId=${storeId}` : '';
  return useQuery<{ overall: number; components?: { label: string; score: number }[]; lastAssessedAt?: string | null }>({
    queryKey: qk.healthScore(storeId ?? ''),
    queryFn: ({ signal }) => apiFetch(`/api/overview/health-score${qs}`, signal),
    staleTime: 120_000,
  });
}
