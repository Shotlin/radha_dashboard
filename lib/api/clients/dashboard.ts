/**
 * lib/api/clients/dashboard.ts — Dashboard & overview endpoints (Doc 1 §6.1, §7.1)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { DashboardKpisSchema, AlertItemSchema, HealthScoreSchema } from '../schemas/common';
import { PaginatedSchema, cursorParams } from '../core/pagination';

const ActivityItemSchema = z.object({
  id: z.string(),
  actor: z.string(),
  action: z.string(),
  target: z.string().optional(),
  storeId: z.string().optional(),
  createdAt: z.string(),
});

export const DashboardHomeCardsSchema = z.object({
  cards: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      title: z.string(),
      body: z.string().optional(),
      cta: z.string().optional(),
      route: z.string().optional(),
      priority: z.number().optional(),
      meta: z.record(z.unknown()).optional(),
    }),
  ),
});

/** GET /dashboard/kpis — KPI summary for a store (or multi-store for owner) */
export async function getKpis(storeId?: string) {
  return apiFetch('/dashboard/kpis', {
    schema: DashboardKpisSchema,
    query: storeId ? { storeId } : undefined,
  });
}

/** GET /dashboard/home-cards — Hero Story Banner missions */
export async function getHomeCards(storeId?: string) {
  return apiFetch('/dashboard/home-cards', {
    schema: DashboardHomeCardsSchema,
    query: storeId ? { storeId } : undefined,
  });
}

/** GET /dashboard/alerts — active alerts */
export async function getAlerts(storeId: string) {
  return apiFetch('/dashboard/alerts', {
    schema: z.object({ alerts: z.array(AlertItemSchema) }),
    query: { storeId },
  });
}

/** GET /dashboard/health-score — OHS for a store */
export async function getHealthScore(storeId: string) {
  return apiFetch('/dashboard/health-score', {
    schema: HealthScoreSchema,
    query: { storeId },
  });
}

/** GET /dashboard/activity — recent activity feed */
export async function getActivity(storeId: string, params?: { limit?: number; cursor?: string }) {
  return apiFetch('/dashboard/activity', {
    schema: PaginatedSchema(ActivityItemSchema),
    query: { storeId, ...cursorParams(params) },
  });
}

/** GET /dashboard/multi-store — cross-store rollup (owner only) */
export async function getMultiStoreRollup() {
  return apiFetch('/dashboard/multi-store', {
    schema: z.object({
      stores: z.array(
        z.object({ storeId: z.string(), name: z.string(), kpis: DashboardKpisSchema.partial() }),
      ),
    }),
  });
}

/** GET /dashboard/quick-stats — trend mini-charts */
export async function getQuickStats(storeId: string, from: string, to: string) {
  return apiFetch('/dashboard/quick-stats', {
    schema: z.object({ series: z.array(z.record(z.unknown())) }),
    query: { storeId, from, to },
  });
}
