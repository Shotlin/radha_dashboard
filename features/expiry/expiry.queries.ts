'use client';
/**
 * features/expiry/expiry.queries.ts — TanStack Query hooks for expiry module.
 * All API calls go through /api/expiry/* Route Handler proxies (server-only
 * client cannot be called from client components directly).
 */
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import type { ExpiryFilters } from './expiry.schema';
import type { ExpiryRecord } from '@/lib/api/schemas/common';

/* ── helpers ─────────────────────────────────────────────── */
async function fetchJson<T>(
  url: string,
  params?: Record<string, string | undefined>,
  signal?: AbortSignal,
): Promise<T> {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') sp.set(k, v);
    });
  }
  const fullUrl = params && sp.toString() ? `${url}?${sp.toString()}` : url;
  const res = await fetch(fullUrl, { credentials: 'include', signal });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/* ── useExpiryList ───────────────────────────────────────── */
export interface ExpiryListResponse {
  items: ExpiryRecord[];
  total: number;
  nextCursor: string | null;
}

export function useExpiryList(storeId: string | null, filters?: ExpiryFilters) {
  return useQuery<ExpiryListResponse>({
    // storeId in the key → scope change refetches with a loading state; the
    // forwarded `signal` aborts the previous scope's in-flight request (R8.7/R8.8).
    queryKey: qk.expiry(storeId ?? '', filters),
    queryFn: ({ signal }) =>
      fetchJson<ExpiryListResponse>(
        '/api/expiry',
        {
          storeId: storeId ?? undefined,
          status: filters?.status,
          from: filters?.from,
          to: filters?.to,
          categoryId: filters?.categoryId,
        },
        signal,
      ),
    enabled: !!storeId,
    staleTime: 30_000,
  });
}

/* ── useExpiryKpis ───────────────────────────────────────── */
export interface ExpiryKpisResponse {
  expiring7d: number;
  expiring30d: number;
  expired: number;
}

export function useExpiryKpis(storeId: string | null) {
  return useQuery<ExpiryKpisResponse>({
    queryKey: qk.expiryKpis(storeId ?? ''),
    queryFn: ({ signal }) =>
      fetchJson<ExpiryKpisResponse>(
        '/api/expiry/kpis',
        {
          storeId: storeId ?? undefined,
        },
        signal,
      ),
    enabled: !!storeId,
    staleTime: 60_000,
  });
}

/* ── useExpiryCalendar ───────────────────────────────────── */
export interface CalendarDay {
  date: string;
  count: number;
  severity: string;
}

export interface ExpiryCalendarResponse {
  month: string;
  days: CalendarDay[];
}

export function useExpiryCalendar(storeId: string | null, month: string) {
  return useQuery<ExpiryCalendarResponse>({
    queryKey: qk.expiryCalendar(storeId ?? '', month),
    queryFn: ({ signal }) =>
      fetchJson<ExpiryCalendarResponse>(
        '/api/expiry/calendar',
        {
          storeId: storeId ?? undefined,
          month,
        },
        signal,
      ),
    enabled: !!storeId && !!month,
    staleTime: 60_000,
  });
}

/* ── useExpiryThresholds ─────────────────────────────────── */
export interface ThresholdEntry {
  category: string;
  warningDays: number;
}

export interface ExpiryThresholdsResponse {
  thresholds: ThresholdEntry[];
}

export function useExpiryThresholds(storeId: string | null) {
  return useQuery<ExpiryThresholdsResponse>({
    queryKey: qk.expiryThresholds(storeId ?? ''),
    queryFn: ({ signal }) =>
      fetchJson<ExpiryThresholdsResponse>(
        '/api/expiry/thresholds',
        {
          storeId: storeId ?? undefined,
        },
        signal,
      ),
    enabled: !!storeId,
    staleTime: 5 * 60_000,
  });
}
