/**
 * app/(dash)/settings/team/page.tsx — Phase 18 gated shell
 * Team management: invite members, manage roles, assign stores.
 * Requires: POST /api/v1/users/invite (🆕 proposed backend module)
 */
import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { NeedsBackend } from '@/components/system/needs-backend';
import { UserPlus, Users, Shield, Store, Mail, MoreHorizontal } from 'lucide-react';

export const metadata: Metadata = { title: 'Team Management' };

/* ── Layout preview (shown blurred) ─────────────────────────────────────── */
function TeamLayoutPreview() {
  const mockMembers = [
    { name: 'Ramesh Patel', email: 'ramesh@example.com', role: 'Manager', store: 'Main Store', status: 'Active' },
    { name: 'Priya Shah', email: 'priya@example.com', role: 'Staff', store: 'Main Store', status: 'Active' },
    { name: 'Ankit Joshi', email: 'ankit@example.com', role: 'Auditor', store: 'Warehouse', status: 'Pending invite' },
    { name: 'Meena Patel', email: 'meena@example.com', role: 'Staff', store: 'Branch B', status: 'Active' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total members', value: '4', icon: Users },
          { label: 'Pending invites', value: '1', icon: Mail },
          { label: 'Stores covered', value: '3', icon: Store },
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

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-[var(--ink)]">Team members</h3>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--accent)] text-white text-[13px] font-semibold"
        >
          <UserPlus className="h-4 w-4" />
          Invite member
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--hairline)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-[var(--surface-sunken)]">
            <tr>
              {['Member', 'Role', 'Store', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-[var(--ink-soft)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockMembers.map((m) => (
              <tr key={m.email} className="border-t border-[var(--hairline)]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent-deep)] font-bold text-[11px]">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--ink)]">{m.name}</p>
                      <p className="text-[11px] text-[var(--ink-soft)]">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-[var(--ink-soft)]">
                    <Shield className="h-3 w-3" />
                    {m.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">{m.store}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      m.status === 'Active'
                        ? 'text-[var(--success)] font-medium'
                        : 'text-[var(--warn)] font-medium'
                    }
                  >
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <MoreHorizontal className="h-4 w-4 text-[var(--ink-soft)]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TeamManagementPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="TEAM"
        title="Team Management"
        subtitle="Invite members, manage roles, and assign stores."
      />

      <NeedsBackend
        route="POST /api/v1/users/invite"
        description="Invite new team members, manage their roles and store assignments. Requires the /users/* backend module."
      >
        <TeamLayoutPreview />
      </NeedsBackend>
    </div>
  );
}
