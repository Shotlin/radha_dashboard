'use client';
/**
 * features/admin/admin.queries.ts
 * TanStack Query hooks for the Admin Console feature (Phase 16).
 */
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import {
  ImpersonationAuditListSchema,
  FeatureFlagListSchema,
  WebhookListSchema,
  WebhookDeliveryListSchema,
  SubmissionQueueSchema,
  SubmissionDetailSchema,
} from './admin.schema';
import { z } from 'zod';

/* ── Fetch helpers ───────────────────────────────────────────────────────── */

async function fetchImpersonationAudit(params?: {
  cursor?: string;
  limit?: number;
}): Promise<z.infer<typeof ImpersonationAuditListSchema>> {
  const qs = new URLSearchParams();
  if (params?.cursor) qs.set('cursor', params.cursor);
  if (params?.limit) qs.set('limit', String(params.limit));
  const res = await fetch(`/api/admin/impersonation-audit?${qs}`, { credentials: 'include' });
  if (!res.ok) return { items: [] };
  return res.json() as Promise<z.infer<typeof ImpersonationAuditListSchema>>;
}

async function fetchFeatureFlags(): Promise<z.infer<typeof FeatureFlagListSchema>> {
  const res = await fetch('/api/admin/feature-flags', { credentials: 'include' });
  if (!res.ok) return { flags: [] };
  return res.json() as Promise<z.infer<typeof FeatureFlagListSchema>>;
}

async function fetchWebhooks(
  tenantId: string,
  params?: { cursor?: string; limit?: number },
): Promise<z.infer<typeof WebhookListSchema>> {
  const qs = new URLSearchParams({ tenantId });
  if (params?.cursor) qs.set('cursor', params.cursor);
  if (params?.limit) qs.set('limit', String(params.limit));
  const res = await fetch(`/api/admin/webhooks?${qs}`, { credentials: 'include' });
  if (!res.ok) return { items: [] };
  return res.json() as Promise<z.infer<typeof WebhookListSchema>>;
}

async function fetchWebhookDeliveries(
  webhookId: string,
  params?: { cursor?: string; limit?: number },
): Promise<z.infer<typeof WebhookDeliveryListSchema>> {
  const qs = new URLSearchParams();
  if (params?.cursor) qs.set('cursor', params.cursor);
  if (params?.limit) qs.set('limit', String(params.limit));
  const res = await fetch(`/api/admin/webhooks/${webhookId}/deliveries?${qs}`, {
    credentials: 'include',
  });
  if (!res.ok) return { items: [] };
  return res.json() as Promise<z.infer<typeof WebhookDeliveryListSchema>>;
}

async function fetchSubmissionQueue(params: {
  status: 'pending' | 'flagged';
  limit?: number;
  offset?: number;
}): Promise<z.infer<typeof SubmissionQueueSchema>> {
  const qs = new URLSearchParams({ status: params.status });
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.offset) qs.set('offset', String(params.offset));
  const res = await fetch(`/api/admin/submissions?${qs}`, { credentials: 'include' });
  if (!res.ok) return { data: [], total: 0, limit: params.limit ?? 50, offset: params.offset ?? 0 };
  return res.json() as Promise<z.infer<typeof SubmissionQueueSchema>>;
}

async function fetchSubmissionDetail(id: string): Promise<z.infer<typeof SubmissionDetailSchema>> {
  const res = await fetch(`/api/admin/submissions/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load submission');
  return res.json() as Promise<z.infer<typeof SubmissionDetailSchema>>;
}

/* ── Hooks ───────────────────────────────────────────────────────────────── */

export function useImpersonationAudit(params?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'impersonation-audit', params],
    queryFn: () => fetchImpersonationAudit(params),
    staleTime: 60_000,
  });
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: qk.featureFlags(),
    queryFn: fetchFeatureFlags,
    staleTime: 5 * 60_000,
  });
}

export function useWebhooks(tenantId: string, params?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: qk.webhooks(tenantId),
    queryFn: () => fetchWebhooks(tenantId, params),
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}

export function useWebhookDeliveries(
  webhookId: string,
  params?: { cursor?: string; limit?: number },
) {
  return useQuery({
    queryKey: qk.webhookDeliveries(webhookId),
    queryFn: () => fetchWebhookDeliveries(webhookId, params),
    enabled: !!webhookId,
    staleTime: 30_000,
  });
}

export function useSubmissionsQueue(status: 'pending' | 'flagged' = 'pending') {
  return useQuery({
    queryKey: ['admin', 'submissions', status],
    queryFn: () => fetchSubmissionQueue({ status }),
    staleTime: 30_000,
  });
}

export function useSubmissionDetail(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'submissions', 'detail', id],
    queryFn: () => fetchSubmissionDetail(id as string),
    enabled: !!id,
  });
}
