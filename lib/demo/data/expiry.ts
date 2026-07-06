import 'server-only';

/**
 * lib/demo/data/expiry.ts — Expiry Feature_Area demo dataset.
 *
 * Uses real product names from the 100-product catalogue.
 * Server-only (R2.7). Tagged with tenantId/storeId (R1.4).
 */

import { filterByScope } from '@/lib/demo/scope';
import type { DemoDataset, DemoDatasetBuilder } from '@/lib/demo';
import type { Scoped, StoreScope } from '@/lib/api/core/scope-types';
import { PRODUCT_CATALOGUE } from '@/lib/demo/product-catalogue';

const TENANT = 'demo-tenant-001';
const S1 = 'demo-store-001';
const S2 = 'demo-store-002';

// Helper: days from now
function daysFrom(d: number): string {
  const dt = new Date('2025-06-06');
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().split('T')[0];
}

// ── KPI tiles ─────────────────────────────────────────────────────────────────
const kpis: Array<Scoped & { id: string; label: string; value: number; tone: string }> = [
  { id: 'ex-kpi-expired', tenantId: TENANT, storeId: null, label: 'Expired on shelf',     value: 6,  tone: 'danger' },
  { id: 'ex-kpi-week',    tenantId: TENANT, storeId: null, label: 'Expiring in 7 days',   value: 37, tone: 'warn'   },
  { id: 'ex-kpi-month',   tenantId: TENANT, storeId: null, label: 'Expiring in 30 days',  value: 112,tone: 'info'   },
  { id: 'ex-kpi-s1',      tenantId: TENANT, storeId: S1,   label: 'Expiring in 7 days',   value: 21, tone: 'warn'   },
  { id: 'ex-kpi-s2',      tenantId: TENANT, storeId: S2,   label: 'Expiring in 7 days',   value: 16, tone: 'warn'   },
];

// ── Expiry list: 40+ real products ──────────────────────────────────────────
// Find dairy, bakery, and short-shelf products from catalogue
const dairyProducts = PRODUCT_CATALOGUE.filter(p => p.shelfLifeDays <= 7);
const shortShelf = PRODUCT_CATALOGUE.filter(p => p.shelfLifeDays > 7 && p.shelfLifeDays <= 30);
const mediumShelf = PRODUCT_CATALOGUE.filter(p => p.shelfLifeDays > 30 && p.shelfLifeDays <= 180);

interface ExpiryRecord extends Scoped {
  id: string;
  name: string;
  ean: string;
  batch: string;
  expiry: string;
  qty: number;
  status: string;
  imageUrl: string | null;
}

const BATCH_PREFIXES: Record<string, string> = {
  'Dairy & Eggs': 'DRY',
  'Instant Noodles': 'NOD',
  'Biscuits & Cookies': 'BSC',
  'Snacks & Chips': 'SNK',
  'Beverages': 'BEV',
  'Breakfast Cereals': 'BRK',
  'Frozen Foods': 'FRZ',
};
function batchFor(cat: string, n: number): string {
  const pfx = BATCH_PREFIXES[cat] ?? 'PRD';
  return `${pfx}-${String(n).padStart(4, '0')}`;
}

const list: ExpiryRecord[] = [];
let seq = 1;

// Expired items (−1 to −3 days)
[...dairyProducts.slice(0, 3)].forEach((p, i) => {
  list.push({
    id: `exl-${seq++}`,
    tenantId: TENANT,
    storeId: null,
    name: p.name,
    ean: p.ean,
    batch: batchFor(p.category, seq),
    expiry: daysFrom(-1 - i),
    qty: 3 + i,
    status: 'expired',
    imageUrl: p.imageUrl,
  });
});

// Expiring today / tomorrow (critical)
[...dairyProducts.slice(3), ...shortShelf.slice(0, 4)].forEach((p, i) => {
  list.push({
    id: `exl-${seq++}`,
    tenantId: TENANT,
    storeId: null,
    name: p.name,
    ean: p.ean,
    batch: batchFor(p.category, seq),
    expiry: daysFrom(i < 2 ? 0 : 1),
    qty: 5 + i * 2,
    status: 'expiring',
    imageUrl: p.imageUrl,
  });
});

// Expiring in 2–7 days
shortShelf.slice(4).forEach((p, i) => {
  list.push({
    id: `exl-${seq++}`,
    tenantId: TENANT,
    storeId: null,
    name: p.name,
    ean: p.ean,
    batch: batchFor(p.category, seq),
    expiry: daysFrom(2 + (i % 5)),
    qty: 8 + i * 3,
    status: 'expiring',
    imageUrl: p.imageUrl,
  });
});

// Expiring in 8–30 days (medium urgency)
mediumShelf.slice(0, 20).forEach((p, i) => {
  list.push({
    id: `exl-${seq++}`,
    tenantId: TENANT,
    storeId: null,
    name: p.name,
    ean: p.ean,
    batch: batchFor(p.category, seq),
    expiry: daysFrom(8 + (i % 22)),
    qty: 12 + i * 4,
    status: i < 10 ? 'expiring' : 'fresh',
    imageUrl: p.imageUrl,
  });
});

