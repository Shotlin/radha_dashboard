'use client';
/**
 * features/settings/components/team-tab-locked.tsx
 * Team management tab showing a LockedOverlay over a preview layout.
 * The backend /users/* module is a PROPOSED feature (🆕 Doc 1 §8).
 */
import { LockedOverlay } from '@/components/ui/locked-overlay';
import { Users, UserPlus, Mail, Shield } from 'lucide-react';

/* ── Mock preview layout (shown blurred behind the overlay) ─────────────── */
function TeamPreview() {
  const mockRows = [
    { name: 'Ramesh Patel', role: 'Manager', store: 'Main Store', status: 'Active' },
    { name: 'Priya Shah', role: 'Staff', store: 'Main Store', status: 'Active' },
    { name: 'Ankit Joshi', role: 'Auditor', store: 'Warehouse', status: 'Pending' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-[var(--ink-soft)]">3 team members</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--accent)] text-white text-[13px] font-semibold">
            <UserPlus className="h-4 w-4" />
            Invite member
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--hairline)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-[var(--surface-sunken)]">
            <tr>
              {['Name', 'Role', 'Store', 'Status', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-semibold text-[var(--ink-soft)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockRows.map((row) => (
              <tr key={row.name} className="border-t border-[var(--hairline)]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-[var(--accent-tint)] flex items-center justify-center text-[var(--accent-deep)] font-bold text-[11px]">
                      {row.name.charAt(0)}
                    </div>
                    <span className="font-medium text-[var(--ink)]">{row.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-[var(--ink-soft)]">
                    <Shield className="h-3 w-3" />
                    {row.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">{row.store}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      row.status === 'Active'
                        ? 'text-[var(--success)] font-medium'
                        : 'text-[var(--warn)] font-medium'
                    }
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Mail className="h-4 w-4 text-[var(--ink-soft)]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Team tab with locked overlay ────────────────────────────────────────── */
export function TeamTabLocked() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-5 w-5 text-[var(--accent-deep)]" aria-hidden="true" />
        <h2 className="text-[16px] font-bold text-[var(--ink)]">Team Management</h2>
      </div>

      <LockedOverlay
        title="Team management not yet available"
        description="Team & user management requires the backend /users/* module (🆕 proposed). It will be available once the backend endpoints are implemented."
        ctaLabel="View proposed features"
      >
        <TeamPreview />
      </LockedOverlay>
    </div>
  );
}
