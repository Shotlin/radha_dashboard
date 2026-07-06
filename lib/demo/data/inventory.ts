import 'server-only';

/**
 * lib/demo/data/inventory.ts — Inventory Feature_Area demo dataset.
 *
 * Uses the 100-product catalogue for realistic inventory data.
 * Server-only (R2.7). Tagged with tenantId/storeId (R1.4).
 */

import { filterByScope } from '@/lib/demo/scope';
import type { DemoDataset, DemoDatasetBuilder } from '@/lib/demo';
import type { Scoped, StoreScope } from '@/lib/api/core/scope-types';
import { PRODUCT_CATALOGUE } from '@/lib/demo/product-catalogue';

const TENANT = 'demo-tenant-001';
const S1 = 'demo-store-001';
const S2 = 'demo-store-002';

// ── KPI tiles (primary: ≥1) ──────────────────────────────────────────────────
const kpis: Array<Scoped & { id: string; label: string; value: number; unit: string; tone: string }> = [
  { id: 'inv-kpi-skus',  tenantId: TENANT, storeId: null, label: 'Active SKUs',         value: 2140, unit: '',  tone: 'teal'   },
  { id: 'inv-kpi-low',   tenantId: TENANT, storeId: null, label: 'Low stock items',     value: 12,   unit: '',  tone: 'violet' },
  { id: 'inv-kpi-value', tenantId: TENANT, storeId: null, label: 'Stock value (₹ lakh)',value: 18.4, unit: 'L', tone: 'green'  },
  { id: 'inv-kpi-s1',    tenantId: TENANT, storeId: S1,   label: 'Low stock items',     value: 7,    unit: '',  tone: 'violet' },
  { id: 'inv-kpi-s2',    tenantId: TENANT, storeId: S2,   label: 'Low stock items',     value: 5,    unit: '',  tone: 'violet' },
];

// ── Inventory list: all 100 catalogue products ─────────────────────────────
// Realistic on-hand qty and reorder points per product type
function onHandFor(mrp: number, shelfLife: number): number {
  if (shelfLife <= 7)  return Math.floor(Math.random() * 20 + 10);  // perishable: small stock
  if (shelfLife <= 30) return Math.floor(Math.random() * 40 + 20);
  if (mrp >= 200)      return Math.floor(Math.random() * 30 + 10);  // expensive: keep less
  return Math.floor(Math.random() * 200 + 50);
}

function reorderFor(mrp: number, shelfLife: number): number {
  if (shelfLife <= 7)  return 15;
  if (shelfLife <= 30) return 25;
  if (mrp >= 200)      return 10;
  return 40;
}

// Seed with deterministic values so the data is stable across server renders
const SEED_VALUES: [number, number][] = [
  [320, 100], [140, 80], [210, 60], [180, 90], [95, 50],
  [60, 40],   [45, 50],  [380, 120],[80, 30],  [240, 80],
  [55, 40],   [120, 50], [160, 60], [75, 35],  [95, 40],
  [200, 60],  [140, 50], [85, 30],  [60, 25],  [320, 80],
  [150, 50],  [90, 35],  [110, 40], [180, 60], [95, 40],
  [260, 70],  [85, 30],  [140, 50], [75, 30],  [220, 60],
  [340, 100], [165, 60], [280, 80], [195, 60], [120, 40],
  [75, 25],   [180, 60], [90, 30],  [125, 45], [60, 20],
  [240, 80],  [115, 40], [95, 35],  [160, 50], [85, 30],
  [55, 20],   [135, 45], [110, 40], [145, 50], [60, 20],
  [75, 25],   [85, 30],  [120, 40], [90, 30],  [160, 50],
  [280, 80],  [180, 60], [95, 30],  [65, 20],  [155, 50],
  [340, 100], [170, 60], [290, 90], [195, 65], [130, 45],
  [80, 25],   [185, 60], [95, 30],  [130, 45], [65, 20],
  [250, 80],  [120, 40], [100, 35], [165, 55], [90, 30],
  [60, 20],   [140, 50], [115, 40], [150, 50], [65, 22],
  [80, 28],   [90, 30],  [125, 42], [95, 32],  [170, 55],
  [290, 90],  [185, 62], [98, 32],  [68, 22],  [158, 52],
  [340, 100], [175, 58], [295, 92], [198, 66], [132, 46],
  [82, 26],   [188, 62], [98, 32],  [132, 46], [68, 22],
];

