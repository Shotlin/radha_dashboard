'use client';
/**
 * features/expiry/components/expiry-table.tsx
 * DataTable for expiry records. EAN and dates in mono font.
 * Row actions: acknowledge and delete.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Trash2 } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { StatusChip } from '@/components/ui/status-chip';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { qk } from '@/lib/api/query-keys';
import { cn } from '@/lib/utils';
import { useExpiryList } from '../expiry.queries';
import type { ExpiryFilters } from '../expiry.schema';
import type { ExpiryRecord } from '@/lib/api/schemas/common';
import type { StatusChipVariant } from '@/components/ui/status-chip';

/* ── helpers ─────────────────────────────────────────────── */
function statusVariant(status: ExpiryRecord['status']): StatusChipVariant {
  if (status === 'expired') return 'expired';
  if (status === 'expiring_soon') return 'expiring';
  return 'matched'; // fresh → success
}

function statusLabel(status: ExpiryRecord['status']): string {
  if (status === 'expired') return 'Expired';
  if (status === 'expiring_soon') return 'Expiring soon';
  return 'Fresh';
}

async function acknowledgeRecord(id: string): Promise<void> {
  const res = await fetch(`/api/expiry/${id}/acknowledge`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to acknowledge');
}

async function deleteRecord(id: string): Promise<void> {
  const res = await fetch(`/api/expiry/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete');
}

/* ── component ───────────────────────────────────────────── */
interface ExpiryTableProps {
  storeId: string | null;
  filters?: ExpiryFilters;
  className?: string;
}

export function ExpiryTable({ storeId, filters, className }: ExpiryTableProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<ExpiryRecord | null>(null);

  const { data, isLoading, isError } = useExpiryList(storeId, filters);

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => acknowledgeRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.expiry(storeId ?? '') });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.expiry(storeId ?? '') });
      queryClient.invalidateQueries({ queryKey: qk.expiryKpis(storeId ?? '') });
      setDeleteTarget(null);
    },
  });

  const columns: ColumnDef<ExpiryRecord>[] = [
    {
      key: 'ean',
      header: 'EAN',
      mono: true,
      render: (row) => (
        <span className="font-mono tabular-nums text-[13px] text-ink">{row.ean}</span>
      ),
    },
    {
      key: 'productName',
      header: 'Product',
      render: (row) => (
        <span className="text-ink text-[14px]">{row.productName ?? '—'}</span>
      ),
    },
    {
      key: 'batchNo',
      header: 'Batch',
      render: (row) => (
        <span className="font-mono tabular-nums text-[13px] text-ink-soft">
          {row.batchNo ?? '—'}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      mono: true,
      render: (row) => (
        <span className="font-mono tabular-nums text-[14px] text-ink">{row.quantity}</span>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      mono: true,
      sortable: true,
      render: (row) => (
        <span className="font-mono tabular-nums text-[13px] text-ink">{row.expiryDate}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusChip
          variant={statusVariant(row.status)}
          label={statusLabel(row.status)}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[100px]',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-ink-soft hover:text-success"
            onClick={() => acknowledgeMutation.mutate(row.id)}
            disabled={acknowledgeMutation.isPending}
            aria-label={`Acknowledge expiry record for ${row.ean}`}
            title="Acknowledge"
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-ink-soft hover:text-danger"
            onClick={() => setDeleteTarget(row)}
            aria-label={`Delete expiry record for ${row.ean}`}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const tableState = isLoading ? 'loading' : isError ? 'error' : data?.items.length === 0 ? 'empty' : 'default';

  return (
    <div className={cn(className)}>
      <DataTable<ExpiryRecord>
        columns={columns}
        data={data?.items ?? []}
        rowKey={(row) => row.id}
        state={tableState}
        emptyMessage="No expiry records match your filters."
      />

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete expiry record?"
        description={deleteTarget ? `Remove the record for EAN ${deleteTarget.ean}? This cannot be undone.` : undefined}
        destructive
        primaryAction={{
          label: 'Delete',
          onClick: () => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); },
          loading: deleteMutation.isPending,
        }}
        cancelLabel="Cancel"
      />
    </div>
  );
}
