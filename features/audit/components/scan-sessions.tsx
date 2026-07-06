'use client';
/**
 * features/audit/components/scan-sessions.tsx
 * Tab content: list of scan sessions, session detail panel, batch cancel.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, XCircle, RefreshCw, CheckCircle2, Clock, MinusCircle } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { Eyebrow } from '@/components/ui/eyebrow';
import { qk } from '@/lib/api/query-keys';
import { cn } from '@/lib/utils';
import { useScanSessions } from '../audit.queries';
import { cancelSyncBatch } from '../audit.actions';
import type { ScanSession } from '../audit.schema';
import { useStoreScope } from '@/lib/hooks/use-store-scope';

function sessionStatusChip(status: ScanSession['status']) {
  const map = {
    active: { icon: Clock, text: 'Active', cls: 'text-accent bg-accent-tint border-[color:rgb(234_88_12_/_0.3)]' },
    completed: { icon: CheckCircle2, text: 'Completed', cls: 'text-success bg-[color:rgb(21_128_61_/_0.08)] border-[color:rgb(21_128_61_/_0.3)]' },
    cancelled: { icon: MinusCircle, text: 'Cancelled', cls: 'text-ink-soft bg-surface-sunken border-hairline' },
  } as const;
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-medium border', cfg.cls)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {cfg.text}
    </span>
  );
}

export function ScanSessions() {
  const { storeId } = useStoreScope();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useScanSessions(storeId);
  const [selected, setSelected] = useState<ScanSession | null>(null);
  const [cancelBatchTarget, setCancelBatchTarget] = useState<string | null>(null);

  const cancelBatchMutation = useMutation({
    mutationFn: () => cancelSyncBatch(cancelBatchTarget ?? ''),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.scanSessions(storeId ?? '') });
      setCancelBatchTarget(null);
    },
  });

  const columns: ColumnDef<ScanSession>[] = [
    {
      key: 'startedAt',
      header: 'Started',
      mono: true,
      sortable: true,
      render: (row) => (
        <span className="font-mono tabular-nums text-[13px] text-ink-soft">
          {new Date(row.startedAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'listName',
      header: 'List',
      render: (row) => (
        <span className="text-ink">{row.listName ?? <span className="text-ink-soft italic">No list</span>}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => sessionStatusChip(row.status),
    },
    {
      key: 'scansCount',
      header: 'Scans',
      mono: true,
      render: (row) => (
        <span className="font-mono tabular-nums text-ink">{row.scansCount.toLocaleString()}</span>
      ),
    },
    {
      key: 'matchedCount',
      header: 'Matched',
      mono: true,
      render: (row) => (
        <span className="font-mono tabular-nums text-success">{row.matchedCount.toLocaleString()}</span>
      ),
    },
    {
      key: 'unmatchedCount',
      header: 'Unmatched',
      mono: true,
      render: (row) => (
        <span className={cn('font-mono tabular-nums', row.unmatchedCount > 0 ? 'text-danger' : 'text-ink-soft')}>
          {row.unmatchedCount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => setSelected(row)}
            aria-label={`View session detail`}
            className="p-1.5 rounded-lg text-ink-soft hover:text-accent hover:bg-accent-tint transition-colors"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </button>
          {row.status === 'active' && (
            <button
              onClick={() => setCancelBatchTarget(row.id)}
              aria-label="Cancel sync batch"
              className="p-1.5 rounded-lg text-ink-soft hover:text-danger hover:bg-[color:rgb(185_28_28_/_0.08)] transition-colors"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const tableState =
    isLoading ? 'loading'
    : isError ? 'error'
    : (data?.items.length ?? 0) === 0 ? 'empty'
    : 'default';

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Eyebrow>SCAN SESSIONS</Eyebrow>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            aria-label="Refresh scan sessions"
          >
            <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
            Refresh
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          rowKey={(r) => r.id}
          state={tableState}
          emptyMessage="No scan sessions found for this store."
        />

        {isError && (
          <ErrorState
            title="Failed to load scan sessions"
            onRetry={() => void refetch()}
          />
        )}

        {tableState === 'empty' && !isLoading && !isError && (
          <EmptyState
            title="No scan sessions yet"
            description="Scan sessions are created on the mobile app when staff perform EAN audits."
            icon={Eye}
          />
        )}
      </div>

      {/* ── Session detail panel ───────────────────────────────── */}
      <Modal
        open={!!selected}
        onOpenChange={(o) => { if (!o) setSelected(null); }}
        title="Scan Session Detail"
        cancelLabel="Close"
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Status', value: sessionStatusChip(selected.status) },
                { label: 'List', value: selected.listName ?? '—' },
                {
                  label: 'Started',
                  value: (
                    <span className="font-mono tabular-nums text-[13px]">
                      {new Date(selected.startedAt).toLocaleString()}
                    </span>
                  ),
                },
                {
                  label: 'Completed',
                  value: selected.completedAt ? (
                    <span className="font-mono tabular-nums text-[13px]">
                      {new Date(selected.completedAt).toLocaleString()}
                    </span>
                  ) : '—',
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide">
                    {label}
                  </span>
                  <div className="text-[14px] text-ink">{value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-lg bg-surface-sunken">
              {[
                { label: 'Total Scans', value: selected.scansCount, cls: 'text-ink' },
                { label: 'Matched', value: selected.matchedCount, cls: 'text-success' },
                { label: 'Unmatched', value: selected.unmatchedCount, cls: selected.unmatchedCount > 0 ? 'text-danger' : 'text-ink-soft' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className={cn('text-[20px] font-bold font-mono tabular-nums', cls)}>
                    {value.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-ink-soft">{label}</span>
                </div>
              ))}
            </div>

            {selected.scansCount > 0 && (
              <div>
                <div className="flex items-center justify-between text-[12px] text-ink-soft mb-1">
                  <span>Match rate</span>
                  <span className="font-mono tabular-nums">
                    {((selected.matchedCount / selected.scansCount) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-[width] duration-700"
                    style={{ width: `${(selected.matchedCount / selected.scansCount) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {selected.status === 'active' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => { setCancelBatchTarget(selected.id); setSelected(null); }}
                className="self-start"
              >
                <XCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                Cancel sync batch
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* ── Cancel batch confirm ───────────────────────────────── */}
      <Modal
        open={!!cancelBatchTarget}
        onOpenChange={(o) => { if (!o) setCancelBatchTarget(null); }}
        title="Cancel sync batch?"
        description="This will stop the current sync batch. Scans already recorded will be kept."
        destructive
        primaryAction={{
          label: 'Cancel batch',
          onClick: () => cancelBatchMutation.mutate(),
          loading: cancelBatchMutation.isPending,
        }}
      />
    </>
  );
}
