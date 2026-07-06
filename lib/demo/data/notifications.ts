import 'server-only';

/**
 * lib/demo/data/notifications.ts — Notifications Feature_Area demo dataset.
 *
 * Server-only (R2.7). Records tagged with `tenantId`/`storeId` (R1.4); coverage
 * minimum ≥1 primary / ≥5 list under any scope (R1.1).
 */

import { filterByScope } from '@/lib/demo/scope';
import type { DemoDataset, DemoDatasetBuilder } from '@/lib/demo';
import type { Scoped, StoreScope } from '@/lib/api/core/scope-types';

const TENANT = 'demo-tenant-001';
const S1 = 'demo-store-001';
const S2 = 'demo-store-002';

// KPI tiles (primary: ≥1)
const kpis: Array<Scoped & { id: string; label: string; value: number; tone: string }> = [
  { id: 'nt-kpi-unread', tenantId: TENANT, storeId: null, label: 'Unread', value: 9, tone: 'orange' },
  { id: 'nt-kpi-critical', tenantId: TENANT, storeId: null, label: 'Critical', value: 2, tone: 'danger' },
  { id: 'nt-kpi-s1', tenantId: TENANT, storeId: S1, label: 'Unread', value: 5, tone: 'orange' },
  { id: 'nt-kpi-s2', tenantId: TENANT, storeId: S2, label: 'Unread', value: 4, tone: 'orange' },
];

// Notification list (list: ≥5)
const list: Array<Scoped & { id: string; type: string; title: string; body: string; at: string; read: boolean }> = [
  { id: 'ntl-1', tenantId: TENANT, storeId: null, type: 'expiry', title: 'Expired items on shelf', body: '6 products expired and still on shelf', at: '2025-06-06T08:10:00Z', read: false },
  { id: 'ntl-2', tenantId: TENANT, storeId: null, type: 'inventory', title: 'Low stock alert', body: '12 fast-movers below reorder point', at: '2025-06-06T09:01:00Z', read: false },
  { id: 'ntl-3', tenantId: TENANT, storeId: null, type: 'grn', title: 'GRN awaiting approval', body: 'GRN #GRN-2041 from Shakti Distributors', at: '2025-06-06T09:30:00Z', read: false },
  { id: 'ntl-4', tenantId: TENANT, storeId: null, type: 'audit', title: 'Audit due', body: 'Weekly audit due for Aisle 4', at: '2025-06-06T10:00:00Z', read: true },
  { id: 'ntl-5', tenantId: TENANT, storeId: null, type: 'billing', title: 'Renewal upcoming', body: 'Pro plan renews on 1 Jul 2025', at: '2025-06-05T12:00:00Z', read: true },
  { id: 'ntl-6', tenantId: TENANT, storeId: S1, type: 'expiry', title: 'Batch nearing expiry', body: 'Parle-G batch PG-5510 (Store 1)', at: '2025-06-06T10:15:00Z', read: false },
  { id: 'ntl-7', tenantId: TENANT, storeId: S2, type: 'expiry', title: 'Expired lot detected', body: 'Amul butter lot (Store 2)', at: '2025-06-06T10:20:00Z', read: false },
];

// Channels config (primary/list: ≥1)
const channels: Array<Scoped & { id: string; channel: string; enabled: boolean; target: string }> = [
  { id: 'ch-1', tenantId: TENANT, storeId: null, channel: 'Push (FCM)', enabled: true, target: 'All managers' },
  { id: 'ch-2', tenantId: TENANT, storeId: null, channel: 'Email', enabled: true, target: 'owner@radha.demo' },
  { id: 'ch-3', tenantId: TENANT, storeId: null, channel: 'WhatsApp', enabled: false, target: '+91 98250 00000' },
  { id: 'ch-4', tenantId: TENANT, storeId: null, channel: 'In-app', enabled: true, target: 'All staff' },
  { id: 'ch-5', tenantId: TENANT, storeId: null, channel: 'SMS', enabled: false, target: '+91 98250 00000' },
];

export const buildNotificationsDataset: DemoDatasetBuilder = (scope: StoreScope): DemoDataset => ({
  regions: {
    kpis: filterByScope(kpis, scope),
    list: filterByScope(list, scope),
    channels: filterByScope(channels, scope),
  },
});
