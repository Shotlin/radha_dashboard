'use client';
/**
 * features/analytics/components/leads-table.tsx
 * DataTable: name, email, status chip, source, created (mono). Row click → detail panel.
 */
import { cn } from '@/lib/utils';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import type { Lead, LeadStatus } from '../analytics.schema';

/* ── Lead status chip ─────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<
  LeadStatus,
  { bg: string; border: string; text: string; label: string }
> = {
  new: {
    bg: 'bg-[color:rgb(15_118_110_/_0.08)]',
    border: 'border-[color:rgb(15_118_110_/_0.35)]',
    text: 'text-teal',
    label: 'New',
  },
  contacted: {
    bg: 'bg-[color:rgb(180_83_9_/_0.08)]',
    border: 'border-[color:rgb(180_83_9_/_0.35)]',
    text: 'text-warn',
    label: 'Contacted',
  },
  qualified: {
    bg: 'bg-[color:rgb(109_91_208_/_0.08)]',
    border: 'border-[color:rgb(109_91_208_/_0.35)]',
    text: 'text-[#6d5bd0]',
    label: 'Qualified',
  },
  converted: {
    bg: 'bg-[color:rgb(21_128_61_/_0.08)]',
    border: 'border-[color:rgb(21_128_61_/_0.35)]',
    text: 'text-success',
    label: 'Converted',
  },
  lost: {
    bg: 'bg-[color:rgb(185_28_28_/_0.08)]',
    border: 'border-[color:rgb(185_28_28_/_0.35)]',
    text: 'text-danger',
    label: 'Lost',
  },
};

function LeadStatusChip({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  return (
    <span
      role="status"
      aria-label={cfg.label}
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium border',
        cfg.bg,
        cfg.border,
        cfg.text,
      )}
    >
      {cfg.label}
    </span>
  );
}

/* ── Leads Table ─────────────────────────────────────────────────────────── */
interface LeadsTableProps {
  leads: Lead[];
  isLoading?: boolean;
  isError?: boolean;
  onRowClick?: (lead: Lead) => void;
  hasNextPage?: boolean;
  onNextPage?: () => void;
  hasPrevPage?: boolean;
  onPrevPage?: () => void;
}

export function LeadsTable({
  leads,
  isLoading,
  isError,
  onRowClick,
  hasNextPage,
  onNextPage,
  hasPrevPage,
  onPrevPage,
}: LeadsTableProps) {
  const columns: ColumnDef<Lead>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => <span className="font-semibold text-ink">{row.name}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => (
        <span className="text-ink-soft text-[13px] font-mono tabular-nums">{row.email}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <LeadStatusChip status={row.status} />,
    },
    {
      key: 'source',
      header: 'Source',
      render: (row) => (
        <span className="text-ink-soft text-[13px]">{row.source ?? '—'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      mono: true,
      render: (row) => (
        <span className="font-mono tabular-nums text-[13px] text-ink-soft">
          {new Date(row.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  const state = isLoading ? 'loading' : isError ? 'error' : leads.length === 0 ? 'empty' : 'default';

  return (
    <div
      className={cn(onRowClick && '[&_tbody_tr]:cursor-pointer')}
      onClick={
        onRowClick
          ? (e) => {
              const tr = (e.target as HTMLElement).closest('tr[data-row]');
              if (tr) {
                const idx = Number(tr.getAttribute('data-row'));
                if (!isNaN(idx) && leads[idx]) onRowClick(leads[idx]);
              }
            }
          : undefined
      }
    >
      <DataTable
        columns={columns}
        data={leads}
        rowKey={(row) => row.id}
        state={state}
        emptyMessage="No leads in this range."
        hasNextPage={hasNextPage}
        onNextPage={onNextPage}
        hasPrevPage={hasPrevPage}
        onPrevPage={onPrevPage}
      />
    </div>
  );
}
