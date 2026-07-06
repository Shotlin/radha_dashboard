/**
 * app/(dash)/admin/tenants/page.tsx — Phase 18 gated shell
 * Platform-admin tenants list: all tenants, plan, status, usage.
 * Admin/owner role only. Requires: GET /api/v1/admin/tenants (🆕 proposed)
 *
 * Note: the existing /tenants/:id endpoint serves individual tenant detail for
 * Tenant Admin role. This page is for the RADHA platform admin to see ALL tenants.
 */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/page-header';
import { NeedsBackend } from '@/components/system/needs-backend';
import { Search, Filter, Building2, CreditCard, Users, TrendingUp } from 'lucide-react';

export const metadata: Metadata = { title: 'Platform Tenants' };

/* ── Layout preview ──────────────────────────────────────────────────────── */
function TenantsPreview() {
  const mockTenants = [
    { name: 'Patel Grocery', plan: 'Pro', stores: 3, users: 8, status: 'Active', joined: 'Jan 2024' },
    { name: 'Shah Supermart', plan: 'Starter', stores: 1, users: 2, status: 'Trial', joined: 'Feb 2024' },
    { name: 'Krishna Stores', plan: 'Enterprise', stores: 7, users: 20, status: 'Active', joined: 'Nov 2023' },
    { name: 'Mehta Foods', plan: 'Pro', stores: 2, users: 5, status: 'Active', joined: 'Mar 2024' },
    { name: 'Joshi Provisions', plan: 'Starter', stores: 1, users: 1, status: 'Past due', joined: 'Apr 2024' },
  ];

  const planColors: Record<string, string> = {
    Enterprise: 'bg-[color:rgb(180_83_9_/_0.1)] text-[var(--cat-amber)]',
    Pro: 'bg-[color:rgb(109_91_208_/_0.1)] text-[var(--cat-violet)]',
    Starter: 'bg-[color:rgb(21_128_61_/_0.1)] text-[var(--success)]',
  };

  const statusColors: Record<string, string> = {
    Active: 'text-[var(--success)]',
    Trial: 'text-[var(--accent)]',
    'Past due': 'text-[var(--danger)]',
  };

  return (
    <div className="flex flex-col gap-4">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total tenants', value: '5', icon: Building2 },
          { label: 'Active', value: '3', icon: TrendingUp },
          { label: 'On trial', value: '1', icon: CreditCard },
          { label: 'Total users', value: '36', icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[var(--ink-soft)]">
              <Icon className="h-4 w-4" />
              <span className="text-[12px]">{label}</span>
            </div>
            <p className="text-[24px] font-bold font-mono text-[var(--ink)]">{value}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface-raised)] flex-1">
          <Search className="h-4 w-4 text-[var(--ink-soft)]" />
          <span className="text-[13px] text-[var(--ink-soft)]">Search tenants…</span>
        </div>
        <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--hairline)] text-[13px] font-medium text-[var(--ink-soft)]">
          <Filter className="h-4 w-4" />
          Filter by plan
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--hairline)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-[var(--surface-sunken)]">
            <tr>
              {['Organisation', 'Plan', 'Stores', 'Users', 'Status', 'Joined'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-[var(--ink-soft)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockTenants.map((t) => (
              <tr key={t.name} className="border-t border-[var(--hairline)]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-md bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent-deep)] font-bold text-[11px]">
                      {t.name.charAt(0)}
                    </div>
                    <span className="font-medium text-[var(--ink)]">{t.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${planColors[t.plan] ?? ''}`}>
                    {t.plan}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[var(--ink)]">{t.stores}</td>
                <td className="px-4 py-3 font-mono text-[var(--ink)]">{t.users}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${statusColors[t.status] ?? 'text-[var(--ink-soft)]'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">{t.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function PlatformTenantsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const isAdmin = session.user.role === 'admin' || session.user.role === 'owner';
  if (!isAdmin) redirect('/');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="PLATFORM ADMIN"
        title="All Tenants"
        subtitle="Platform-level view of all registered organisations, plans, and usage."
      />

      <NeedsBackend
        route="GET /api/v1/admin/tenants"
        description="Platform admin endpoint to list all tenants with plan, store count, user count, and subscription status. Requires platform-admin role on the backend."
      >
        <TenantsPreview />
      </NeedsBackend>
    </div>
  );
}