// Store-specific entries
const storeExpiryS1: ExpiryRecord[] = [
  {
    id: 'exl-s1-1', tenantId: TENANT, storeId: S1,
    name: 'Parle-G Gold Biscuits 100g', ean: '8901719101015',
    batch: 'BSC-5510', expiry: daysFrom(14), qty: 40, status: 'fresh',
    imageUrl: PRODUCT_CATALOGUE[0].imageUrl,
  },
  {
    id: 'exl-s1-2', tenantId: TENANT, storeId: S1,
    name: 'Amul Taaza Toned Milk 500ml', ean: '8901020100012',
    batch: 'DRY-2210', expiry: daysFrom(1), qty: 12, status: 'expiring',
    imageUrl: PRODUCT_CATALOGUE[13].imageUrl,
  },
  {
    id: 'exl-s1-3', tenantId: TENANT, storeId: S1,
    name: 'Britannia Good Day Cashew 150g', ean: '8901063011237',
    batch: 'BSC-1180', expiry: daysFrom(60), qty: 48, status: 'fresh',
    imageUrl: PRODUCT_CATALOGUE[1].imageUrl,
  },
];

const storeExpiryS2: ExpiryRecord[] = [
  {
    id: 'exl-s2-1', tenantId: TENANT, storeId: S2,
    name: 'Maggi 2-Minute Noodles 70g', ean: '8901058000917',
    batch: 'NOD-7741', expiry: daysFrom(6), qty: 30, status: 'expiring',
    imageUrl: PRODUCT_CATALOGUE[8].imageUrl,
  },
  {
    id: 'exl-s2-2', tenantId: TENANT, storeId: S2,
    name: 'Nestlé a+ Curd 400g', ean: '8901058820019',
    batch: 'DRY-0931', expiry: daysFrom(-1), qty: 5, status: 'expired',
    imageUrl: PRODUCT_CATALOGUE[16].imageUrl,
  },
];

// ── Calendar density ──────────────────────────────────────────────────────────
const calendar: Array<Scoped & { id: string; date: string; count: number; band: string }> = [
  { id: 'cal-1', tenantId: TENANT, storeId: null, date: daysFrom(0),  count: 5,  band: 'this_week' },
  { id: 'cal-2', tenantId: TENANT, storeId: null, date: daysFrom(1),  count: 8,  band: 'this_week' },
  { id: 'cal-3', tenantId: TENANT, storeId: null, date: daysFrom(2),  count: 12, band: 'this_week' },
  { id: 'cal-4', tenantId: TENANT, storeId: null, date: daysFrom(5),  count: 7,  band: 'this_week' },
  { id: 'cal-5', tenantId: TENANT, storeId: null, date: daysFrom(9),  count: 20, band: 'next_week' },
  { id: 'cal-6', tenantId: TENANT, storeId: null, date: daysFrom(14), count: 35, band: 'next_week' },
  { id: 'cal-7', tenantId: TENANT, storeId: null, date: daysFrom(21), count: 18, band: 'later'     },
  { id: 'cal-8', tenantId: TENANT, storeId: S1,   date: daysFrom(14), count: 40, band: 'later'     },
  { id: 'cal-9', tenantId: TENANT, storeId: S2,   date: daysFrom(6),  count: 30, band: 'this_week' },
];

// ── Category thresholds ───────────────────────────────────────────────────────
const thresholds: Array<Scoped & { id: string; category: string; warnDays: number; urgentDays: number }> = [
  { id: 'th-1', tenantId: TENANT, storeId: null, category: 'Dairy & Eggs',      warnDays: 5,  urgentDays: 2  },
  { id: 'th-2', tenantId: TENANT, storeId: null, category: 'Bakery',             warnDays: 3,  urgentDays: 1  },
  { id: 'th-3', tenantId: TENANT, storeId: null, category: 'Beverages',          warnDays: 14, urgentDays: 5  },
  { id: 'th-4', tenantId: TENANT, storeId: null, category: 'Staples & Grains',   warnDays: 30, urgentDays: 10 },
  { id: 'th-5', tenantId: TENANT, storeId: null, category: 'Snacks & Chips',     warnDays: 10, urgentDays: 3  },
  { id: 'th-6', tenantId: TENANT, storeId: null, category: 'Instant Noodles',    warnDays: 14, urgentDays: 5  },
  { id: 'th-7', tenantId: TENANT, storeId: null, category: 'Frozen Foods',       warnDays: 7,  urgentDays: 3  },
  { id: 'th-8', tenantId: TENANT, storeId: null, category: 'Personal Care',      warnDays: 60, urgentDays: 30 },
  { id: 'th-9', tenantId: TENANT, storeId: null, category: 'Breakfast Cereals',  warnDays: 30, urgentDays: 14 },
];

export const buildExpiryDataset: DemoDatasetBuilder = (scope: StoreScope): DemoDataset => ({
  regions: {
    kpis:       filterByScope(kpis, scope),
    list:       filterByScope([...list, ...storeExpiryS1, ...storeExpiryS2], scope),
    calendar:   filterByScope(calendar, scope),
    thresholds: filterByScope(thresholds, scope),
  },
});
