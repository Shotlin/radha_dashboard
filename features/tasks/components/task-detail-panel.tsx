'use client';
/**
 * features/tasks/components/task-detail-panel.tsx
 * SidePanel: workflow rail buttons (start/complete/reject/cancel),
 * assignee picker, full task details.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, CheckCheck, XCircle, RotateCcw, User, Calendar, Flag } from 'lucide-react';
import { SidePanel } from '@/components/ui/side-panel';
import { StatusChip } from '@/components/ui/status-chip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/states';
import { Eyebrow } from '@/components/ui/eyebrow';
import { qk } from '@/lib/api/query-keys';
import { cn } from '@/lib/utils';
import { useTaskDetail } from '../tasks.queries';
import type { Task } from '@/lib/api/schemas/common';
import type { StatusChipVariant } from '@/components/ui/status-chip';

/* ── helpers ─────────────────────────────────────────────── */
function statusVariant(status: Task['status']): StatusChipVariant {
  if (status === 'completed') return 'matched';
  if (status === 'cancelled') return 'expired';
  if (status === 'in_progress') return 'expiring';
  return 'pending';
}

function statusLabel(status: Task['status']): string {
  const m: Record<Task['status'], string> = {
    pending: 'Pending',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return m[status];
}

async function transition(id: string, status: string): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Transition failed');
  return res.json() as Promise<Task>;
}

/* ── MetaRow ─────────────────────────────────────────────── */
interface MetaRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

function MetaRow({ icon: Icon, label, value }: MetaRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-hairline last:border-0">
      <div className="w-7 h-7 rounded-md flex items-center justify-center bg-surface-sunken flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-ink-soft" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide">{label}</span>
        <span className="text-[14px] text-ink">{value}</span>
      </div>
    </div>
  );
}

/* ── TaskDetailPanel ─────────────────────────────────────── */
interface TaskDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
  storeId: string | null;
}

export function TaskDetailPanel({ open, onOpenChange, taskId, storeId }: TaskDetailPanelProps) {
  const queryClient = useQueryClient();
  const { data: task, isLoading, isError } = useTaskDetail(open ? taskId : null);

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => transition(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.tasks(storeId ?? '') });
      if (taskId) queryClient.invalidateQueries({ queryKey: qk.task(taskId) });
    },
  });

  const handleTransition = (status: string) => {
    if (!task) return;
    mutation.mutate({ id: task.id, status });
  };

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title={task?.title ?? 'Task details'}
      description={task ? `Created ${new Date(task.createdAt).toLocaleDateString('en-IN')}` : undefined}
    >
      {isLoading && (
        <div className="flex flex-col gap-4" aria-busy="true">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center py-12">
          <p className="text-danger text-[13px]">Failed to load task details.</p>
        </div>
      )}

      {task && !isLoading && (
        <div className="flex flex-col gap-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <StatusChip variant={statusVariant(task.status)} label={statusLabel(task.status)} />
            {task.priority && (
              <span className="text-[12px] font-semibold capitalize text-ink-soft bg-surface-sunken px-2 py-0.5 rounded-full">
                {task.priority}
              </span>
            )}
          </div>

          {/* Workflow rail */}
          <section aria-label="Workflow actions">
            <Eyebrow className="mb-2">Workflow</Eyebrow>
            <div
              className="flex flex-wrap gap-2 p-3 bg-surface-sunken rounded-lg border border-hairline"
              role="group"
              aria-label="Task transition buttons"
            >
              {task.status === 'pending' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleTransition('in_progress')}
                  disabled={mutation.isPending}
                  aria-label="Start task"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Start
                </Button>
              )}
              {task.status === 'in_progress' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-success hover:bg-success/90"
                    onClick={() => handleTransition('completed')}
                    disabled={mutation.isPending}
                    aria-label="Complete task"
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                    Complete
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleTransition('pending')}
                    disabled={mutation.isPending}
                    aria-label="Reject task"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                    Reject
                  </Button>
                </>
              )}
              {(task.status === 'pending' || task.status === 'in_progress') && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleTransition('cancelled')}
                  disabled={mutation.isPending}
                  aria-label="Cancel task"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Cancel
                </Button>
              )}
              {(task.status === 'completed' || task.status === 'cancelled') && (
                <p className="text-[13px] text-ink-soft py-1">
                  This task is {task.status === 'completed' ? 'completed' : 'cancelled'} and cannot be transitioned further.
                </p>
              )}
              {mutation.isError && (
                <p className="text-[12px] text-danger w-full mt-1" role="alert">
                  Failed to update task status.
                </p>
              )}
            </div>
          </section>

          {/* Description */}
          {task.description && (
            <section aria-label="Task description">
              <Eyebrow className="mb-2">Description</Eyebrow>
              <p className="text-[14px] text-ink leading-relaxed">{task.description}</p>
            </section>
          )}

          {/* Details */}
          <section aria-label="Task details">
            <Eyebrow className="mb-2">Details</Eyebrow>
            <div className="card divide-y divide-hairline overflow-hidden">
              {task.assigneeId && (
                <MetaRow
                  icon={User}
                  label="Assignee"
                  value={
                    <span className="font-mono tabular-nums text-[13px]">
                      {task.assigneeId}
                    </span>
                  }
                />
              )}
              {task.dueAt && (
                <MetaRow
                  icon={Calendar}
                  label="Due date"
                  value={
                    <span className="font-mono tabular-nums text-[13px]">
                      {new Date(task.dueAt).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  }
                />
              )}
              {task.priority && (
                <MetaRow
                  icon={Flag}
                  label="Priority"
                  value={
                    <span className={cn('capitalize font-semibold', {
                      'text-danger': task.priority === 'urgent',
                      'text-warn': task.priority === 'high',
                      'text-accent': task.priority === 'medium',
                      'text-ink-soft': task.priority === 'low',
                    })}>
                      {task.priority}
                    </span>
                  }
                />
              )}
              <MetaRow
                icon={Calendar}
                label="Created"
                value={
                  <span className="font-mono tabular-nums text-[13px]">
                    {new Date(task.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                }
              />
            </div>
          </section>
        </div>
      )}
    </SidePanel>
  );
}
