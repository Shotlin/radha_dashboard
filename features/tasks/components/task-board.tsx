'use client';
/**
 * features/tasks/components/task-board.tsx
 * Kanban board: 3 columns (To-do / In-progress / Done).
 * Cards show status chip, assignee, due date.
 * Transition buttons with optimistic updates.
 */
import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, CheckCheck, XCircle, RotateCcw, Calendar, User } from 'lucide-react';
import { StatusChip } from '@/components/ui/status-chip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/states';
import { EmptyState } from '@/components/ui/states';
import { qk } from '@/lib/api/query-keys';
import { cn } from '@/lib/utils';
import { useTasksList, type TasksListResponse } from '../tasks.queries';
import type { TaskFilters } from '../tasks.schema';
import type { Task } from '@/lib/api/schemas/common';
import type { StatusChipVariant } from '@/components/ui/status-chip';

/* ── helpers ─────────────────────────────────────────────── */
function taskStatusVariant(status: Task['status']): StatusChipVariant {
  if (status === 'completed') return 'matched';
  if (status === 'cancelled') return 'expired';
  if (status === 'in_progress') return 'expiring';
  return 'pending';
}

function priorityBadge(priority: Task['priority']) {
  if (!priority || priority === 'low') return null;
  const map: Record<string, string> = {
    medium: 'bg-accent-tint text-accent-deep',
    high: 'bg-[color:rgb(180_83_9_/_0.1)] text-warn',
    urgent: 'bg-[color:rgb(185_28_28_/_0.1)] text-danger',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
        map[priority] ?? '',
      )}
      aria-label={`Priority: ${priority}`}
    >
      {priority}
    </span>
  );
}

async function transitionTask(id: string, status: string): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Transition failed');
  return res.json() as Promise<Task>;
}

/* ── TaskCard ────────────────────────────────────────────── */
interface TaskCardProps {
  task: Task;
  storeId: string | null;
  onSelect: (task: Task) => void;
}

