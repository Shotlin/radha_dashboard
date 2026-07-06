import 'server-only';

/**
 * lib/demo/data/grn.ts — GRN (Goods Received Note) Feature_Area demo dataset.
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
  { id: 'grn-kpi-pending', tenantId: TENANT, storeId: null, label: 'Pending approval', value: 4, tone: 'warn' },
  { id: 'grn-kpi-month', tenantId: TENANT, storeId: null, label: 'Received this month', value: 38, tone: 'green' },
  { id: 'grn-kpi-s1', tenantId: TENANT, storeId: S1, label: 'Received this month', value: 22, tone: 'green' },
  { id: 'grn-kpi-s2', tenantId: TENANT, storeId: S2, label: 'Received this month', value: 16, tone: 'green' },
];

// GRN list (list: ≥5)
const list: Array<Scoped & { id: string; grnNo: string; supplier: string; invoice: string; amount: number; status: string; receivedAt: string }> = [
  { id: 'grnl-1', tenantId: TENANT, storeId: null, grnNo: 'GRN-2041', supplier: 'Shakti Distributors', invoice: 'INV-88210', amount: 48250, status: 'draft', receivedAt: '2025-06-06' },
  { id: 'grnl-2', tenantId: TENANT, storeId: null, grnNo: 'GRN-2040', supplier: 'Gokul Wholesale', invoice: 'INV-77410', amount: 31200, status: 'received', receivedAt: '2025-06-05' },
  { id: 'grnl-3', tenantId: TENANT, storeId: null, grnNo: 'GRN-2039', supplier: 'Amul Depot', invoice: 'INV-66301', amount: 27800, status: 'received', receivedAt: '2025-06-04' },
  { id: 'grnl-4', tenantId: TENANT, storeId: null, grnNo: 'GRN-2038', supplier: 'Parle Agro Hub', invoice: 'INV-55120', amount: 19400, status: 'partial', receivedAt: '2025-06-03' },
  { id: 'grnl-5', tenantId: TENANT, storeId: null, grnNo: 'GRN-2037', supplier: 'Nestle Regional', invoice: 'INV-44011', amount: 22650, status: 'draft', receivedAt: '2025-06-02' },
  { id: 'grnl-6', tenantId: TENANT, storeId: S1, grnNo: 'GRN-2042', supplier: 'Satellite Fresh Veg', invoice: 'INV-99001', amount: 8400, status: 'received', receivedAt: '2025-06-06' },
  { id: 'grnl-7', tenantId: TENANT, storeId: S2, grnNo: 'GRN-2043', supplier: 'Maninagar Snacks Co', invoice: 'INV-99120', amount: 11200, status: 'draft', receivedAt: '2025-06-06' },
];

// GRN line items (list: ≥5)
const items: Array<Scoped & { id: string; grnNo: string; name: string; ean: string; qty: number; batch: string; expiry: string }> = [
  { id: 'grni-1', tenantId: TENANT, storeId: null, grnNo: 'GRN-2041', name: 'Parle-G Biscuits 100g', ean: '8901719101015', qty: 240, batch: 'PG-5510', expiry: '2025-12-01' },
  { id: 'grni-2', tenantId: TENANT, storeId: null, grnNo: 'GRN-2041', name: 'Maggi Noodles 70g', ean: '8901058000917', qty: 180, batch: 'MG-7741', expiry: '2025-11-15' },
  { id: 'grni-3', tenantId: TENANT, storeId: null, grnNo: 'GRN-2040', name: 'Amul Taaza Milk 500ml', ean: '8901020100012', qty: 120, batch: 'AM-2210', expiry: '2025-06-12' },
  { id: 'grni-4', tenantId: TENANT, storeId: null, grnNo: 'GRN-2039', name: 'Tata Salt 1kg', ean: '8901030865278', qty: 200, batch: 'TS-1190', expiry: '2026-06-01' },
  { id: 'grni-5', tenantId: TENANT, storeId: null, grnNo: 'GRN-2038', name: 'Real Fruit Juice 1L', ean: '8901719500016', qty: 96, batch: 'RJ-2025', expiry: '2025-09-30' },
  { id: 'grni-6', tenantId: TENANT, storeId: S1, grnNo: 'GRN-2042', name: 'Loose Tomatoes (kg)', ean: '0000000000000', qty: 60, batch: 'VEG-0606', expiry: '2025-06-10' },
  { id: 'grni-7', tenantId: TENANT, storeId: S2, grnNo: 'GRN-2043', name: 'Lays Magic Masala 52g', ean: '8901491100533', qty: 150, batch: 'LM-3320', expiry: '2025-10-20' },
];

// Supplier summary (primary/list: ≥1)
const suppliersSummary: Array<Scoped & { id: string; supplier: string; grnCount: number; totalAmount: number }> = [
  { id: 'grns-1', tenantId: TENANT, storeId: null, supplier: 'Shakti Distributors', grnCount: 9, totalAmount: 412300 },
  { id: 'grns-2', tenantId: TENANT, storeId: null, supplier: 'Gokul Wholesale', grnCount: 7, totalAmount: 256800 },
  { id: 'grns-3', tenantId: TENANT, storeId: null, supplier: 'Amul Depot', grnCount: 6, totalAmount: 198400 },
  { id: 'grns-4', tenantId: TENANT, storeId: null, supplier: 'Parle Agro Hub', grnCount: 5, totalAmount: 142000 },
  { id: 'grns-5', tenantId: TENANT, storeId: null, supplier: 'Nestle Regional', grnCount: 4, totalAmount: 121900 },
];

export const buildGrnDataset: DemoDatasetBuilder = (scope: StoreScope): DemoDataset => ({
  regions: {
    kpis: filterByScope(kpis, scope),
    list: filterByScope(list, scope),
    items: filterByScope(items, scope),
    suppliersSummary: filterByScope(suppliersSummary, scope),
  },
});
