/**
 * lib/api/query-keys.ts — TanStack Query key factories per domain.
 *
 * Centralised keys enable predictable cache invalidation:
 *   after receiving a GRN → invalidate inventory + dashboard kpis
 *   after completing a task → invalidate tasks + dashboard kpis
 *
 * STORE-SCOPE INVARIANT (R8.7/R8.8): every store-scoped Feature_Area key MUST
 * include the active `storeId` so that a Store_Scope change produces a new key.
 * TanStack Query then treats it as fresh data → it refetches the new scope and
 * shows a loading state (no cached previous-scope data is reused because no
 * scope-sensitive query opts into `placeholderData`/`keepPreviousData`), while
 * the previous scope's in-flight request is abandoned via the forwarded
 * `AbortSignal` in each hook's `queryFn`. Tenant-level areas (suppliers,
 * billing, analytics, notifications, settings, admin) are keyed by
 * tenant/global identifiers instead and do not take `storeId`.
 */

export const qk = {
  // Auth / session
  me: () => ['me'] as const,

  // Dashboard
  kpis: (storeId?: string) => ['dashboard', 'kpis', storeId] as const,
  homeCards: (storeId?: string) => ['dashboard', 'home-cards', storeId] as const,
  alerts: (storeId: string) => ['dashboard', 'alerts', storeId] as const,
  healthScore: (storeId: string) => ['dashboard', 'health-score', storeId] as const,
  activity: (storeId: string, cursor?: string) => ['dashboard', 'activity', storeId, cursor] as const,
  multiStore: () => ['dashboard', 'multi-store'] as const,
  quickStats: (storeId: string, from: string, to: string) => ['dashboard', 'quick-stats', storeId, from, to] as const,

  // Stores
  stores: () => ['stores'] as const,
  store: (id: string) => ['stores', id] as const,

  // Expiry
  expiry: (storeId: string, filters?: object) => ['expiry', storeId, filters] as const,
  expiryRecord: (id: string) => ['expiry', 'record', id] as const,
  expiryCalendar: (storeId: string, month: string) => ['expiry', 'calendar', storeId, month] as const,
  expiryKpis: (storeId: string) => ['expiry', 'kpis', storeId] as const,
  expiryThresholds: (storeId: string) => ['expiry', 'thresholds', storeId] as const,

  // Tasks
  tasks: (storeId: string, filters?: object) => ['tasks', storeId, filters] as const,
  task: (id: string) => ['tasks', 'detail', id] as const,
  taskTemplates: (storeId: string) => ['tasks', 'templates', storeId] as const,

  // Inventory
  inventory: (storeId: string, filters?: object) => ['inventory', storeId, filters] as const,
  inventoryItem: (id: string) => ['inventory', 'item', id] as const,
  lowStock: (storeId: string) => ['inventory', 'low-stock', storeId] as const,
  inventoryKpis: (storeId: string) => ['inventory', 'kpis', storeId] as const,
  stockMovements: (storeId: string, cursor?: string) => ['inventory', 'movements', storeId, cursor] as const,

  // GRN
  grns: (storeId: string, filters?: object) => ['grn', storeId, filters] as const,
  grn: (id: string) => ['grn', 'detail', id] as const,
  grnItems: (grnId: string) => ['grn', 'items', grnId] as const,
  grnKpis: (storeId: string) => ['grn', 'kpis', storeId] as const,

  // Suppliers
  suppliers: (filters?: object) => ['suppliers', filters] as const,
  supplier: (id: string) => ['suppliers', id] as const,
  supplierPerformance: (id: string) => ['suppliers', 'performance', id] as const,

  // EAN / Audit
  eanLists: (storeId: string) => ['ean-lists', storeId] as const,
  eanList: (id: string) => ['ean-lists', id] as const,
  eanItems: (listId: string) => ['ean-lists', 'items', listId] as const,
  scanSessions: (storeId: string) => ['scan-sessions', storeId] as const,
  scanSession: (id: string) => ['scan-sessions', id] as const,
  eanAuditKpis: (storeId: string) => ['ean-lists', 'kpis', storeId] as const,

  // Reports
  reportJobs: (storeId: string) => ['reports', storeId] as const,
  reportJob: (id: string) => ['reports', 'job', id] as const,

  // Analytics
  websiteStats: (from: string, to: string) => ['analytics', 'website', from, to] as const,
  tenantActivity: (tenantId: string, from: string, to: string) => ['analytics', 'tenant', tenantId, from, to] as const,
  leads: (params?: object) => ['analytics', 'leads', params] as const,

  // Subscriptions / billing
  subscription: (tenantId: string) => ['subscriptions', tenantId] as const,
  plans: () => ['subscriptions', 'plans'] as const,
  usage: (tenantId: string) => ['subscriptions', 'usage', tenantId] as const,

  // Notifications
  notifications: (params?: object) => ['notifications', params] as const,
  notificationPrefs: () => ['notifications', 'preferences'] as const,

  // Admin
  featureFlags: (tenantId?: string) => ['feature-flags', tenantId] as const,
  webhooks: (tenantId: string) => ['admin', 'webhooks', tenantId] as const,
  webhookDeliveries: (webhookId: string) => ['admin', 'webhooks', webhookId, 'deliveries'] as const,

  // Products
  product: (id: string) => ['products', id] as const,
  productByEan: (ean: string) => ['products', 'ean', ean] as const,

  // Recall
  recallAlerts: (params?: object) => ['recall', params] as const,
} as const;
