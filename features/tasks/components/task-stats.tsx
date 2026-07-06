'use client';
/**
 * features/tasks/components/task-stats.tsx
 * Stats strip: open / in-progress / completed counts using KpiTile.
 */
import { ListTodo, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';
import { KpiTile } from '@/components/ui/kpi-tile';
import { useTaskStats } from '../tasks.queries';
import { cn } from '@/lib/utils';

interface TaskStatsProps {
  storeId: string | null;
  className?: string;
}

export function TaskStats({ storeId, className }: TaskStatsProps) {
  const { data, isLoading, isError } = useTaskStats(storeId);

  const tileState = isLoading ? 'loading' : isError ? 'error' : 'default';

  return (
    <div
      className={cn('grid grid-cols-2 sm:grid-cols-4 gap-4', className)}
      aria-label="Task statistics"
    >
      <KpiTile
        label="Open / Pending"
        value={data.pending}
        icon={ListTodo}
        tint="text-ink"
        tintBg="bg-surface-sunken"
        state={tileState}
      />
      <KpiTile
        label="In progress"
        value={data.in_progress}
        icon={PlayCircle}
        tint="text-accent"
        tintBg="bg-accent-tint"
        state={tileState}
      />
      <KpiTile
        label="Completed"
        value={data.completed}
        icon={CheckCircle2}
        tint="text-success"
        tintBg="bg-[color:rgb(21_128_61_/_0.08)]"
        state={tileState}
      />
      <KpiTile
        label="Cancelled"
        value={data.cancelled}
        icon={XCircle}
        tint="text-ink-soft"
        tintBg="bg-surface-sunken"
        state={tileState}
      />
    </div>
  );
}
