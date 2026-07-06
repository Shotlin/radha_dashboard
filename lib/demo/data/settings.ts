import 'server-only';

/**
 * lib/demo/data/settings.ts — Settings Feature_Area demo dataset.
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

// Tenant/profile (primary: ≥1)
const profile: Array<Scoped & { id: string; businessName: string; ownerName: string; gstin: string; locale: string }> = [
  { id: 'pf-roll', tenantId: TENANT, storeId: null, businessName: 'RADHA Mart (Demo)', ownerName: 'Store Owner', gstin: '24ABCDE1234F1Z5', locale: 'en-IN' },
];

// Store settings (primary: ≥1 per store)
const storeSettings: Array<Scoped & { id: string; storeName: string; address: string; timezone: string; openHours: string }> = [
  { id: 'st-s1', tenantId: TENANT, storeId: S1, storeName: 'RADHA Mart — Satellite', address: 'Satellite Rd, Ahmedabad', timezone: 'Asia/Kolkata', openHours: '08:00–22:00' },
  { id: 'st-s2', tenantId: TENANT, storeId: S2, storeName: 'RADHA Mart — Maninagar', address: 'Maninagar, Ahmedabad', timezone: 'Asia/Kolkata', openHours: '08:00–23:00' },
];

// Team members (list: ≥5)
const members: Array<Scoped & { id: string; name: string; email: string; role: string; status: string }> = [
  { id: 'mb-1', tenantId: TENANT, storeId: null, name: 'Store Owner', email: 'owner@radha.demo', role: 'owner', status: 'active' },
  { id: 'mb-2', tenantId: TENANT, storeId: null, name: 'Admin User', email: 'admin@radha.demo', role: 'admin', status: 'active' },
  { id: 'mb-3', tenantId: TENANT, storeId: null, name: 'Store Manager', email: 'manager@radha.demo', role: 'manager', status: 'active' },
  { id: 'mb-4', tenantId: TENANT, storeId: null, name: 'Staff Member', email: 'staff@radha.demo', role: 'staff', status: 'active' },
  { id: 'mb-5', tenantId: TENANT, storeId: null, name: 'Auditor', email: 'auditor@radha.demo', role: 'auditor', status: 'active' },
  { id: 'mb-6', tenantId: TENANT, storeId: S1, name: 'Ramesh (Satellite)', email: 'ramesh@radha.demo', role: 'staff', status: 'active' },
  { id: 'mb-7', tenantId: TENANT, storeId: S2, name: 'Priya (Maninagar)', email: 'priya@radha.demo', role: 'staff', status: 'invited' },
];

// Integrations (list: ≥5)
const integrations: Array<Scoped & { id: string; name: string; connected: boolean; note: string }> = [
  { id: 'ig-1', tenantId: TENANT, storeId: null, name: 'Open Food Facts', connected: true, note: 'Product images & data' },
  { id: 'ig-2', tenantId: TENANT, storeId: null, name: 'Razorpay', connected: true, note: 'Subscription billing' },
  { id: 'ig-3', tenantId: TENANT, storeId: null, name: 'Firebase Cloud Messaging', connected: true, note: 'Push notifications' },
  { id: 'ig-4', tenantId: TENANT, storeId: null, name: '2Factor.in', connected: true, note: 'OTP delivery' },
  { id: 'ig-5', tenantId: TENANT, storeId: null, name: 'AWS S3', connected: true, note: 'Media & exports storage' },
  { id: 'ig-6', tenantId: TENANT, storeId: null, name: 'WhatsApp Business', connected: false, note: 'Not configured' },
];

export const buildSettingsDataset: DemoDatasetBuilder = (scope: StoreScope): DemoDataset => ({
  regions: {
    profile: filterByScope(profile, scope),
    storeSettings: filterByScope(storeSettings, scope),
    members: filterByScope(members, scope),
    integrations: filterByScope(integrations, scope),
  },
});
