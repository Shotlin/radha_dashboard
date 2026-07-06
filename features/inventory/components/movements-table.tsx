'use client';
/**
 * features/inventory/components/movements-table.tsx
 * DataTable showing stock movements with mono quantities/dates and type chips.
 */
import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, ClipboardList } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { cn } from '@/lib/utils';
import { useStockMovements, type StockMovement } from '../inventory.queries';

const TYPE_CONFIG: Record<
  StockMovement['type'],
  { label: string; icon: React.ElementType; cls: string }
> = {
  in: { label: 'Stock In', icon: ArrowUpCircle, cls: 'text-success' },
  out: { label: 'Stock Out', icon: ArrowDownCircle, cls: 'text-danger' },
  adjustment: { label: 'Adjustment', icon: RefreshCw, cls: 'text-warn' },
  count: { label: 'Count', icon: ClipboardList, cls: 'text-ink-soft' },
};

function TypeChip({ type }: { type: StockMovement['type'] }) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[12px] font-semibold', cfg.cls)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

const COLUMNS: ColumnDef<StockMovement>[] = [
  {
    key: 'createdAt',
    header: 'Date',
    mono: true,
    render: (row) =>
      new Date(row.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
  },
  { key: 'ean', header: 'EAN', mono: true },
  {
    key: 'type',
    header: 'Type',
    render: (row) => <TypeChip type={row.type} />,
  },
  {
    key: 'quantity',
    header: 'Qty',
    mono: true,
    render: (row) => {
      const sign = row.type === 'out' ? '-' : row.type === 'in' ? '+' : '±';
      const cls =
        row.type === 'in'
          ? 'text-success'
          : row.type === 'out'
            ? 'text-danger'
            : 'text-ink-soft';
      return (
        <span className={cn('font-mono tabular-nums font-semibold', cls)}>
          {sign}{Math.abs(row.quantity)}
        </span>
      );
    },
  },
  {
    key: 'reason',
    header: 'Reason',
    render: (row) => (
      <span className="text-ink-soft text-[13px]">{row.reason ?? '—'}</span>
    ),
  },
];

interface MovementsTableProps {
  storeId: string | null;
}

export function MovementsTable({ storeId }: MovementsTableProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [prevCursors, setPrevCursors] = useState<string[]>([]);

  const { data, isLoading, isError } = useStockMovements(storeId, cursor);

  const tableState = isLoading ? 'loading' : isError ? 'error' : (data?.items.length === 0 ? 'empty' : 'default');

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
      columns={COLUMNS}
      data={data?.items ?? []}
      rowKey={(row) => row.id}
      state={tableState}
      emptyMessage="No stock movements recorded yet."
      hasPrevPage={prevCursors.length > 0}
      onPrevPage={handlePrev}
      hasNextPage={!!data?.nextCursor}
      onNextPage={handleNext}
    />
  );
}
