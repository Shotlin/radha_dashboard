'use client';
/**
 * app/(dash)/tasks/page.tsx — Full Tasks module page.
 * Board/table toggle, stats strip, one orange "New task" CTA.
 */
import { useState } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { FilterBar } from '@/components/ui/filter-bar';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { useStoreScope } from '@/lib/hooks/use-store-scope';
import { TaskStats } from '@/features/tasks/components/task-stats';
import { TaskBoard } from '@/features/tasks/components/task-board';
import { TaskTable } from '@/features/tasks/components/task-table';
import { TaskCreatePanel } from '@/features/tasks/components/task-create-panel';
import { TaskDetailPanel } from '@/features/tasks/components/task-detail-panel';
import type { TaskFilters, TaskStatus } from '@/features/tasks/tasks.schema';
import type { Task } from '@/lib/api/schemas/common';

const STATUS_SEGMENTS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'To-do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Done' },
];

type ViewMode = 'board' | 'table';

export default function TasksPage() {
  const { storeId } = useStoreScope();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [activeStatus, setActiveStatus] = useState('all');

  const filters: TaskFilters = {
    status: activeStatus !== 'all' ? (activeStatus as TaskStatus) : undefined,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page header — one orange CTA only */}
      <PageHeader
        eyebrow="OPERATIONS"
        title="Tasks"
        subtitle="Assign and track store tasks across your team."
        primaryAction={{
          label: 'New task',
          onClick: () => setCreateOpen(true),
          icon: Plus,
        }}
      />

      {/* Stats strip */}
      <section aria-label="Task statistics">
        <Eyebrow className="mb-3">Overview</Eyebrow>
        <TaskStats storeId={storeId} />
      </section>

      {/* Filter bar + view toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <FilterBar
          segments={STATUS_SEGMENTS}
          activeSegment={activeStatus}
          onSegmentChange={setActiveStatus}
          searchPlaceholder="Search tasks…"
          className="flex-1 min-w-0"
        />

        {/* View mode toggle */}
        <div
          className="flex items-center bg-surface-sunken rounded-full p-0.5 border border-hairline"
          role="group"
          aria-label="View mode"
        >
          <Button
            variant="ghost"
            size="sm"
            className={`p-2 rounded-full transition-colors ${
              viewMode === 'board'
                ? 'bg-surface-raised text-accent shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
            onClick={() => setViewMode('board')}
            aria-label="Board view"
            aria-pressed={viewMode === 'board'}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`p-2 rounded-full transition-colors ${
              viewMode === 'table'
                ? 'bg-surface-raised text-accent shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
            onClick={() => setViewMode('table')}
            aria-label="Table view"
            aria-pressed={viewMode === 'table'}
          >
            <List className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Main content: board or table */}
      <section aria-label={viewMode === 'board' ? 'Task board' : 'Task list'}>
        <Eyebrow className="mb-3">
          {viewMode === 'board' ? 'Board' : 'All tasks'}
        </Eyebrow>

        {viewMode === 'board' ? (
          <TaskBoard
            storeId={storeId}
            filters={filters}
            onTaskSelect={(task) => setDetailTask(task)}
          />
        ) : (
          <TaskTable
            storeId={storeId}
            filters={filters}
            onTaskSelect={(task) => setDetailTask(task)}
          />
        )}
      </section>

      {/* Side panels */}
      <TaskCreatePanel
        open={createOpen}
        onOpenChange={setCreateOpen}
        storeId={storeId}
      />
      <TaskDetailPanel
        open={!!detailTask}
        onOpenChange={(open) => {
          if (!open) setDetailTask(null);
        }}
        taskId={detailTask?.id ?? null}
        storeId={storeId}
      />
    </div>
  );
}
