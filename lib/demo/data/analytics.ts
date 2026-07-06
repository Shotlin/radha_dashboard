import 'server-only';

/**
 * lib/demo/data/analytics.ts — Analytics Feature_Area demo dataset.
 *
 * Server-only (R2.7). Records tagged with `tenantId`/`storeId` (R1.4); tenant-level
 * records guarantee the ≥1 primary / ≥5 list coverage minimum under any scope (R1.1)
 * while per-store records demonstrate store filtering.
 */

import { filterByScope } from '@/lib/demo/scope';
import type { DemoDataset, DemoDatasetBuilder } from '@/lib/demo';
import type { Scoped, StoreScope } from '@/lib/api/core/scope-types';

const TENANT = 'demo-tenant-001';
const S1 = 'demo-store-001';
const S2 = 'demo-store-002';

// KPI tiles (primary: ≥1)
const kpis: Array<Scoped & { id: string; label: string; value: number; unit: string }> = [
  { id: 'an-kpi-scans', tenantId: TENANT, storeId: null, label: 'Scans (30d)', value: 34210, unit: '' },
  { id: 'an-kpi-match', tenantId: TENANT, storeId: null, label: 'Match rate', value: 93, unit: '%' },
  { id: 'an-kpi-s1', tenantId: TENANT, storeId: S1, label: 'Scans (30d)', value: 19840, unit: '' },
  { id: 'an-kpi-s2', tenantId: TENANT, storeId: S2, label: 'Scans (30d)', value: 14370, unit: '' },
];

// Scan trend series (list: ≥5)
const scanTrends: Array<Scoped & { id: string; week: string; scans: number; matched: number }> = [
  { id: 'st-1', tenantId: TENANT, storeId: null, week: 'W19', scans: 7100, matched: 6580 },
  { id: 'st-2', tenantId: TENANT, storeId: null, week: 'W20', scans: 7620, matched: 7090 },
  { id: 'st-3', tenantId: TENANT, storeId: null, week: 'W21', scans: 8210, matched: 7700 },
  { id: 'st-4', tenantId: TENANT, storeId: null, week: 'W22', scans: 8540, matched: 8010 },
  { id: 'st-5', tenantId: TENANT, storeId: null, week: 'W23', scans: 8930, matched: 8420 },
  { id: 'st-6', tenantId: TENANT, storeId: S1, week: 'W23', scans: 5210, matched: 4980 },
  { id: 'st-7', tenantId: TENANT, storeId: S2, week: 'W23', scans: 3720, matched: 3440 },
];

// Top products (list: ≥5)
const topProducts: Array<Scoped & { id: string; name: string; ean: string; scans: number }> = [
  { id: 'tp-1', tenantId: TENANT, storeId: null, name: 'Parle-G Biscuits 100g', ean: '8901719101015', scans: 1820 },
  { id: 'tp-2', tenantId: TENANT, storeId: null, name: 'Amul Taaza Milk 500ml', ean: '8901020100012', scans: 1640 },
  { id: 'tp-3', tenantId: TENANT, storeId: null, name: 'Maggi Noodles 70g', ean: '8901058000917', scans: 1510 },
  { id: 'tp-4', tenantId: TENANT, storeId: null, name: 'Tata Salt 1kg', ean: '8901030865278', scans: 1380 },
  { id: 'tp-5', tenantId: TENANT, storeId: null, name: 'Fortune Sunflower Oil 1L', ean: '8906000000123', scans: 1255 },
  { id: 'tp-6', tenantId: TENANT, storeId: S1, name: 'Britannia Good Day 150g', ean: '8901063011237', scans: 980 },
  { id: 'tp-7', tenantId: TENANT, storeId: S2, name: 'Lays Magic Masala 52g', ean: '8901491100533', scans: 870 },
];

// Category breakdown (primary/list: ≥1)
const categoryBreakdown: Array<Scoped & { id: string; category: string; share: number }> = [
  { id: 'cb-1', tenantId: TENANT, storeId: null, category: 'Biscuits & Snacks', share: 28 },
  { id: 'cb-2', tenantId: TENANT, storeId: null, category: 'Dairy & Eggs', share: 22 },
  { id: 'cb-3', tenantId: TENANT, storeId: null, category: 'Staples & Grains', share: 19 },
  { id: 'cb-4', tenantId: TENANT, storeId: null, category: 'Beverages', share: 16 },
  { id: 'cb-5', tenantId: TENANT, storeId: null, category: 'Personal Care', share: 15 },
];

// Store comparison (primary: ≥1 per store)
const storeComparison: Array<Scoped & { id: string; storeName: string; scans: number; matchRate: number }> = [
  { id: 'sc-s1', tenantId: TENANT, storeId: S1, storeName: 'RADHA Mart — Satellite', scans: 19840, matchRate: 94 },
  { id: 'sc-s2', tenantId: TENANT, storeId: S2, storeName: 'RADHA Mart — Maninagar', scans: 14370, matchRate: 92 },
];

export const buildAnalyticsDataset: DemoDatasetBuilder = (scope: StoreScope): DemoDataset => ({
  regions: {
    kpis: filterByScope(kpis, scope),
    scanTrends: filterByScope(scanTrends, scope),
    topProducts: filterByScope(topProducts, scope),
    categoryBreakdown: filterByScope(categoryBreakdown, scope),
    storeComparison: filterByScope(storeComparison, scope),
  },
});
