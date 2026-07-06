'use client';
/**
 * features/reports/components/artefacts-table.tsx
 * DataTable: file name, format, size (mono), created (mono), Download + Re-export actions.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, RefreshCw, Trash2 } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Eyebrow } from '@/components/ui/eyebrow';
import { ErrorState } from '@/components/ui/states';
import { qk } from '@/lib/api/query-keys';
import { cn } from '@/lib/utils';
import { reExportReport, deleteReport } from '../reports.actions';
import type { ReportJob, ReportArtefact } from '../reports.schema';
import { useStoreScope } from '@/lib/hooks/use-store-scope';

const FORMAT_BADGE: Record<string, string> = {
  xlsx: 'bg-[color:rgb(21_128_61_/_0.08)] border-[color:rgb(21_128_61_/_0.3)] text-success',
  pdf: 'bg-[color:rgb(185_28_28_/_0.08)] border-[color:rgb(185_28_28_/_0.3)] text-danger',
  csv: 'bg-[color:rgb(15_118_110_/_0.08)] border-[color:rgb(15_118_110_/_0.3)] text-[color:#0F766E]',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ArtefactsTableProps {
  jobs: ReportJob[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onReExport: (jobId: string) => void;
}

export function ArtefactsTable({
  jobs,
  isLoading,
  isError,
  onRetry,
  onReExport,
}: ArtefactsTableProps) {
  const { storeId } = useStoreScope();
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<ReportJob | null>(null);

  const deleteMutation = useMutation({
    mutationFn: () => deleteReport(deleteTarget?.id ?? ''),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.reportJobs(storeId ?? '') });
      setDeleteTarget(null);
    },
  });

  const columns: ColumnDef<ReportJob>[] = [
    {
      key: 'type',
      header: 'Report',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-ink">
          {row.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      ),
    },
    {
      key: 'format',
      header: 'Format',
      render: (row) => {
        const fmt = row.format ?? 'xlsx';
        return (
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold border uppercase',
              FORMAT_BADGE[fmt] ?? FORMAT_BADGE.xlsx,
            )}
          >
            {fmt}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      mono: true,
      sortable: true,
      render: (row) => (
        <span className="font-mono tabular-nums text-[13px] text-ink-soft">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'completedAt',
      header: 'Completed',
      mono: true,
      render: (row) => (
        <span className="font-mono tabular-nums text-[13px] text-ink-soft">
          {row.completedAt ? new Date(row.completedAt).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const statusCfg = {
          done: 'bg-[color:rgb(21_128_61_/_0.08)] border-[color:rgb(21_128_61_/_0.3)] text-success',
          failed: 'bg-[color:rgb(185_28_28_/_0.08)] border-[color:rgb(185_28_28_/_0.3)] text-danger',
          queued: 'bg-surface-sunken border-hairline text-ink-soft',
          processing: 'bg-accent-tint border-[color:rgb(234_88_12_/_0.3)] text-accent',
        } as const;
        return (
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium border capitalize',
              statusCfg[row.status] ?? statusCfg.queued,
            )}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          {row.status === 'done' && row.downloadUrl && (
            <a href={row.downloadUrl} target="_blank" rel="noopener noreferrer" download>
              <Button variant="ghost" size="sm" aria-label="Download report">
                <Download className="h-4 w-4" aria-hidden="true" />
              </Button>
            </a>
          )}
          {row.status === 'done' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReExport(row.id)}
              aria-label="Re-export this report"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          <button
            onClick={() => setDeleteTarget(row)}
            aria-label="Delete report"
            className="p-1.5 rounded-lg text-ink-soft hover:text-danger hover:bg-[color:rgb(185_28_28_/_0.08)] transition-colors"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  const tableState =
    isLoading ? 'loading'
    : isError ? 'error'
    : jobs.length === 0 ? 'empty'
    : 'default';

  return (
    <>
      <div className="flex flex-col gap-3">
        <Eyebrow>GENERATED REPORTS</Eyebrow>
        <DataTable
          columns={columns}
          data={jobs}
          rowKey={(r) => r.id}
          state={tableState}
          emptyMessage="No reports generated yet. Use the builder above to create your first report."
        />
        {isError && (
          <ErrorState title="Failed to load reports" onRetry={onRetry} />
        )}
      </div>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title={`Delete report?`}
        description="This will permanently remove the report and its generated files."
        destructive
        primaryAction={{
          label: 'Delete',
          onClick: () => deleteMutation.mutate(),
          loading: deleteMutation.isPending,
        }}
      />
    </>
  );
}