const list: Array<Scoped & {
  id: string;
  name: string;
  brand: string;
  category: string;
  ean: string;
  onHand: number;
  reorder: number;
  uom: string;
  mrp: number;
  imageUrl: string | null;
}> = PRODUCT_CATALOGUE.map((p, i) => {
  const [onHand, reorder] = SEED_VALUES[i] ?? [onHandFor(p.mrp, p.shelfLifeDays), reorderFor(p.mrp, p.shelfLifeDays)];
  return {
    id: `invl-${i + 1}`,
    tenantId: TENANT,
    storeId: null,   // tenant-level → visible in all scopes
    name: p.name,
    brand: p.brand,
    category: p.category,
    ean: p.ean,
    onHand,
    reorder,
    uom: p.weight.match(/ml|L/i) ? 'pcs' : 'pcs',
    mrp: p.mrp,
    imageUrl: p.imageUrl,
  };
});

// Per-store overrides for items with different stock levels
const storeOverrides: typeof list = [
  { id: 'invl-s1-1', tenantId: TENANT, storeId: S1, name: 'Parle-G Gold Biscuits 100g', brand: 'Parle', category: 'Biscuits & Cookies', ean: '8901719101015', onHand: 180, reorder: 60, uom: 'pcs', mrp: 10, imageUrl: PRODUCT_CATALOGUE[0].imageUrl },
  { id: 'invl-s1-2', tenantId: TENANT, storeId: S1, name: 'Amul Taaza Toned Milk 500ml', brand: 'Amul', category: 'Dairy & Eggs', ean: '8901020100012', onHand: 60, reorder: 40, uom: 'pcs', mrp: 28, imageUrl: PRODUCT_CATALOGUE[13].imageUrl },
  { id: 'invl-s2-1', tenantId: TENANT, storeId: S2, name: 'Lay\'s Magic Masala 52g', brand: 'PepsiCo', category: 'Snacks & Chips', ean: '8901491100533', onHand: 45, reorder: 50, uom: 'pcs', mrp: 20, imageUrl: PRODUCT_CATALOGUE[3].imageUrl },
  { id: 'invl-s2-2', tenantId: TENANT, storeId: S2, name: 'Maggi 2-Minute Noodles 70g', brand: 'Nestlé', category: 'Instant Noodles', ean: '8901058000917', onHand: 90, reorder: 45, uom: 'pcs', mrp: 14, imageUrl: PRODUCT_CATALOGUE[8].imageUrl },
];

// ── Low-stock alerts (items where onHand < reorder) ──────────────────────────
const LOW_STOCK_PRODUCTS = [
  { idx: 1,  onHand: 14, reorder: 40 },   // Surf Excel
  { idx: 2,  onHand: 9,  reorder: 30 },   // Red Label Tea  
  { idx: 3,  onHand: 11, reorder: 35 },   // Dettol Soap
  { idx: 4,  onHand: 6,  reorder: 25 },   // Bru Coffee
  { idx: 17, onHand: 8,  reorder: 20 },   // Aashirvaad Atta
  { idx: 40, onHand: 12, reorder: 30 },   // Colgate
  { idx: 51, onHand: 7,  reorder: 25 },   // Dove Bar
  { idx: 60, onHand: 5,  reorder: 20 },   // Pampers
];

