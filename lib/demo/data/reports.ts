import 'server-only';

/**
 * lib/demo/data/reports.ts — Reports Feature_Area demo dataset.
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
  { id: 'rp-kpi-generated', tenantId: TENANT, storeId: null, label: 'Reports this month', value: 42, tone: 'teal' },
  { id: 'rp-kpi-scheduled', tenantId: TENANT, storeId: null, label: 'Scheduled', value: 6, tone: 'orange' },
  { id: 'rp-kpi-s1', tenantId: TENANT, storeId: S1, label: 'Reports this month', value: 24, tone: 'teal' },
  { id: 'rp-kpi-s2', tenantId: TENANT, storeId: S2, label: 'Reports this month', value: 18, tone: 'teal' },
];

// Available report templates (list: ≥5)
const available: Array<Scoped & { id: string; name: string; format: string; category: string }> = [
  { id: 'av-1', tenantId: TENANT, storeId: null, name: 'Expiry Risk Summary', format: 'PDF', category: 'Expiry' },
  { id: 'av-2', tenantId: TENANT, storeId: null, name: 'Audit Match-Rate Report', format: 'XLSX', category: 'Audit' },
  { id: 'av-3', tenantId: TENANT, storeId: null, name: 'Inventory Valuation', format: 'XLSX', category: 'Inventory' },
  { id: 'av-4', tenantId: TENANT, storeId: null, name: 'GRN Inward Register', format: 'PDF', category: 'GRN' },
  { id: 'av-5', tenantId: TENANT, storeId: null, name: 'Store Health Scorecard', format: 'PDF', category: 'Analytics' },
  { id: 'av-6', tenantId: TENANT, storeId: null, name: 'Low-Stock Reorder List', format: 'XLSX', category: 'Inventory' },
];

// Recently generated (list: ≥5)
const recent: Array<Scoped & { id: string; name: string; generatedAt: string; by: string; status: string }> = [
  { id: 're-1', tenantId: TENANT, storeId: null, name: 'Expiry Risk Summary — Jun W1', generatedAt: '2025-06-06T06:00:00Z', by: 'Scheduler', status: 'ready' },
  { id: 're-2', tenantId: TENANT, storeId: null, name: 'Audit Match-Rate — May', generatedAt: '2025-06-01T06:00:00Z', by: 'Auditor', status: 'ready' },
  { id: 're-3', tenantId: TENANT, storeId: null, name: 'Inventory Valuation — May', generatedAt: '2025-06-01T06:05:00Z', by: 'Store Manager', status: 'ready' },
  { id: 're-4', tenantId: TENANT, storeId: null, name: 'GRN Inward Register — May', generatedAt: '2025-06-01T06:10:00Z', by: 'Store Manager', status: 'ready' },
  { id: 're-5', tenantId: TENANT, storeId: null, name: 'Store Health Scorecard — May', generatedAt: '2025-06-01T06:15:00Z', by: 'Scheduler', status: 'ready' },
  { id: 're-6', tenantId: TENANT, storeId: S1, name: 'Satellite Reorder List — Jun', generatedAt: '2025-06-06T07:00:00Z', by: 'Store Manager', status: 'ready' },
  { id: 're-7', tenantId: TENANT, storeId: S2, name: 'Maninagar Reorder List — Jun', generatedAt: '2025-06-06T07:05:00Z', by: 'Store Manager', status: 'processing' },
];

// Scheduled reports (primary/list: ≥1)
const scheduled: Array<Scoped & { id: string; name: string; cadence: string; nextRun: string }> = [
  { id: 'sch-1', tenantId: TENANT, storeId: null, name: 'Expiry Risk Summary', cadence: 'weekly', nextRun: '2025-06-13' },
  { id: 'sch-2', tenantId: TENANT, storeId: null, name: 'Store Health Scorecard', cadence: 'monthly', nextRun: '2025-07-01' },
  { id: 'sch-3', tenantId: TENANT, storeId: null, name: 'Low-Stock Reorder List', cadence: 'daily', nextRun: '2025-06-07' },
  { id: 'sch-4', tenantId: TENANT, storeId: null, name: 'Audit Match-Rate Report', cadence: 'monthly', nextRun: '2025-07-01' },
  { id: 'sch-5', tenantId: TENANT, storeId: null, name: 'GRN Inward Register', cadence: 'monthly', nextRun: '2025-07-01' },
];

export const buildReportsDataset: DemoDatasetBuilder = (scope: StoreScope): DemoDataset => ({
  regions: {
    kpis: filterByScope(kpis, scope),
    available: filterByScope(available, scope),
    recent: filterByScope(recent, scope),
    scheduled: filterByScope(scheduled, scope),
  },
});
