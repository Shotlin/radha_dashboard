import 'server-only';

/**
 * lib/demo/data/tasks.ts — Tasks Feature_Area demo dataset.
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
  { id: 'tk-kpi-open', tenantId: TENANT, storeId: null, label: 'Open tasks', value: 18, tone: 'orange' },
  { id: 'tk-kpi-overdue', tenantId: TENANT, storeId: null, label: 'Overdue', value: 3, tone: 'danger' },
  { id: 'tk-kpi-s1', tenantId: TENANT, storeId: S1, label: 'Open tasks', value: 11, tone: 'orange' },
  { id: 'tk-kpi-s2', tenantId: TENANT, storeId: S2, label: 'Open tasks', value: 7, tone: 'orange' },
];

// Task list (list: ≥5)
const list: Array<Scoped & { id: string; title: string; assignee: string; due: string; priority: string; status: string }> = [
  { id: 'tkl-1', tenantId: TENANT, storeId: null, title: 'Clear expired items from Dairy', assignee: 'Staff Member', due: '2025-06-06', priority: 'high', status: 'open' },
  { id: 'tkl-2', tenantId: TENANT, storeId: null, title: 'Audit Aisle 4 EAN compliance', assignee: 'Auditor', due: '2025-06-07', priority: 'medium', status: 'open' },
  { id: 'tkl-3', tenantId: TENANT, storeId: null, title: 'Approve GRN #GRN-2041', assignee: 'Store Manager', due: '2025-06-06', priority: 'high', status: 'open' },
  { id: 'tkl-4', tenantId: TENANT, storeId: null, title: 'Restock low-stock fast-movers', assignee: 'Staff Member', due: '2025-06-08', priority: 'medium', status: 'open' },
  { id: 'tkl-5', tenantId: TENANT, storeId: null, title: 'Weekly stock count — Snacks', assignee: 'Staff Member', due: '2025-06-05', priority: 'low', status: 'done' },
  { id: 'tkl-6', tenantId: TENANT, storeId: S1, title: 'Refill festive gift hampers shelf', assignee: 'Staff Member', due: '2025-06-09', priority: 'medium', status: 'open' },
  { id: 'tkl-7', tenantId: TENANT, storeId: S2, title: 'Verify cold-chain logger reading', assignee: 'Store Manager', due: '2025-06-07', priority: 'high', status: 'open' },
];

// Assignees (primary/list: ≥1)
const assignees: Array<Scoped & { id: string; name: string; role: string; openTasks: number }> = [
  { id: 'as-1', tenantId: TENANT, storeId: null, name: 'Staff Member', role: 'staff', openTasks: 6 },
  { id: 'as-2', tenantId: TENANT, storeId: null, name: 'Store Manager', role: 'manager', openTasks: 4 },
  { id: 'as-3', tenantId: TENANT, storeId: null, name: 'Auditor', role: 'auditor', openTasks: 3 },
  { id: 'as-4', tenantId: TENANT, storeId: S1, name: 'Ramesh (Satellite)', role: 'staff', openTasks: 5 },
  { id: 'as-5', tenantId: TENANT, storeId: S2, name: 'Priya (Maninagar)', role: 'staff', openTasks: 3 },
];

// Activity (list: ≥5)
const activity: Array<Scoped & { id: string; actor: string; action: string; at: string }> = [
  { id: 'tka-1', tenantId: TENANT, storeId: null, actor: 'Staff Member', action: 'Completed "Weekly stock count — Snacks"', at: '2025-06-05T17:30:00Z' },
  { id: 'tka-2', tenantId: TENANT, storeId: null, actor: 'Store Manager', action: 'Assigned "Clear expired items from Dairy"', at: '2025-06-06T07:10:00Z' },
  { id: 'tka-3', tenantId: TENANT, storeId: null, actor: 'Auditor', action: 'Started "Audit Aisle 4 EAN compliance"', at: '2025-06-06T08:00:00Z' },
  { id: 'tka-4', tenantId: TENANT, storeId: null, actor: 'Staff Member', action: 'Commented on "Restock low-stock fast-movers"', at: '2025-06-06T09:25:00Z' },
  { id: 'tka-5', tenantId: TENANT, storeId: null, actor: 'Store Manager', action: 'Reopened "Approve GRN #GRN-2041"', at: '2025-06-06T09:50:00Z' },
  { id: 'tka-6', tenantId: TENANT, storeId: S1, actor: 'Ramesh', action: 'Updated hamper shelf task (Store 1)', at: '2025-06-06T10:15:00Z' },
  { id: 'tka-7', tenantId: TENANT, storeId: S2, actor: 'Priya', action: 'Logged cold-chain reading (Store 2)', at: '2025-06-06T10:30:00Z' },
];

export const buildTasksDataset: DemoDatasetBuilder = (scope: StoreScope): DemoDataset => ({
  regions: {
    kpis: filterByScope(kpis, scope),
    list: filterByScope(list, scope),
    assignees: filterByScope(assignees, scope),
    activity: filterByScope(activity, scope),
  },
});