const lowStock: Array<Scoped & {
  id: string;
  name: string;
  brand: string;
  ean: string;
  category: string;
  onHand: number;
  reorder: number;
  imageUrl: string | null;
}> = LOW_STOCK_PRODUCTS.map(({ idx, onHand, reorder }, i) => {
  const p = PRODUCT_CATALOGUE[idx] ?? PRODUCT_CATALOGUE[0];
  return {
    id: `ls-${i + 1}`,
    tenantId: TENANT,
    storeId: null,
    name: p.name,
    brand: p.brand,
    ean: p.ean,
    category: p.category,
    onHand,
    reorder,
    imageUrl: p.imageUrl,
  };
});

// Per-store low-stock
const lowStockS1 = [
  { id: 'ls-s1-1', tenantId: TENANT, storeId: S1, name: 'Aashirvaad Whole Wheat Atta 5kg', brand: 'ITC', ean: '8901030865015', category: 'Staples & Grains', onHand: 8, reorder: 20, imageUrl: PRODUCT_CATALOGUE[19].imageUrl },
];
const lowStockS2 = [
  { id: 'ls-s2-1', tenantId: TENANT, storeId: S2, name: 'Lay\'s Magic Masala 52g', brand: 'PepsiCo', ean: '8901491100533', category: 'Snacks & Chips', onHand: 45, reorder: 50, imageUrl: PRODUCT_CATALOGUE[3].imageUrl },
];

// ── Stock movements (list: ≥5) ─────────────────────────────────────────────
const MOVEMENT_PRODUCTS = [
  { idx: 0,  type: 'in',    qty: 240 },
  { idx: 13, type: 'out',   qty: 60  },
  { idx: 2,  type: 'in',    qty: 200 },
  { idx: 8,  type: 'count', qty: 180 },
  { idx: 5,  type: 'out',   qty: 24  },
  { idx: 24, type: 'in',    qty: 120 },
  { idx: 33, type: 'out',   qty: 36  },
  { idx: 42, type: 'in',    qty: 96  },
  { idx: 9,  type: 'out',   qty: 48  },
  { idx: 15, type: 'in',    qty: 144 },
];

const MOVEMENT_TIMES = [
  '2025-06-06T09:10:00Z', '2025-06-06T10:00:00Z', '2025-06-05T11:20:00Z',
  '2025-06-05T08:30:00Z', '2025-06-04T15:45:00Z', '2025-06-06T09:40:00Z',
  '2025-06-06T11:15:00Z', '2025-06-06T12:00:00Z', '2025-06-05T14:30:00Z',
  '2025-06-04T10:00:00Z',
];

const movements: Array<Scoped & { id: string; name: string; ean: string; type: string; qty: number; at: string }> =
  MOVEMENT_PRODUCTS.map(({ idx, type, qty }, i) => {
    const p = PRODUCT_CATALOGUE[idx] ?? PRODUCT_CATALOGUE[0];
    return {
      id: `mv-${i + 1}`,
      tenantId: TENANT,
      storeId: null,
      name: p.name,
      ean: p.ean,
      type,
      qty,
      at: MOVEMENT_TIMES[i] ?? '2025-06-06T09:00:00Z',
    };
  });

const movementsS1 = [
  { id: 'mv-s1-1', tenantId: TENANT, storeId: S1, name: 'Britannia Good Day Cashew 150g', ean: '8901063011237', type: 'in', qty: 96, at: '2025-06-06T09:40:00Z' },
];
const movementsS2 = [
  { id: 'mv-s2-1', tenantId: TENANT, storeId: S2, name: 'Lay\'s Magic Masala 52g', ean: '8901491100533', type: 'out', qty: 30, at: '2025-06-06T12:05:00Z' },
];

export const buildInventoryDataset: DemoDatasetBuilder = (scope: StoreScope): DemoDataset => ({
  regions: {
    kpis:      filterByScope(kpis, scope),
    list:      filterByScope([...list, ...storeOverrides], scope),
    lowStock:  filterByScope([...lowStock, ...lowStockS1, ...lowStockS2], scope),
    movements: filterByScope([...movements, ...movementsS1, ...movementsS2], scope),
  },
});
