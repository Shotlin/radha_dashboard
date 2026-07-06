'use client';
/**
 * features/tasks/components/task-table.tsx
 * DataTable alternative view for tasks.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ArrowRight } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { StatusChip } from '@/components/ui/status-chip';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { qk } from '@/lib/api/query-keys';
import { cn } from '@/lib/utils';
import { useTasksList } from '../tasks.queries';
import type { TaskFilters } from '../tasks.schema';
import type { Task } from '@/lib/api/schemas/common';
import type { StatusChipVariant } from '@/components/ui/status-chip';

function statusVariant(status: Task['status']): StatusChipVariant {
  if (status === 'completed') return 'matched';
  if (status === 'cancelled') return 'expired';
  if (status === 'in_progress') return 'expiring';
  return 'pending';
}

function statusLabel(status: Task['status']): string {
  const labels: Record<Task['status'], string> = {
    pending: 'Pending',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status];
}

async function deleteTaskFn(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete task');
}

interface TaskTableProps {
  storeId: string | null;
  filters?: TaskFilters;
  onTaskSelect?: (task: Task) => void;
  className?: string;
}

export function TaskTable({ storeId, filters, onTaskSelect, className }: TaskTableProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const { data, isLoading, isError } = useTasksList(storeId, filters);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTaskFn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.tasks(storeId ?? '') });
      setDeleteTarget(null);
    },
  });

  const columns: ColumnDef<Task>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <span className="text-ink font-medium text-[14px] line-clamp-1">{row.title}</span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => (
        <span className="capitalize text-[13px] text-ink-soft">{row.priority ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <StatusChip variant={statusVariant(row.status)} label={statusLabel(row.status)} />
      ),
    },
    {
      key: 'dueAt',
      header: 'Due date',
      mono: true,
      sortable: true,
      render: (row) =>
        row.dueAt ? (
          <span className="font-mono tabular-nums text-[13px] text-ink">
            {new Date(row.dueAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ) : (
          <span className="text-ink-soft">—</span>
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
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[80px]',
      render: (row) => (
        <div className="flex items-center gap-1">
          {onTaskSelect && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 text-ink-soft hover:text-accent"
              onClick={() => onTaskSelect(row)}
              aria-label={`View task ${row.title}`}
              title="View details"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 text-ink-soft hover:text-danger"
            onClick={() => setDeleteTarget(row)}
            aria-label={`Delete task ${row.title}`}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const tableState = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : data?.items.length === 0
        ? 'empty'
        : 'default';

  return (
    <div className={cn(className)}>
      <DataTable<Task>
        columns={columns}
        data={data?.items ?? []}
        rowKey={(row) => row.id}
        state={tableState}
        emptyMessage="No tasks match your filters."
      />

      <Modal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete task?"
        description={
          deleteTarget
            ? `Permanently delete "${deleteTarget.title}"? This cannot be undone.`
            : undefined
        }
        destructive
        primaryAction={{
          label: 'Delete',
          onClick: () => {
            if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
          },
          loading: deleteMutation.isPending,
        }}
        cancelLabel="Cancel"
      />
    </div>
  );
}
