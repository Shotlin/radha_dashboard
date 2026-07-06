import 'server-only';

/**
 * lib/demo/data/suppliers.ts — Suppliers Feature_Area demo dataset.
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
  { id: 'sup-kpi-active', tenantId: TENANT, storeId: null, label: 'Active suppliers', value: 24, tone: 'teal' },
  { id: 'sup-kpi-due', tenantId: TENANT, storeId: null, label: 'Deliveries due', value: 5, tone: 'warn' },
  { id: 'sup-kpi-s1', tenantId: TENANT, storeId: S1, label: 'Deliveries due', value: 3, tone: 'warn' },
  { id: 'sup-kpi-s2', tenantId: TENANT, storeId: S2, label: 'Deliveries due', value: 2, tone: 'warn' },
];

// Supplier list (list: ≥5)
const list: Array<Scoped & { id: string; name: string; category: string; phone: string; status: string }> = [
  { id: 'supl-1', tenantId: TENANT, storeId: null, name: 'Shakti Distributors', category: 'Staples & Grains', phone: '+91 98250 11223', status: 'active' },
  { id: 'supl-2', tenantId: TENANT, storeId: null, name: 'Gokul Wholesale', category: 'Snacks & Beverages', phone: '+91 98240 22334', status: 'active' },
  { id: 'supl-3', tenantId: TENANT, storeId: null, name: 'Amul Depot', category: 'Dairy & Eggs', phone: '+91 98230 33445', status: 'active' },
  { id: 'supl-4', tenantId: TENANT, storeId: null, name: 'Parle Agro Hub', category: 'Biscuits & Snacks', phone: '+91 98220 44556', status: 'active' },
  { id: 'supl-5', tenantId: TENANT, storeId: null, name: 'Nestle Regional', category: 'Packaged Foods', phone: '+91 98210 55667', status: 'on_hold' },
  { id: 'supl-6', tenantId: TENANT, storeId: S1, name: 'Satellite Fresh Veg', category: 'Fruits & Vegetables', phone: '+91 99090 66778', status: 'active' },
  { id: 'supl-7', tenantId: TENANT, storeId: S2, name: 'Maninagar Snacks Co', category: 'Snacks', phone: '+91 99080 77889', status: 'active' },
];

// Top suppliers by volume (primary/list: ≥1)
const topSuppliers: Array<Scoped & { id: string; name: string; orders: number; spend: number }> = [
  { id: 'ts-1', tenantId: TENANT, storeId: null, name: 'Shakti Distributors', orders: 42, spend: 412300 },
  { id: 'ts-2', tenantId: TENANT, storeId: null, name: 'Gokul Wholesale', orders: 31, spend: 256800 },
  { id: 'ts-3', tenantId: TENANT, storeId: null, name: 'Amul Depot', orders: 28, spend: 198400 },
  { id: 'ts-4', tenantId: TENANT, storeId: null, name: 'Parle Agro Hub', orders: 22, spend: 142000 },
  { id: 'ts-5', tenantId: TENANT, storeId: null, name: 'Nestle Regional', orders: 18, spend: 121900 },
];

// Contacts (list: ≥5)
const contacts: Array<Scoped & { id: string; supplier: string; contactName: string; email: string }> = [
  { id: 'ct-1', tenantId: TENANT, storeId: null, supplier: 'Shakti Distributors', contactName: 'Jignesh Patel', email: 'jignesh@shaktidist.example' },
  { id: 'ct-2', tenantId: TENANT, storeId: null, supplier: 'Gokul Wholesale', contactName: 'Hiral Shah', email: 'hiral@gokulws.example' },
  { id: 'ct-3', tenantId: TENANT, storeId: null, supplier: 'Amul Depot', contactName: 'Mehul Joshi', email: 'mehul@amuldepot.example' },
  { id: 'ct-4', tenantId: TENANT, storeId: null, supplier: 'Parle Agro Hub', contactName: 'Nidhi Desai', email: 'nidhi@parlehub.example' },
  { id: 'ct-5', tenantId: TENANT, storeId: null, supplier: 'Nestle Regional', contactName: 'Rahul Mehta', email: 'rahul@nestlereg.example' },
  { id: 'ct-6', tenantId: TENANT, storeId: S1, supplier: 'Satellite Fresh Veg', contactName: 'Bhavna Rana', email: 'bhavna@freshveg.example' },
  { id: 'ct-7', tenantId: TENANT, storeId: S2, supplier: 'Maninagar Snacks Co', contactName: 'Kiran Soni', email: 'kiran@mnsnacks.example' },
];

export const buildSuppliersDataset: DemoDatasetBuilder = (scope: StoreScope): DemoDataset => ({
  regions: {
    kpis: filterByScope(kpis, scope),
    list: filterByScope(list, scope),
    topSuppliers: filterByScope(topSuppliers, scope),
    contacts: filterByScope(contacts, scope),
  },
});
