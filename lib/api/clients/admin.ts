/**
 * lib/api/clients/admin.ts — Admin console endpoints (Doc 1 §6.16, §6.18)
 * Impersonation, feature flags (read-only), webhooks.
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { NotImplementedBackendError } from '../core/errors';
import { PaginatedSchema, cursorParams, type CursorParams } from '../core/pagination';

const WebhookSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  url: z.string(),
  events: z.array(z.string()),
  isActive: z.boolean(),
  secret: z.string().optional(),
  createdAt: z.string(),
});

const FeatureFlagSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  description: z.string().optional(),
  tenantOverrides: z.record(z.boolean()).optional(),
});

/* ── Impersonation ────────────────────────────────────────────────────────── */
export async function startImpersonation(tenantId: string, reason: string) {
  return apiFetch('/admin/impersonate', {
    method: 'POST',
    body: { tenantId, reason },
    schema: z.object({ impersonationToken: z.string(), expiresAt: z.string() }),
  });
}

export async function stopImpersonation() {
  return apiFetch('/admin/impersonate/stop', {
    method: 'POST',
    schema: z.object({ ok: z.boolean() }),
  });
}

/* ── Feature flags ────────────────────────────────────────────────────────── */
export async function listFeatureFlags() {
  return apiFetch('/admin/feature-flags', {
    schema: z.object({ flags: z.array(FeatureFlagSchema) }),
  });
}

/* ── Webhooks ─────────────────────────────────────────────────────────────── */
export async function listWebhooks(tenantId: string, params?: CursorParams) {
  return apiFetch('/admin/webhooks', {
    schema: PaginatedSchema(WebhookSchema),
    query: { tenantId, ...cursorParams(params) },
  });
}

export async function createWebhook(data: { tenantId: string; url: string; events: string[] }) {
  return apiFetch('/admin/webhooks', { method: 'POST', body: data, schema: WebhookSchema });
}

export async function updateWebhook(id: string, data: Partial<{ url: string; events: string[]; isActive: boolean }>) {
  return apiFetch(`/admin/webhooks/${id}`, { method: 'PATCH', body: data, schema: WebhookSchema });
}

export async function deleteWebhook(id: string) {
  return apiFetch(`/admin/webhooks/${id}`, { method: 'DELETE', schema: z.object({}), noBody: true });
}

export async function listWebhookDeliveries(webhookId: string, params?: CursorParams) {
  return apiFetch(`/admin/webhooks/${webhookId}/deliveries`, {
    schema: PaginatedSchema(z.object({
      id: z.string(), event: z.string(), status: z.number(),
      attempt: z.number(), deliveredAt: z.string().optional(),
    })),
    query: cursorParams(params),
  });
}

export async function replayWebhookDelivery(webhookId: string, deliveryId: string) {
  return apiFetch(`/admin/webhooks/${webhookId}/deliveries/${deliveryId}/replay`, {
    method: 'POST',
    schema: z.object({ ok: z.boolean() }),
  });
}

/* ── 🆕 PROPOSED — Audit log viewer ──────────────────────────────────────── */
/** @proposed — Backend not yet implemented. */
export async function listAuditLog(_params: { tenantId?: string; limit?: number }): Promise<never> {
  throw new NotImplementedBackendError('GET /admin/audit-log');
}

/* ── Community product submissions (BE-56 v2) ────────────────────────────── */
const NutritionValuesSchema = z.object({
  servingSize: z.number().optional(),
  servingUnit: z.string().optional(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbohydrates: z.number().optional(),
  sugars: z.number().optional(),
  fat: z.number().optional(),
  saturatedFat: z.number().optional(),
  transFat: z.number().optional(),
  fiber: z.number().optional(),
  sodium: z.number().optional(),
});

const SubmissionSchema = z.object({
  id: z.string().uuid(),
  submitterUserId: z.string(),
  ean: z.string(),
  brand: z.string().nullable(),
  name: z.string().nullable(),
  category: z.string().nullable(),
  s3ObjectKeys: z.array(z.string()),
  nutrition: NutritionValuesSchema.nullable(),
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']),
  submittedAt: z.string(),
  moderatedAt: z.string().nullable(),
  moderatedBy: z.string().nullable(),
  moderationNotes: z.string().nullable(),
});

const SubmissionDetailSchema = SubmissionSchema.extend({
  imageUrls: z.array(z.string()),
});

// Backend's queue endpoint is offset/limit paginated (QueueQuerySchema),
// not cursor-based like webhooks — different shape, kept separate from
// `PaginatedSchema`.
const SubmissionQueueSchema = z.object({
  data: z.array(SubmissionSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export async function listSubmissions(params: {
  status: 'pending' | 'flagged';
  limit?: number;
  offset?: number;
}) {
  return apiFetch('/admin/learn/queue', {
    schema: SubmissionQueueSchema,
    query: { status: params.status, limit: params.limit, offset: params.offset },
  });
}

export async function getSubmission(id: string) {
  return apiFetch(`/admin/learn/${id}`, { schema: SubmissionDetailSchema });
}

export async function approveSubmission(
  id: string,
  data: {
    brand?: string;
    name?: string;
    category?: string;
    nutrition?: z.infer<typeof NutritionValuesSchema>;
    notes?: string;
  },
) {
  return apiFetch(`/admin/learn/${id}/approve`, {
    method: 'POST',
    body: data,
    schema: z.object({
      submission: SubmissionSchema,
      productId: z.string(),
      catalogCreated: z.boolean(),
    }),
  });
}

export async function rejectSubmission(id: string, reason: string) {
  return apiFetch(`/admin/learn/${id}/reject`, {
    method: 'POST',
    body: { reason },
    schema: SubmissionSchema,
  });
}
