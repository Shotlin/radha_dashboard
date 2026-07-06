'use client';
/**
 * features/reports/reports.queries.ts — TanStack Query hooks for reports domain.
 */
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import { ReportJobSchema, ReportArtefactSchema } from './reports.schema';
import { z } from 'zod';

/* ── helpers ──────────────────────────────────────────────────────────── */
async function apiGet<T>(url: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return schema.parse(data);
}

const PaginatedJobSchema = z.object({
  items: z.array(ReportJobSchema),
  total: z.number().optional(),
  nextCursor: z.string().nullable().optional(),
  hasMore: z.boolean().optional(),
});

const ArtefactsListSchema = z.object({
  items: z.array(ReportArtefactSchema),
});

/* ── useReportJobs ────────────────────────────────────────────────────── */
export function useReportJobs(storeId: string | null) {
  return useQuery({
    queryKey: qk.reportJobs(storeId ?? ''),
    queryFn: ({ signal }) =>
      apiGet(`/api/reports?storeId=${storeId}`, PaginatedJobSchema, signal),
    enabled: !!storeId,
    refetchInterval: 5000, // keep list fresh while jobs run
  });
}

/* ── useReportJob (polling single job) ───────────────────────────────── */
export function useReportJob(id: string | null) {
  return useQuery({
    queryKey: qk.reportJob(id ?? ''),
    queryFn: () =>
      apiGet(`/api/reports/${id}`, ReportJobSchema),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return 3000;
      return ['done', 'failed'].includes(status) ? false : 3000;
    },
  });
}

/* ── useReportArtefacts ───────────────────────────────────────────────── */
export function useReportArtefacts(reportId: string | null) {
  return useQuery({
    queryKey: ['report-artefacts', reportId],
    queryFn: () =>
      apiGet(`/api/reports/${reportId}/files`, ArtefactsListSchema),
    enabled: !!reportId,
  });
}