function TaskCard({ task, storeId, onSelect }: TaskCardProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      transitionTask(id, status),
    // Optimistic update
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: qk.tasks(storeId ?? '') });
      const prev = queryClient.getQueryData<TasksListResponse>(qk.tasks(storeId ?? ''));
      queryClient.setQueryData<TasksListResponse>(qk.tasks(storeId ?? ''), (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((t) =>
            t.id === id ? { ...t, status: status as Task['status'] } : t,
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(qk.tasks(storeId ?? ''), context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.tasks(storeId ?? '') });
    },
  });

  return (
    <div
      className={cn(
        'card p-3 flex flex-col gap-2 cursor-pointer group',
        'hover:shadow-[var(--shadow-card-md)] transition-shadow duration-150',
        'border border-hairline',
      )}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
      onClick={() => onSelect(task)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(task)}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[14px] font-semibold text-ink leading-snug line-clamp-2">
          {task.title}
        </span>
        {priorityBadge(task.priority)}
      </div>

      {/* Status chip */}
      <StatusChip variant={taskStatusVariant(task.status)} />

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[12px] text-ink-soft flex-wrap">
        {task.dueAt && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            <span className="font-mono tabular-nums">
              {new Date(task.dueAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
              })}
            </span>
          </span>
        )}
        {task.assigneeId && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" aria-hidden="true" />
            <span className="truncate max-w-[80px]">{task.assigneeId.slice(0, 8)}</span>
          </span>
        )}
      </div>

      {/* Transition buttons */}
      <div
        className="flex items-center gap-1 mt-1 flex-wrap"
        role="group"
        aria-label="Task actions"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {task.status === 'pending' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-accent hover:bg-accent-tint"
            onClick={() => mutation.mutate({ id: task.id, status: 'in_progress' })}
            disabled={mutation.isPending}
            aria-label="Start task"
          >
            <Play className="h-3 w-3 mr-1" aria-hidden="true" />
            Start
          </Button>
        )}
        {task.status === 'in_progress' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px] text-success hover:bg-[color:rgb(21_128_61_/_0.08)]"
              onClick={() => mutation.mutate({ id: task.id, status: 'completed' })}
              disabled={mutation.isPending}
              aria-label="Complete task"
            >
              <CheckCheck className="h-3 w-3 mr-1" aria-hidden="true" />
              Done
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px] text-ink-soft hover:bg-surface-sunken"
              onClick={() => mutation.mutate({ id: task.id, status: 'pending' })}
              disabled={mutation.isPending}
              aria-label="Reject / send back"
            >
              <RotateCcw className="h-3 w-3 mr-1" aria-hidden="true" />
              Reject
            </Button>
          </>
        )}
        {(task.status === 'pending' || task.status === 'in_progress') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-ink-soft hover:text-danger hover:bg-[color:rgb(185_28_28_/_0.06)]"
            onClick={() => mutation.mutate({ id: task.id, status: 'cancelled' })}
            disabled={mutation.isPending}
            aria-label="Cancel task"
          >
            <XCircle className="h-3 w-3 mr-1" aria-hidden="true" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Column ──────────────────────────────────────────────── */
interface ColumnProps {
  title: string;
  count: number;
  tint: string;
  tasks: Task[];
  isLoading: boolean;
  storeId: string | null;
  onSelect: (task: Task) => void;
}

function KanbanColumn({ title, count, tint, tasks, isLoading, storeId, onSelect }: ColumnProps) {
  return (
    <div className="flex flex-col min-h-[400px]">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', tint)} aria-hidden="true" />
          <span className="text-[14px] font-bold text-ink">{title}</span>
        </div>
        <span className="text-[12px] font-mono tabular-nums text-ink-soft bg-surface-sunken px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>

      {/* Cards */}
      <div
        className="flex flex-col gap-2 flex-1 bg-surface-sunken/50 rounded-lg p-2 border border-hairline"
        role="list"
        aria-label={`${title} tasks`}
      >
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-3 flex flex-col gap-2" aria-hidden="true">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}

        {!isLoading && tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-[13px] text-ink-soft">No tasks here</p>
          </div>
        )}

        {!isLoading &&
          tasks.map((task) => (
            <div key={task.id} role="listitem">
              <TaskCard task={task} storeId={storeId} onSelect={onSelect} />
            </div>
          ))}
      </div>
    </div>
  );
}

/* ── TaskBoard ───────────────────────────────────────────── */
interface TaskBoardProps {
  storeId: string | null;
  filters?: TaskFilters;
  onTaskSelect: (task: Task) => void;
  className?: string;
}

export function TaskBoard({ storeId, filters, onTaskSelect, className }: TaskBoardProps) {
  const { data, isLoading, isError } = useTasksList(storeId, filters);

  const { todo, inProgress, done } = useMemo(() => {
    const items = data?.items ?? [];
    return {
      todo: items.filter((t) => t.status === 'pending'),
      inProgress: items.filter((t) => t.status === 'in_progress'),
      done: items.filter((t) => t.status === 'completed'),
    };
  }, [data]);

  if (isError) {
    return (
      <EmptyState
        title="Failed to load tasks"
        description="Could not load your task board. Please try again."
        className={className}
      />
    );
  }

  return (
    <div
      className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}
      aria-label="Task board"
    >
      <KanbanColumn
        title="To-do"
        count={todo.length}
        tint="bg-ink-soft"
        tasks={todo}
        isLoading={isLoading}
        storeId={storeId}
        onSelect={onTaskSelect}
      />
      <KanbanColumn
        title="In progress"
        count={inProgress.length}
        tint="bg-accent"
        tasks={inProgress}
        isLoading={isLoading}
        storeId={storeId}
        onSelect={onTaskSelect}
      />
      <KanbanColumn
        title="Done"
        count={done.length}
        tint="bg-success"
        tasks={done}
        isLoading={isLoading}
        storeId={storeId}
        onSelect={onTaskSelect}
      />
    </div>
  );
}
