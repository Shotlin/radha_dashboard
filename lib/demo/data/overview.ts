import 'server-only';

/**
 * lib/demo/data/overview.ts — Overview Feature_Area demo dataset.
 *
 * Server-only: importing this from a client component is a build-time error
 * (Requirement 2.7). Records are tagged with `tenantId`/`storeId` so the scope
 * selector can include/exclude them (R1.4). Tenant-level records (`storeId: null`)
 * are rollup-visible and also surface under any single store, guaranteeing the
 * ≥1-per-primary-region / ≥5-per-list-region coverage minimum (R1.1) even when a
 * single store is selected, while per-store records demonstrate store filtering.
 *
 * This module exports its builder; `lib/demo/index.ts` imports and registers it
 * (the registry is populated when that module loads).
 */

import { filterByScope } from '@/lib/demo/scope';
import type { DemoDataset, DemoDatasetBuilder } from '@/lib/demo';
import type { Scoped, StoreScope } from '@/lib/api/core/scope-types';

const TENANT = 'demo-tenant-001';
const S1 = 'demo-store-001';
const S2 = 'demo-store-002';

// --- KPI tiles (primary region: ≥1 after scoping) ---
const kpis: Array<Scoped & { id: string; label: string; value: number; unit: string; tone: string }> = [
  { id: 'kpi-roll-scans', tenantId: TENANT, storeId: null, label: 'Scans today', value: 1284, unit: '', tone: 'orange' },
  { id: 'kpi-roll-expiry', tenantId: TENANT, storeId: null, label: 'Expiring this week', value: 37, unit: '', tone: 'amber' },
  { id: 'kpi-s1-scans', tenantId: TENANT, storeId: S1, label: 'Scans today', value: 742, unit: '', tone: 'orange' },
  { id: 'kpi-s2-scans', tenantId: TENANT, storeId: S2, label: 'Scans today', value: 542, unit: '', tone: 'orange' },
];

// --- Overall Health Score gauge (primary region: ≥1 after scoping) ---
const ohs: Array<Scoped & { id: string; score: number; band: string; trend: number }> = [
  { id: 'ohs-roll', tenantId: TENANT, storeId: null, score: 86, band: 'Healthy', trend: 3 },
  { id: 'ohs-s1', tenantId: TENANT, storeId: S1, score: 88, band: 'Healthy', trend: 4 },
  { id: 'ohs-s2', tenantId: TENANT, storeId: S2, score: 81, band: 'Watch', trend: -2 },
];

// --- Trend series points (list region: ≥5 after scoping) ---
const trends: Array<Scoped & { id: string; date: string; scans: number; matched: number }> = [
  { id: 'tr-1', tenantId: TENANT, storeId: null, date: '2025-06-02', scans: 980, matched: 902 },
  { id: 'tr-2', tenantId: TENANT, storeId: null, date: '2025-06-03', scans: 1042, matched: 967 },
  { id: 'tr-3', tenantId: TENANT, storeId: null, date: '2025-06-04', scans: 1110, matched: 1031 },
  { id: 'tr-4', tenantId: TENANT, storeId: null, date: '2025-06-05', scans: 1198, matched: 1124 },
  { id: 'tr-5', tenantId: TENANT, storeId: null, date: '2025-06-06', scans: 1247, matched: 1175 },
  { id: 'tr-6', tenantId: TENANT, storeId: S1, date: '2025-06-06', scans: 712, matched: 690 },
  { id: 'tr-7', tenantId: TENANT, storeId: S2, date: '2025-06-06', scans: 535, matched: 485 },
];

// --- Alerts (list region: ≥5 after scoping) ---
const alerts: Array<Scoped & { id: string; severity: string; title: string; at: string }> = [
  { id: 'al-1', tenantId: TENANT, storeId: null, severity: 'danger', title: '6 products expired and still on shelf', at: '2025-06-06T08:10:00Z' },
  { id: 'al-2', tenantId: TENANT, storeId: null, severity: 'warn', title: '37 items expiring within 7 days', at: '2025-06-06T08:12:00Z' },
  { id: 'al-3', tenantId: TENANT, storeId: null, severity: 'warn', title: 'Low stock on 12 fast-movers', at: '2025-06-06T09:01:00Z' },
  { id: 'al-4', tenantId: TENANT, storeId: null, severity: 'info', title: 'GRN #GRN-2041 awaiting approval', at: '2025-06-06T09:30:00Z' },
  { id: 'al-5', tenantId: TENANT, storeId: null, severity: 'info', title: 'Weekly audit due for Aisle 4', at: '2025-06-06T10:00:00Z' },
  { id: 'al-6', tenantId: TENANT, storeId: S1, severity: 'warn', title: 'Parle-G batch nearing expiry (Store 1)', at: '2025-06-06T10:15:00Z' },
  { id: 'al-7', tenantId: TENANT, storeId: S2, severity: 'danger', title: 'Amul butter expired lot (Store 2)', at: '2025-06-06T10:20:00Z' },
];

// --- Recent activity feed (list region: ≥5 after scoping) ---
const activity: Array<Scoped & { id: string; actor: string; action: string; at: string }> = [
  { id: 'ac-1', tenantId: TENANT, storeId: null, actor: 'Store Manager', action: 'Closed audit session for Aisle 2', at: '2025-06-06T07:45:00Z' },
  { id: 'ac-2', tenantId: TENANT, storeId: null, actor: 'Staff Member', action: 'Cleared 8 expired items from Dairy', at: '2025-06-06T08:05:00Z' },
  { id: 'ac-3', tenantId: TENANT, storeId: null, actor: 'Auditor', action: 'Uploaded approved EAN list v12', at: '2025-06-06T08:40:00Z' },
  { id: 'ac-4', tenantId: TENANT, storeId: null, actor: 'Store Manager', action: 'Received GRN #GRN-2039', at: '2025-06-06T09:10:00Z' },
  { id: 'ac-5', tenantId: TENANT, storeId: null, actor: 'Staff Member', action: 'Completed stock count for Snacks', at: '2025-06-06T09:55:00Z' },
  { id: 'ac-6', tenantId: TENANT, storeId: S1, actor: 'Staff Member', action: 'Added 14 expiry entries (Store 1)', at: '2025-06-06T10:05:00Z' },
  { id: 'ac-7', tenantId: TENANT, storeId: S2, actor: 'Store Manager', action: 'Assigned shelf-clear task (Store 2)', at: '2025-06-06T10:25:00Z' },
];

// --- Multi-store summary (primary/list region: ≥1 per store) ---
const multiStore: Array<Scoped & { id: string; storeName: string; health: number; expiring: number; lowStock: number }> = [
  { id: 'ms-s1', tenantId: TENANT, storeId: S1, storeName: 'RADHA Mart — Satellite', health: 88, expiring: 21, lowStock: 7 },
  { id: 'ms-s2', tenantId: TENANT, storeId: S2, storeName: 'RADHA Mart — Maninagar', health: 81, expiring: 16, lowStock: 5 },
];

export const buildOverviewDataset: DemoDatasetBuilder = (scope: StoreScope): DemoDataset => ({
  regions: {
    kpis: filterByScope(kpis, scope),
    ohs: filterByScope(ohs, scope),
    trends: filterByScope(trends, scope),
    alerts: filterByScope(alerts, scope),
    activity: filterByScope(activity, scope),
    multiStore: filterByScope(multiStore, scope),
  },
});
