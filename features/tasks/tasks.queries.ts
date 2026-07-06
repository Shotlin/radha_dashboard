'use client';
/**
 * features/tasks/tasks.queries.ts — TanStack Query hooks for tasks module.
 * All API calls go through /api/tasks/* Route Handler proxies.
 */
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import type { TaskFilters } from './tasks.schema';
import type { Task } from '@/lib/api/schemas/common';

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

/* ── useTasksList ────────────────────────────────────────── */
export interface TasksListResponse {
  items: Task[];
  total: number;
  nextCursor: string | null;
}

export function useTasksList(storeId: string | null, filters?: TaskFilters) {
  return useQuery<TasksListResponse>({
    // storeId in the key → scope change refetches with a loading state; the
    // forwarded `signal` aborts the previous scope's in-flight request (R8.7/R8.8).
    queryKey: qk.tasks(storeId ?? '', filters),
    queryFn: ({ signal }) =>
      fetchJson<TasksListResponse>(
        '/api/tasks',
        {
          storeId: storeId ?? undefined,
          status: filters?.status,
          assigneeId: filters?.assigneeId,
          priority: filters?.priority,
          from: filters?.from,
          to: filters?.to,
        },
        signal,
      ),
    enabled: !!storeId,
    staleTime: 30_000,
  });
}

/* ── useTaskStats ────────────────────────────────────────── */
export interface TaskStatsResponse {
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

export function useTaskStats(storeId: string | null) {
  // Derived from useTasksList with no filters — counts grouped by status
  const { data, isLoading, isError } = useTasksList(storeId);

  const stats: TaskStatsResponse = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };

  if (data?.items) {
    for (const task of data.items) {
      stats[task.status]++;
    }
  }

  return { data: stats, isLoading, isError };
}

/* ── useTaskDetail ───────────────────────────────────────── */
export function useTaskDetail(id: string | null) {
  return useQuery<Task>({
    queryKey: qk.task(id ?? ''),
    queryFn: () => fetchJson<Task>(`/api/tasks/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/* ── useTaskTemplates ────────────────────────────────────── */
export interface TaskTemplate {
  id: string;
  title: string;
}

export interface TaskTemplatesResponse {
  templates: TaskTemplate[];
}

export function useTaskTemplates(storeId: string | null) {
  return useQuery<TaskTemplatesResponse>({
    queryKey: qk.taskTemplates(storeId ?? ''),
    queryFn: ({ signal }) =>
      fetchJson<TaskTemplatesResponse>(
        '/api/tasks/templates',
        {
          storeId: storeId ?? undefined,
        },
        signal,
      ),
    enabled: !!storeId,
    staleTime: 5 * 60_000,
  });
}
