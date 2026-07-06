'use client';
/**
 * features/audit/audit.queries.ts — TanStack Query hooks for EAN audit domain.
 * Fetches through Next.js Route Handler proxies under /api/audit/*.
 */
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import {
  EanListSchema,
  EanItemSchema,
  ImportJobSchema,
  ScanSessionSchema,
  EanAuditKpisSchema,
} from './audit.schema';
import { z } from 'zod';

/* ── helpers ──────────────────────────────────────────────────────────── */
async function apiGet<T>(url: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return schema.parse(data);
}

const PaginatedEanListSchema = z.object({
  items: z.array(EanListSchema),
  total: z.number().optional(),
  nextCursor: z.string().nullable().optional(),
  hasMore: z.boolean().optional(),
});

const PaginatedEanItemSchema = z.object({
  items: z.array(EanItemSchema),
  total: z.number().optional(),
  nextCursor: z.string().nullable().optional(),
  hasMore: z.boolean().optional(),
});

const PaginatedScanSessionSchema = z.object({
  items: z.array(ScanSessionSchema),
  total: z.number().optional(),
  nextCursor: z.string().nullable().optional(),
  hasMore: z.boolean().optional(),
});

/* ── useEanLists ──────────────────────────────────────────────────────── */
export function useEanLists(storeId: string | null) {
  return useQuery({
    queryKey: qk.eanLists(storeId ?? ''),
    queryFn: ({ signal }) =>
      apiGet(
        `/api/audit/ean-lists?storeId=${storeId}`,
        PaginatedEanListSchema,
        signal,
      ),
    enabled: !!storeId,
  });
}

/* ── useEanItems ──────────────────────────────────────────────────────── */
export function useEanItems(listId: string | null) {
  return useQuery({
    queryKey: qk.eanItems(listId ?? ''),
    queryFn: () =>
      apiGet(
        `/api/audit/ean-lists/${listId}/items`,
        PaginatedEanItemSchema,
      ),
    enabled: !!listId,
  });
}

/* ── useImportJob (poll until done/failed/cancelled) ──────────────────── */
export function useImportJob(jobId: string | null) {
  return useQuery({
    queryKey: ['import-job', jobId],
    queryFn: () =>
      apiGet(`/api/audit/imports/${jobId}`, ImportJobSchema),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return 3000;
      return ['done', 'failed', 'cancelled'].includes(status) ? false : 3000;
    },
  });
}

/* ── useScanSessions ──────────────────────────────────────────────────── */
export function useScanSessions(storeId: string | null) {
  return useQuery({
    queryKey: qk.scanSessions(storeId ?? ''),
    queryFn: ({ signal }) =>
      apiGet(
        `/api/audit/scan-sessions?storeId=${storeId}`,
        PaginatedScanSessionSchema,
        signal,
      ),
    enabled: !!storeId,
  });
}

/* ── useEanAuditKpis ──────────────────────────────────────────────────── */
export function useEanAuditKpis(storeId: string | null) {
  return useQuery({
    queryKey: qk.eanAuditKpis(storeId ?? ''),
    queryFn: ({ signal }) =>
      apiGet(
        `/api/audit/kpis?storeId=${storeId}`,
        EanAuditKpisSchema,
        signal,
      ),
    enabled: !!storeId,
  });
}
