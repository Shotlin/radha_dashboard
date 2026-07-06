'use client';
/**
 * features/grn/components/grn-table.tsx
 * DataTable of GRNs with status workflow chips and row navigation.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Clock,
  XCircle,
  Layers,
  FileText,
} from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { cn } from '@/lib/utils';
import { useGrnList, type Grn, type GrnStatus } from '../grn.queries';

/* ── Status chip ─────────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<
  GrnStatus,
  { label: string; icon: React.ElementType; cls: string; bg: string; border: string }
> = {
  draft: {
    label: 'Draft',
    icon: FileText,
    cls: 'text-ink-soft',
    bg: 'bg-surface-sunken',
    border: 'border-hairline',
  },
  received: {
    label: 'Received',
    icon: CheckCircle,
    cls: 'text-success',
    bg: 'bg-[color:rgb(21_128_61_/_0.08)]',
    border: 'border-[color:rgb(21_128_61_/_0.35)]',
  },
  partial: {
    label: 'Partial',
    icon: Layers,
    cls: 'text-warn',
    bg: 'bg-[color:rgb(180_83_9_/_0.08)]',
    border: 'border-[color:rgb(180_83_9_/_0.35)]',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    cls: 'text-danger',
    bg: 'bg-[color:rgb(185_28_28_/_0.08)]',
    border: 'border-[color:rgb(185_28_28_/_0.35)]',
  },
};

function GrnStatusChip({ status }: { status: GrnStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['draft'];
  const Icon = cfg.icon;
  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-semibold border',
        cfg.bg,
        cfg.border,
        cfg.cls,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

interface GrnTableProps {
  storeId: string | null;
  filters?: {
    status?: string;
    supplierId?: string;
    from?: string;
    to?: string;
  };
}

export function GrnTable({ storeId, filters }: GrnTableProps) {
  const router = useRouter();
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [prevCursors, setPrevCursors] = useState<string[]>([]);

  const { data, isLoading, isError } = useGrnList(storeId, {
    ...filters,
    cursor,
  });

  const columns: ColumnDef<Grn>[] = [
    {
      key: 'createdAt',
      header: 'Date',
      mono: true,
      sortable: true,
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
    },
    {
      key: 'invoiceNo',
      header: 'Invoice #',
      mono: true,
      render: (row) => row.invoiceNo ?? <span className="text-ink-soft">—</span>,
    },
    {
      key: 'supplierName',
      header: 'Supplier',
      render: (row) =>
        row.supplierName ?? <span className="text-ink-soft">No supplier</span>,
    },
    {
      key: 'itemCount',
      header: 'Items',
      mono: true,
      render: (row) => row.itemCount ?? 0,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <GrnStatusChip status={row.status} />,
    },
    {
      key: 'receivedAt',
      header: 'Received',
      mono: true,
      render: (row) =>
        row.receivedAt
          ? new Date(row.receivedAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : <span className="text-ink-soft">—</span>,
    },
  ];

  const tableState = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : data?.items.length === 0
        ? 'empty'
        : 'default';

  const handleNext = () => {
    if (data?.nextCursor) {
      setPrevCursors((p) => [...p, cursor ?? '']);
      setCursor(data.nextCursor ?? undefined);
    }
  };

  const handlePrev = () => {
    const prev = prevCursors[prevCursors.length - 1];
    setPrevCursors((p) => p.slice(0, -1));
    setCursor(prev === '' ? undefined : prev);
  };

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      rowKey={(row) => row.id}
      state={tableState}
      emptyMessage="No GRN records found. Create one to get started."
      hasPrevPage={prevCursors.length > 0}
      onPrevPage={handlePrev}
      hasNextPage={!!data?.nextCursor}
      onNextPage={handleNext}
      className="[&_tbody_tr]:cursor-pointer"
    />
  );
}
