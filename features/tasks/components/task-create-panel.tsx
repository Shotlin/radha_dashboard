'use client';
/**
 * features/tasks/components/task-create-panel.tsx
 * SidePanel: create a blank task or from template. RHF + Zod.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SidePanel } from '@/components/ui/side-panel';
import { FormField, Input } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/states';
import { qk } from '@/lib/api/query-keys';
import { createTaskSchema, type CreateTaskFormValues, taskPriorityValues } from '../tasks.schema';
import { useTaskTemplates } from '../tasks.queries';

async function postTask(data: CreateTaskFormValues & { storeId: string }) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

interface TaskCreatePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
}

export function TaskCreatePanel({ open, onOpenChange, storeId }: TaskCreatePanelProps) {
  const queryClient = useQueryClient();
  const [useTemplate, setUseTemplate] = useState(false);
  const { data: templatesData, isLoading: templatesLoading } = useTaskTemplates(storeId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      assigneeId: '',
      dueAt: '',
      templateId: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateTaskFormValues) => {
      if (!storeId) throw new Error('No store selected');
      return postTask({ ...values, storeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.tasks(storeId ?? '') });
      reset();
      setUseTemplate(false);
      onOpenChange(false);
    },
  });

  const handleClose = (open: boolean) => {
    if (!open) {
      reset();
      setUseTemplate(false);
    }
    onOpenChange(open);
  };

  const onSubmit = (values: CreateTaskFormValues) => mutation.mutate(values);

  const applyTemplate = (templateId: string) => {
    const tpl = templatesData?.templates.find((t) => t.id === templateId);
    if (tpl) {
      setValue('title', tpl.title, { shouldDirty: true });
      setValue('templateId', tpl.id);
    }
  };

  return (
    <SidePanel
      open={open}
      onOpenChange={handleClose}
      title="New task"
      description="Create a blank task or start from a template."
      isDirty={isDirty}
      footer={
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSubmit(onSubmit)}
          loading={mutation.isPending}
          disabled={mutation.isPending}
        >
          Create task
        </Button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" aria-label="Create task form">
        {/* Template toggle */}
        <div className="flex items-center gap-2 p-3 bg-surface-sunken rounded-lg border border-hairline">
          <button
            type="button"
            role="switch"
            aria-checked={useTemplate}
            onClick={() => setUseTemplate((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              useTemplate ? 'bg-accent' : 'bg-hairline'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                useTemplate ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="text-[13px] font-semibold text-ink">Use a template</span>
        </div>

        {/* Template picker */}
        {useTemplate && (
          <FormField label="Template" htmlFor="templateId" error={errors.templateId?.message}>
            {templatesLoading ? (
              <Skeleton className="h-10" />
            ) : (
              <select
                id="templateId"
                className="w-full px-3 py-2.5 rounded-lg text-[14px] text-ink bg-surface border border-hairline focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-40"
                defaultValue=""
                {...register('templateId')}
                onChange={(e) => applyTemplate(e.target.value)}
              >
                <option value="" disabled>
                  Select a template…
                </option>
                {templatesData?.templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            )}
          </FormField>
        )}

        {/* Title */}
        <FormField label="Title" htmlFor="title" required error={errors.title?.message}>
          <Input id="title" type="text" placeholder="e.g. Restock dairy shelf" {...register('title')} />
        </FormField>

        {/* Description */}
        <FormField label="Description" htmlFor="description" error={errors.description?.message}>
          <textarea
            id="description"
            rows={3}
            placeholder="Optional details…"
            className="w-full px-3 py-2.5 rounded-lg text-[14px] text-ink bg-surface border border-hairline placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent resize-none"
            {...register('description')}
          />
        </FormField>

        {/* Priority */}
        <FormField label="Priority" htmlFor="priority" error={errors.priority?.message}>
          <select
            id="priority"
            className="w-full px-3 py-2.5 rounded-lg text-[14px] text-ink bg-surface border border-hairline focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            {...register('priority')}
          >
            {taskPriorityValues.map((p) => (
              <option key={p} value={p} className="capitalize">
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </FormField>

        {/* Due date */}
        <FormField label="Due date" htmlFor="dueAt" error={errors.dueAt?.message}>
          <Input id="dueAt" type="date" mono {...register('dueAt')} />
        </FormField>

        {mutation.isError && (
          <p className="text-[12px] text-danger" role="alert">
            Failed to create task. Please try again.
          </p>
        )}
      </form>
    </SidePanel>
  );
}
