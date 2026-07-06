import 'server-only';

/**
 * lib/demo/data/admin.ts — Admin Feature_Area demo dataset.
 *
 * Server-only (R2.7). Records tagged with `tenantId`/`storeId` (R1.4); coverage
 * minimum ≥1 primary / ≥5 list under any scope (R1.1). Admin data is tenant-level
 * (cross-store), so most records use `storeId: null`; a couple of per-store audit
 * entries demonstrate store filtering.
 */

import { filterByScope } from '@/lib/demo/scope';
import type { DemoDataset, DemoDatasetBuilder } from '@/lib/demo';
import type { Scoped, StoreScope } from '@/lib/api/core/scope-types';

const TENANT = 'demo-tenant-001';
const S1 = 'demo-store-001';
const S2 = 'demo-store-002';

// Tenants (list: ≥5) — visible to the admin rollup
const tenants: Array<Scoped & { id: string; name: string; plan: string; stores: number; status: string }> = [
  { id: 'tn-1', tenantId: TENANT, storeId: null, name: 'RADHA Mart (Demo)', plan: 'Pro', stores: 2, status: 'active' },
  { id: 'tn-2', tenantId: TENANT, storeId: null, name: 'Shree Provision (Demo)', plan: 'Growth', stores: 1, status: 'trial' },
  { id: 'tn-3', tenantId: TENANT, storeId: null, name: 'Krishna Super (Demo)', plan: 'Starter', stores: 1, status: 'active' },
  { id: 'tn-4', tenantId: TENANT, storeId: null, name: 'Ambe Stores (Demo)', plan: 'Trial', stores: 3, status: 'trial' },
  { id: 'tn-5', tenantId: TENANT, storeId: null, name: 'Patel Kirana (Demo)', plan: 'Growth', stores: 1, status: 'suspended' },
];

// Feature flags (list: ≥5)
const flags: Array<Scoped & { id: string; key: string; enabled: boolean; rollout: number }> = [
  { id: 'fl-1', tenantId: TENANT, storeId: null, key: 'ai_ingredient_explainer', enabled: true, rollout: 100 },
  { id: 'fl-2', tenantId: TENANT, storeId: null, key: 'weekly_digest_email', enabled: true, rollout: 100 },
  { id: 'fl-3', tenantId: TENANT, storeId: null, key: 'voice_search', enabled: false, rollout: 0 },
  { id: 'fl-4', tenantId: TENANT, storeId: null, key: 'verified_badge', enabled: true, rollout: 50 },
  { id: 'fl-5', tenantId: TENANT, storeId: null, key: 'recall_alerts', enabled: true, rollout: 75 },
  { id: 'fl-6', tenantId: TENANT, storeId: null, key: 'family_sharing', enabled: false, rollout: 10 },
];

// Webhooks (list: ≥5)
const webhooks: Array<Scoped & { id: string; url: string; event: string; status: string; lastDelivery: string }> = [
  { id: 'wh-1', tenantId: TENANT, storeId: null, url: 'https://hooks.radha.demo/grn', event: 'grn.approved', status: 'active', lastDelivery: '2025-06-06T09:10:00Z' },
  { id: 'wh-2', tenantId: TENANT, storeId: null, url: 'https://hooks.radha.demo/expiry', event: 'expiry.flagged', status: 'active', lastDelivery: '2025-06-06T08:10:00Z' },
  { id: 'wh-3', tenantId: TENANT, storeId: null, url: 'https://hooks.radha.demo/billing', event: 'subscription.renewed', status: 'active', lastDelivery: '2025-06-01T06:00:00Z' },
  { id: 'wh-4', tenantId: TENANT, storeId: null, url: 'https://hooks.radha.demo/audit', event: 'audit.completed', status: 'paused', lastDelivery: '2025-06-05T07:30:00Z' },
  { id: 'wh-5', tenantId: TENANT, storeId: null, url: 'https://hooks.radha.demo/inventory', event: 'inventory.low_stock', status: 'active', lastDelivery: '2025-06-06T09:01:00Z' },
];

// Audit logs (list: ≥5)
const auditLogs: Array<Scoped & { id: string; actor: string; action: string; entity: string; at: string }> = [
  { id: 'lg-1', tenantId: TENANT, storeId: null, actor: 'admin@radha.demo', action: 'feature_flag.update', entity: 'verified_badge', at: '2025-06-06T07:00:00Z' },
  { id: 'lg-2', tenantId: TENANT, storeId: null, actor: 'owner@radha.demo', action: 'subscription.upgrade', entity: 'plan:Pro', at: '2025-06-01T06:00:00Z' },
  { id: 'lg-3', tenantId: TENANT, storeId: null, actor: 'admin@radha.demo', action: 'webhook.pause', entity: 'audit.completed', at: '2025-06-05T07:35:00Z' },
  { id: 'lg-4', tenantId: TENANT, storeId: null, actor: 'manager@radha.demo', action: 'grn.approve', entity: 'GRN-2040', at: '2025-06-05T10:00:00Z' },
  { id: 'lg-5', tenantId: TENANT, storeId: S1, actor: 'staff@radha.demo', action: 'expiry.create', entity: 'batch:PG-5510', at: '2025-06-06T10:05:00Z' },
  { id: 'lg-6', tenantId: TENANT, storeId: S2, actor: 'manager@radha.demo', action: 'task.assign', entity: 'task:cold-chain', at: '2025-06-06T10:30:00Z' },
];

// Impersonation sessions (primary/list: ≥1)
const impersonation: Array<Scoped & { id: string; admin: string; targetUser: string; startedAt: string; reason: string }> = [
  { id: 'im-1', tenantId: TENANT, storeId: null, admin: 'admin@radha.demo', targetUser: 'manager@radha.demo', startedAt: '2025-06-04T12:00:00Z', reason: 'Support: GRN approval issue' },
  { id: 'im-2', tenantId: TENANT, storeId: null, admin: 'admin@radha.demo', targetUser: 'staff@radha.demo', startedAt: '2025-06-02T15:30:00Z', reason: 'Support: expiry entry training' },
];

export const buildAdminDataset: DemoDatasetBuilder = (scope: StoreScope): DemoDataset => ({
  regions: {
    tenants: filterByScope(tenants, scope),
    flags: filterByScope(flags, scope),
    webhooks: filterByScope(webhooks, scope),
    auditLogs: filterByScope(auditLogs, scope),
    impersonation: filterByScope(impersonation, scope),
  },
});
