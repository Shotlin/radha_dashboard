import 'server-only';

/**
 * lib/demo/data/billing.ts — Billing / Subscription Feature_Area demo dataset.
 *
 * Server-only (R2.7). Records tagged with `tenantId`/`storeId` (R1.4); coverage
 * minimum ≥1 primary / ≥5 list under any scope (R1.1). Plans reflect the RADHA
 * ₹49 / ₹99 / ₹199 tiers.
 */

import { filterByScope } from '@/lib/demo/scope';
import type { DemoDataset, DemoDatasetBuilder } from '@/lib/demo';
import type { Scoped, StoreScope } from '@/lib/api/core/scope-types';

const TENANT = 'demo-tenant-001';
const S1 = 'demo-store-001';
const S2 = 'demo-store-002';

// Plans (list: ≥5) — tenant-level so they show under any scope
const plans: Array<Scoped & { id: string; name: string; pricePerMonth: number; currency: string; features: string[] }> = [
  { id: 'pl-trial', tenantId: TENANT, storeId: null, name: 'Trial', pricePerMonth: 0, currency: 'INR', features: ['3-month full access', 'All feature areas'] },
  { id: 'pl-49', tenantId: TENANT, storeId: null, name: 'Starter', pricePerMonth: 49, currency: 'INR', features: ['Expiry tracking', 'Scanning', '1 store'] },
  { id: 'pl-99', tenantId: TENANT, storeId: null, name: 'Growth', pricePerMonth: 99, currency: 'INR', features: ['Everything in Starter', 'Tasks & GRN', 'Up to 3 stores'] },
  { id: 'pl-199', tenantId: TENANT, storeId: null, name: 'Pro', pricePerMonth: 199, currency: 'INR', features: ['Everything in Growth', 'Reports & OHS', 'Unlimited stores'] },
  { id: 'pl-addon', tenantId: TENANT, storeId: null, name: 'Extra Store Add-on', pricePerMonth: 29, currency: 'INR', features: ['+1 store seat'] },
];

// Current subscription (primary: ≥1)
const subscription: Array<Scoped & { id: string; plan: string; status: string; renewsOn: string; amount: number }> = [
  { id: 'sub-roll', tenantId: TENANT, storeId: null, plan: 'Pro', status: 'active', renewsOn: '2025-07-01', amount: 199 },
  { id: 'sub-s1', tenantId: TENANT, storeId: S1, plan: 'Pro', status: 'active', renewsOn: '2025-07-01', amount: 199 },
  { id: 'sub-s2', tenantId: TENANT, storeId: S2, plan: 'Growth', status: 'active', renewsOn: '2025-07-01', amount: 99 },
];

// Usage meters (primary/list: ≥1)
const usage: Array<Scoped & { id: string; metric: string; used: number; limit: number }> = [
  { id: 'us-1', tenantId: TENANT, storeId: null, metric: 'Scans this month', used: 34210, limit: 100000 },
  { id: 'us-2', tenantId: TENANT, storeId: null, metric: 'Active stores', used: 2, limit: 999 },
  { id: 'us-3', tenantId: TENANT, storeId: null, metric: 'EAN list rows', used: 7330, limit: 50000 },
  { id: 'us-4', tenantId: TENANT, storeId: null, metric: 'Report exports', used: 42, limit: 500 },
  { id: 'us-5', tenantId: TENANT, storeId: null, metric: 'Team members', used: 5, limit: 25 },
];

// Invoices (list: ≥5)
const invoices: Array<Scoped & { id: string; invoiceNo: string; date: string; amount: number; status: string }> = [
  { id: 'iv-1', tenantId: TENANT, storeId: null, invoiceNo: 'RZP-2025-0601', date: '2025-06-01', amount: 199, status: 'paid' },
  { id: 'iv-2', tenantId: TENANT, storeId: null, invoiceNo: 'RZP-2025-0501', date: '2025-05-01', amount: 199, status: 'paid' },
  { id: 'iv-3', tenantId: TENANT, storeId: null, invoiceNo: 'RZP-2025-0401', date: '2025-04-01', amount: 199, status: 'paid' },
  { id: 'iv-4', tenantId: TENANT, storeId: null, invoiceNo: 'RZP-2025-0301', date: '2025-03-01', amount: 99, status: 'paid' },
  { id: 'iv-5', tenantId: TENANT, storeId: null, invoiceNo: 'RZP-2025-0201', date: '2025-02-01', amount: 99, status: 'paid' },
  { id: 'iv-6', tenantId: TENANT, storeId: null, invoiceNo: 'RZP-2025-0701', date: '2025-07-01', amount: 199, status: 'upcoming' },
];

export const buildBillingDataset: DemoDatasetBuilder = (scope: StoreScope): DemoDataset => ({
  regions: {
    plans: filterByScope(plans, scope),
    subscription: filterByScope(subscription, scope),
    usage: filterByScope(usage, scope),
    invoices: filterByScope(invoices, scope),
  },
});
