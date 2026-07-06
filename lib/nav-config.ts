/**
 * lib/nav-config.ts — navigation tree definition.
 * Roles and permissions are checked client-side (cosmetic) and server-side (real).
 * Keep this data structure; update when new phases add screens.
 */
export type NavGroup = 'operate' | 'grow' | 'admin' | 'settings';

export interface NavItem {
  label: string;
  href: string;
  icon: string; // Lucide icon name
  group: NavGroup;
  /** If set, item requires this permission to be visible */
  permission?: string;
  /** If set, item requires this role */
  role?: string;
  /** If set, show a locked tooltip (feature is visible but gated) */
  locked?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  // ── OPERATE ──────────────────────────────────────────────
  { label: 'Overview', href: '/', icon: 'LayoutDashboard', group: 'operate' },
  { label: 'Expiry', href: '/expiry', icon: 'Clock', group: 'operate', permission: 'expiry:view' },
  { label: 'Tasks', href: '/tasks', icon: 'ClipboardList', group: 'operate', permission: 'tasks:view' },
  { label: 'Inventory', href: '/inventory', icon: 'Package', group: 'operate', permission: 'inventory:view' },
  { label: 'GRN', href: '/grn', icon: 'Truck', group: 'operate', permission: 'grn:view' },
  { label: 'Suppliers', href: '/suppliers', icon: 'Building2', group: 'operate', permission: 'suppliers:view' },
  { label: 'Audit / EAN', href: '/audit', icon: 'ScanBarcode', group: 'operate', permission: 'audit:view' },

  // ── GROW ─────────────────────────────────────────────────
  { label: 'Reports', href: '/reports', icon: 'FileBarChart2', group: 'grow', permission: 'reports:view' },
  { label: 'Analytics', href: '/analytics', icon: 'TrendingUp', group: 'grow', permission: 'analytics:view' },
  { label: 'Leads', href: '/leads', icon: 'Users', group: 'grow', permission: 'leads:view' },
  { label: 'Billing', href: '/billing', icon: 'CreditCard', group: 'grow', permission: 'billing:view' },
  { label: 'Notifications', href: '/notifications', icon: 'Bell', group: 'grow' },
  { label: 'Stores', href: '/stores', icon: 'Store', group: 'grow' },

  // ── ADMIN ─────────────────────────────────────────────────
  { label: 'Admin Console', href: '/admin', icon: 'ShieldCheck', group: 'admin', role: 'admin' },

  // ── SETTINGS ─────────────────────────────────────────────
  { label: 'Settings', href: '/settings', icon: 'Settings', group: 'settings' },
];

export const GROUP_LABELS: Record<NavGroup, string> = {
  operate: 'Operate',
  grow: 'Grow',
  admin: 'Admin',
  settings: 'Settings',
};

export const GROUP_ORDER: NavGroup[] = ['operate', 'grow', 'admin', 'settings'];
