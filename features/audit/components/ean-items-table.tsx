'use client';
/**
 * features/audit/components/ean-items-table.tsx
 * DataTable of EAN items for a selected list (mono EAN display).
 */
import { ArrowLeft } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/states';
import { Eyebrow } from '@/components/ui/eyebrow';
import { useEanItems } from '../audit.queries';
import type { EanItem, EanList } from '../audit.schema';

interface EanItemsTableProps {
  list: EanList;
  onBack: () => void;
}

export function EanItemsTable({ list, onBack }: EanItemsTableProps) {
  const { data, isLoading, isError, refetch } = useEanItems(list.id);

  const columns: ColumnDef<EanItem>[] = [
    {
      key: 'ean',
      header: 'EAN',
      mono: true,
      sortable: true,
      render: (row) => (
        <span className="font-mono tabular-nums text-ink text-[13px] tracking-wide">
          {row.ean}
        </span>
      ),
    },
    {
      key: 'productName',
      header: 'Product Name',
      render: (row) => (
        <span className="text-ink">{row.productName ?? <span className="text-ink-soft italic">—</span>}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Active',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium border ${
            row.isActive
              ? 'bg-[color:rgb(21_128_61_/_0.08)] border-[color:rgb(21_128_61_/_0.35)] text-success'
              : 'bg-surface-sunken border-hairline text-ink-soft'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const tableState =
    isLoading ? 'loading'
    : isError ? 'error'
    : (data?.items.length ?? 0) === 0 ? 'empty'
    : 'default';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} aria-label="Back to EAN lists">
          <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Back
        </Button>
        <div>
          <Eyebrow>EAN ITEMS</Eyebrow>
          <h2 className="text-[18px] font-bold text-ink">{list.name}</h2>
          <p className="text-[13px] text-ink-soft font-mono tabular-nums">
            {list.itemCount.toLocaleString()} items
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        rowKey={(r) => r.id}
        state={tableState}
        emptyMessage="No EAN items in this list yet. Import a CSV to populate it."
      />

      {isError && (
        <ErrorState
          title="Failed to load EAN items"
          onRetry={() => void refetch()}
        />
      )}
    </div>
  );
}
