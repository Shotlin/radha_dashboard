/**
 * lib/api/clients/analytics.ts — Analytics & website stats (Doc 1 §6.15)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';

const TimeSeriesPointSchema = z.object({ date: z.string(), value: z.number() });

export async function getWebsiteStats(from: string, to: string) {
  return apiFetch('/analytics/website', {
    schema: z.object({
      visitors: z.number(),
      pageViews: z.number(),
      signups: z.number(),
      conversions: z.number(),
      funnel: z.array(z.object({ stage: z.string(), count: z.number() })).optional(),
    }),
    query: { from, to },
  });
}

export async function getWebsiteTimeSeries(metric: string, from: string, to: string) {
  return apiFetch('/analytics/website/series', {
    schema: z.object({ series: z.array(TimeSeriesPointSchema) }),
    query: { metric, from, to },
  });
}

export async function getTenantActivity(tenantId: string, from: string, to: string) {
  return apiFetch('/analytics/tenant-activity', {
    schema: z.object({
      activeUsers: z.number(),
      scans: z.number(),
      tasksCompleted: z.number(),
      series: z.array(TimeSeriesPointSchema).optional(),
    }),
    query: { tenantId, from, to },
  });
}

export async function getLeads(params?: { status?: string; limit?: number; cursor?: string }) {
  return apiFetch('/analytics/leads', {
    schema: z.object({
      items: z.array(z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        phone: z.string().optional(),
        status: z.string(),
        source: z.string().optional(),
        createdAt: z.string(),
      })),
      total: z.number().optional(),
    }),
    query: params,
  });
}

export async function convertLead(leadId: string) {
  return apiFetch(`/analytics/leads/${leadId}/convert`, {
    method: 'POST',
    schema: z.object({ ok: z.boolean(), tenantId: z.string().optional() }),
  });
}
