'use client';
/**
 * features/suppliers/components/suppliers-table.tsx
 * DataTable of suppliers with search, status chips, row → detail navigation.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { cn } from '@/lib/utils';
import { useSuppliersList, type Supplier } from '../suppliers.queries';

function StatusChip({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-semibold border',
        isActive
          ? 'bg-[color:rgb(21_128_61_/_0.08)] border-[color:rgb(21_128_61_/_0.35)] text-success'
          : 'bg-surface-sunken border-hairline text-ink-soft',
      )}
      role="status"
    >
      {isActive ? (
        <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

const COLUMNS: ColumnDef<Supplier>[] = [
  { key: 'name', header: 'Supplier Name', sortable: true },
  {
    key: 'contactName',
    header: 'Contact',
    render: (row) => row.contactName ?? <span className="text-ink-soft">—</span>,
  },
  {
    key: 'phone',
    header: 'Phone',
    mono: true,
    render: (row) => row.phone ?? <span className="text-ink-soft">—</span>,
  },
  {
    key: 'email',
    header: 'Email',
    render: (row) => row.email ?? <span className="text-ink-soft">—</span>,
  },
  {
    key: 'isActive',
    header: 'Status',
    render: (row) => <StatusChip isActive={row.isActive} />,
  },
  {
    key: 'createdAt',
    header: 'Added',
    mono: true,
    sortable: true,
    render: (row) =>
      new Date(row.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
  },
];

interface SuppliersTableProps {
  filters?: { search?: string; isActive?: boolean };
  onRowClick?: (supplier: Supplier) => void;
}

export function SuppliersTable({ filters, onRowClick }: SuppliersTableProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [prevCursors, setPrevCursors] = useState<string[]>([]);
  const router = useRouter();

  const { data, isLoading, isError } = useSuppliersList({ ...filters, cursor });

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
      columns={COLUMNS}
      data={data?.items ?? []}
      rowKey={(row) => row.id}
      state={tableState}
      emptyMessage="No suppliers found. Add one to get started."
      hasPrevPage={prevCursors.length > 0}
      onPrevPage={handlePrev}
      hasNextPage={!!data?.nextCursor}
      onNextPage={handleNext}
      className="[&_tbody_tr]:cursor-pointer"
    />
  );
}
