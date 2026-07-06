/**
 * app/(dash)/admin/audit-logs/page.tsx — Phase 18 gated shell
 * Platform audit log viewer: all state-changing actions with actor, time, resource.
 * Admin role only. Requires: GET /api/v1/admin/audit-logs (🆕 proposed)
 */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/page-header';
import { NeedsBackend } from '@/components/system/needs-backend';
import { Filter, Search, Download, Shield, Clock, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = { title: 'Audit Logs' };

/* ── Layout preview ──────────────────────────────────────────────────────── */
function AuditLogsPreview() {
  const mockLogs = [
    { actor: 'owner@radha.in', action: 'USER_INVITED', resource: 'users/priya@example.com', severity: 'info', time: '2 min ago' },
    { actor: 'admin@radha.in', action: 'PLAN_UPGRADED', resource: 'subscriptions/sub_01', severity: 'info', time: '1 hr ago' },
    { actor: 'manager@radha.in', action: 'GRN_APPROVED', resource: 'grn/grn_123', severity: 'info', time: '3 hr ago' },
    { actor: 'staff@radha.in', action: 'EXPIRY_DELETED', resource: 'expiry/exp_456', severity: 'warn', time: '5 hr ago' },
    { actor: 'admin@radha.in', action: 'IMPERSONATION_START', resource: 'tenants/tenant_789', severity: 'critical', time: '1 day ago' },
  ];

  const severityColors: Record<string, string> = {
    info: 'text-[var(--teal)]',
    warn: 'text-[var(--warn)]',
    critical: 'text-[var(--danger)]',
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface-raised)] flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-[var(--ink-soft)]" />
          <span className="text-[13px] text-[var(--ink-soft)]">Search by actor, action, resource…</span>
        </div>
        <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--hairline)] text-[13px] font-medium text-[var(--ink-soft)]">
          <Filter className="h-4 w-4" />
          Filter
        </button>
        <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--hairline)] text-[13px] font-medium text-[var(--ink-soft)]">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--hairline)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-[var(--surface-sunken)]">
            <tr>
              {['Actor', 'Action', 'Resource', 'Severity', 'Time'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-[var(--ink-soft)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockLogs.map((log, i) => (
              <tr key={i} className="border-t border-[var(--hairline)]">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-[var(--ink-soft)]" />
                    <span className="font-mono text-[12px] text-[var(--ink)]">{log.actor}</span>
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-[var(--accent-deep)]">
                  {log.action}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-[var(--ink-soft)] truncate max-w-[180px]">
                  {log.resource}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${severityColors[log.severity] ?? ''}`}>
                    {log.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-[var(--ink-soft)]">
                    <Clock className="h-3 w-3" />
                    {log.time}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function AuditLogsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const isAdmin = session.user.role === 'admin' || session.user.role === 'owner';
  if (!isAdmin) redirect('/');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="ADMIN"
        title="Audit Logs"
        subtitle="All platform state-changing actions with actor, resource, and timestamp."
      />

      <NeedsBackend
        route="GET /api/v1/admin/audit-logs"
        description="Platform-wide audit trail: every state-changing action, actor, resource, and severity. Filterable and exportable."
      >
        <AuditLogsPreview />
      </NeedsBackend>
    </div>
  );
}
