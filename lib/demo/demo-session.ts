/**
 * lib/demo/demo-session.ts — Demo mode session helpers.
 *
 * When DEMO_MODE=true the dashboard works fully without the backend.
 * A demo session cookie is set with mock data for all 5 roles.
 * This is strictly for exploration/testing — never enabled in production.
 *
 * Server-only: this module holds demo credentials and is consumed solely by
 * server-side API route handlers (login/me/scan/product-image). The
 * `import 'server-only'` guard keeps it out of any client bundle (R2.7).
 */
import 'server-only';

// Demo mode (mock login + mock data) is force-disabled in production builds, so
// a misconfigured env can never enable it — even if DEMO_MODE=true leaks into a
// production deploy. Available only in development/test.
export const DEMO_MODE =
  process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';
export const DEMO_SECRET = process.env.DEMO_SECRET ?? 'radha-demo-2025';

export const DEMO_USERS = [
  {
    email: 'admin@radha.demo',
    password: 'demo1234',
    role: 'admin',
    name: 'Admin User',
    id: 'demo-admin-001',
    tenantId: 'demo-tenant-001',
    storeIds: ['demo-store-001', 'demo-store-002'],
    permissions: [
      'expiry:view', 'expiry:create', 'expiry:edit',
      'tasks:view', 'tasks:create', 'tasks:assign', 'tasks:complete',
      'inventory:view', 'inventory:edit',
      'grn:view', 'grn:create', 'grn:approve',
      'suppliers:view', 'suppliers:manage',
      'audit:view', 'audit:manage',
      'reports:view', 'reports:export',
      'analytics:view',
      'billing:view', 'billing:manage',
      'notifications:view', 'notifications:manage',
      'admin:impersonate', 'admin:feature_flags', 'admin:webhooks',
      'settings:view', 'settings:edit',
      'leads:view', 'leads:manage',
    ],
  },
  {
    email: 'owner@radha.demo',
    password: 'demo1234',
    role: 'owner',
    name: 'Store Owner',
    id: 'demo-owner-001',
    tenantId: 'demo-tenant-001',
    storeIds: ['demo-store-001', 'demo-store-002'],
    permissions: [
      'expiry:view', 'expiry:create', 'expiry:edit',
      'tasks:view', 'tasks:create', 'tasks:assign', 'tasks:complete',
      'inventory:view', 'inventory:edit',
      'grn:view', 'grn:create', 'grn:approve',
      'suppliers:view', 'suppliers:manage',
      'audit:view', 'audit:manage',
      'reports:view', 'reports:export',
      'analytics:view',
      'billing:view', 'billing:manage',
      'notifications:view',
      'settings:view', 'settings:edit',
      'leads:view', 'leads:manage',
    ],
  },
  {
    email: 'manager@radha.demo',
    password: 'demo1234',
    role: 'manager',
    name: 'Store Manager',
    id: 'demo-manager-001',
    tenantId: 'demo-tenant-001',
    storeIds: ['demo-store-001'],
    permissions: [
      'expiry:view', 'expiry:create', 'expiry:edit',
      'tasks:view', 'tasks:create', 'tasks:assign', 'tasks:complete',
      'inventory:view', 'inventory:edit',
      'grn:view', 'grn:create',
      'suppliers:view',
      'audit:view',
      'reports:view',
      'notifications:view',
      'settings:view',
    ],
  },
  {
    email: 'staff@radha.demo',
    password: 'demo1234',
    role: 'staff',
    name: 'Staff Member',
    id: 'demo-staff-001',
    tenantId: 'demo-tenant-001',
    storeIds: ['demo-store-001'],
    permissions: [
      'expiry:view', 'expiry:create',
      'tasks:view', 'tasks:complete',
      'inventory:view',
      'notifications:view',
    ],
  },
  {
    email: 'auditor@radha.demo',
    password: 'demo1234',
    role: 'auditor',
    name: 'Auditor',
    id: 'demo-auditor-001',
    tenantId: 'demo-tenant-001',
    storeIds: ['demo-store-001'],
    permissions: [
      'audit:view', 'audit:manage',
      'reports:view',
      'notifications:view',
    ],
  },
] as const;

export type DemoUser = typeof DEMO_USERS[number];

export function findDemoUser(email: string, password: string): DemoUser | null {
  const found = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  return found ?? null;
}

/** Build a demo session payload (mirrors the real SessionPayload shape). */
export function buildDemoSession(user: DemoUser) {
  return {
    accessToken: `demo-access-${user.id}`,
    refreshToken: `demo-refresh-${user.id}`,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      storeIds: [...user.storeIds],
      permissions: [...user.permissions],
    },
    _demo: true,
  };
}
