'use client';
/**
 * features/admin/components/impersonation-audit.tsx
 * DataTable of impersonation audit records with filters.
 */
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/states';
import { useImpersonationAudit } from '../admin.queries';
import type { ImpersonationAuditRecord } from '../admin.schema';
import { UserCheck } from 'lucide-react';

const COLUMNS: ColumnDef<ImpersonationAuditRecord>[] = [
  {
    key: 'actorName',
    header: 'Admin',
    render: (row) => (
      <span className="font-medium text-[var(--ink)]">{row.actorName ?? row.actorId}</span>
    ),
  },
  {
    key: 'targetName',
    header: 'Target User',
    render: (row) => (
      <span className="font-mono text-[13px] text-[var(--ink)]">
        {row.targetName ?? row.targetId}
      </span>
    ),
  },
  {
    key: 'reason',
    header: 'Reason',
    render: (row) => (
      <span className="text-[13px] text-[var(--ink-soft)] line-clamp-2">{row.reason}</span>
    ),
  },
  {
    key: 'startedAt',
    header: 'Started At',
    mono: true,
    render: (row) => {
      const d = new Date(row.startedAt);
      return (
        <span className="font-mono tabular-nums text-[13px]">
          {d.toLocaleDateString('en-IN')} {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
      );
    },
  },
  {
    key: 'endedAt',
    header: 'Ended At',
    mono: true,
    render: (row) => {
      if (!row.endedAt) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[color:rgb(180_83_9_/_0.10)] text-[var(--warn)]">
            Active
          </span>
        );
      }
      const d = new Date(row.endedAt);
      return (
        <span className="font-mono tabular-nums text-[13px]">
          {d.toLocaleDateString('en-IN')} {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
      );
    },
  },
  {
    key: 'durationMs',
    header: 'Duration',
    mono: true,
    render: (row) => {
      if (!row.durationMs) return <span className="text-[var(--ink-soft)]">—</span>;
      const seconds = Math.round(row.durationMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return (
        <span className="font-mono text-[13px]">
          {minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`}
        </span>
      );
    },
  },
];

export function ImpersonationAuditTable() {
  const { data, isLoading, isError } = useImpersonationAudit({ limit: 50 });
  const items = data?.items ?? [];

  if (isError) {
    return (
      <EmptyState
        title="Could not load audit log"
        description="Audit records are unavailable. This may require a backend implementation."
        icon={UserCheck}
      />
    );
  }

  return (
    <DataTable
      columns={COLUMNS}
      data={items}
      rowKey={(row) => row.id}
      state={isLoading ? 'loading' : items.length === 0 ? 'empty' : 'default'}
      emptyMessage="No impersonation sessions recorded yet."
    />
  );
}
