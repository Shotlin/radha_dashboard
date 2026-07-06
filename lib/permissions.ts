/**
 * lib/permissions.ts — all permission strings mirroring Doc 1 §5.2 catalog.
 *
 * Client-side can()/hasRole() guards use these constants for display-only gating.
 * The backend is the real enforcement boundary.
 */

export const PERMISSIONS = {
  // Expiry
  EXPIRY_VIEW: 'expiry:view',
  EXPIRY_CREATE: 'expiry:create',
  EXPIRY_EDIT: 'expiry:edit',
  EXPIRY_DELETE: 'expiry:delete',
  EXPIRY_ACKNOWLEDGE: 'expiry:acknowledge',

  // Tasks
  TASKS_VIEW: 'tasks:view',
  TASKS_CREATE: 'tasks:create',
  TASKS_ASSIGN: 'tasks:assign',
  TASKS_COMPLETE: 'tasks:complete',
  TASKS_DELETE: 'tasks:delete',

  // Inventory
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_EDIT: 'inventory:edit',
  INVENTORY_STOCK_OP: 'inventory:stock_op',

  // GRN
  GRN_VIEW: 'grn:view',
  GRN_CREATE: 'grn:create',
  GRN_APPROVE: 'grn:approve',
  GRN_DELETE: 'grn:delete',

  // Suppliers
  SUPPLIERS_VIEW: 'suppliers:view',
  SUPPLIERS_MANAGE: 'suppliers:manage',

  // Audit / EAN
  AUDIT_VIEW: 'audit:view',
  AUDIT_MANAGE: 'audit:manage',
  AUDIT_SCAN: 'audit:scan',

  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',

  // Analytics
  ANALYTICS_VIEW: 'analytics:view',

  // Billing
  BILLING_VIEW: 'billing:view',
  BILLING_MANAGE: 'billing:manage',

  // Notifications
  NOTIFICATIONS_VIEW: 'notifications:view',
  NOTIFICATIONS_MANAGE: 'notifications:manage',

  // Admin
  ADMIN_IMPERSONATE: 'admin:impersonate',
  ADMIN_FEATURE_FLAGS: 'admin:feature_flags',
  ADMIN_WEBHOOKS: 'admin:webhooks',
  ADMIN_BROADCASTS: 'admin:broadcasts',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',

  // Leads
  LEADS_VIEW: 'leads:view',
  LEADS_MANAGE: 'leads:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Role identifiers (mirrors Doc 1 §5.1) */
export type Role = 'owner' | 'admin' | 'manager' | 'staff' | 'auditor';

/** The roles admitted by the admin-route gate (Requirement 7.4). */
export const ADMIN_ROLES = ['owner', 'admin'] as const;

/**
 * Pure admin-route gate predicate (Requirement 7.4 / design Property 19).
 *
 * Returns true if and only if the role is `owner` or `admin`. Accepts any value
 * (including unknown/invalid role strings, `null`, or `undefined`) so the same
 * predicate can guard a freshly-parsed cookie claim; everything that is not an
 * admin role yields `false` and is redirected to `/403` by the callers.
 *
 * This is the single shared decision used by the cosmetic middleware gate
 * (`middleware.ts`) and the authoritative server gates
 * (`app/(dash)/layout.tsx`, `app/(dash)/admin/layout.tsx`).
 */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'owner' || role === 'admin';
}
