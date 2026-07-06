import 'server-only';

/**
 * lib/demo/data/audit.ts — Audit / EAN Feature_Area demo dataset.
 *
 * Uses the 100-product catalogue so every scan returns a real product with
 * image. Server-only (R2.7). Records tagged with tenantId/storeId (R1.4).
 */

import { filterByScope } from '@/lib/demo/scope';
import type { DemoDataset, DemoDatasetBuilder } from '@/lib/demo';
import type { Scoped, StoreScope } from '@/lib/api/core/scope-types';
import { PRODUCT_CATALOGUE } from '@/lib/demo/product-catalogue';

const TENANT = 'demo-tenant-001';
const S1 = 'demo-store-001';
const S2 = 'demo-store-002';

// Match-rate KPI (primary: ≥1)
const matchRateKpi: Array<Scoped & { id: string; matchRate: number; scanned: number; notInList: number }> = [
  { id: 'mr-roll', tenantId: TENANT, storeId: null, matchRate: 93.5, scanned: 8420, notInList: 545 },
  { id: 'mr-s1',   tenantId: TENANT, storeId: S1,   matchRate: 94.2, scanned: 4980, notInList: 288 },
  { id: 'mr-s2',   tenantId: TENANT, storeId: S2,   matchRate: 92.5, scanned: 3440, notInList: 257 },
];

// Approved EAN lists (list: ≥5)
const eanLists: Array<Scoped & { id: string; name: string; version: number; entries: number; uploadedAt: string }> = [
  { id: 'el-1', tenantId: TENANT, storeId: null, name: 'Approved Grocery EANs',         version: 12, entries: 4210, uploadedAt: '2025-06-01' },
  { id: 'el-2', tenantId: TENANT, storeId: null, name: 'Dairy & Frozen EANs',            version: 7,  entries: 860,  uploadedAt: '2025-05-28' },
  { id: 'el-3', tenantId: TENANT, storeId: null, name: 'Personal Care EANs',             version: 5,  entries: 1120, uploadedAt: '2025-05-20' },
  { id: 'el-4', tenantId: TENANT, storeId: null, name: 'Beverages EANs',                 version: 9,  entries: 740,  uploadedAt: '2025-05-30' },
  { id: 'el-5', tenantId: TENANT, storeId: null, name: 'Seasonal Festive EANs',          version: 3,  entries: 320,  uploadedAt: '2025-06-03' },
  { id: 'el-6', tenantId: TENANT, storeId: S1,   name: 'Satellite Local Suppliers',      version: 2,  entries: 180,  uploadedAt: '2025-06-04' },
  { id: 'el-7', tenantId: TENANT, storeId: S2,   name: 'Maninagar Local Suppliers',      version: 2,  entries: 150,  uploadedAt: '2025-06-04' },
];

// ── Audit items: ALL 100 catalogue products ─────────────────────────────────
// Products from EAN lists available at both stores (storeId: null = rollup-visible)
// Products are either 'matched' (on the approved list) or 'not_in_list'.
const STORE_SPECIFIC_EANS = new Set([
  '8904004400012', // Unbranded namkeen — only at Satellite
]);

const items: Array<Scoped & {
  id: string;
  ean: string;
  name: string;
  brand: string;
  category: string;
  status: string;
  imageUrl: string | null;
}> = PRODUCT_CATALOGUE.map((p, i) => ({
  id: `ai-${i + 1}`,
  tenantId: TENANT,
  // Products from local supplier lists are store-specific; rest are tenant-wide
  storeId: STORE_SPECIFIC_EANS.has(p.ean) ? S1 : null,
  ean: p.ean,
  name: p.name,
  brand: p.brand,
  category: p.category,
  // Items on a local supplier list are "not_in_list" for the master list audit
  status: p.eanList === 'Satellite Local Suppliers' || p.eanList === 'Maninagar Local Suppliers'
    ? 'not_in_list'
    : 'matched',
  imageUrl: p.imageUrl,
}));

// Scan sessions (list: ≥5)
const scanSessions: Array<Scoped & {
  id: string;
  startedAt: string;
  auditor: string;
  scanned: number;
  matchRate: number;
}> = [
  { id: 'ss-1', tenantId: TENANT, storeId: null, startedAt: '2025-06-06T07:30:00Z', auditor: 'Auditor',       scanned: 320, matchRate: 95 },
  { id: 'ss-2', tenantId: TENANT, storeId: null, startedAt: '2025-06-05T07:35:00Z', auditor: 'Auditor',       scanned: 410, matchRate: 92 },
  { id: 'ss-3', tenantId: TENANT, storeId: null, startedAt: '2025-06-04T07:20:00Z', auditor: 'Store Manager', scanned: 280, matchRate: 90 },
  { id: 'ss-4', tenantId: TENANT, storeId: null, startedAt: '2025-06-03T07:40:00Z', auditor: 'Auditor',       scanned: 360, matchRate: 94 },
  { id: 'ss-5', tenantId: TENANT, storeId: null, startedAt: '2025-06-02T07:25:00Z', auditor: 'Staff Member',  scanned: 300, matchRate: 91 },
  { id: 'ss-6', tenantId: TENANT, storeId: S1,   startedAt: '2025-06-06T08:00:00Z', auditor: 'Auditor',       scanned: 190, matchRate: 96 },
  { id: 'ss-7', tenantId: TENANT, storeId: S2,   startedAt: '2025-06-06T08:10:00Z', auditor: 'Store Manager', scanned: 170, matchRate: 89 },
];

export const buildAuditDataset: DemoDatasetBuilder = (scope: StoreScope): DemoDataset => ({
  regions: {
    matchRateKpi: filterByScope(matchRateKpi, scope),
    eanLists:     filterByScope(eanLists, scope),
    items:        filterByScope(items, scope),
    scanSessions: filterByScope(scanSessions, scope),
  },
});
