/**
 * features/tasks/tasks.schema.ts — Zod schemas for the Tasks module.
 * Mirrors TaskSchema from lib/api/schemas/common.ts.
 */
import { z } from 'zod';

/* ── Task status ─────────────────────────────────────────── */
export const taskStatusValues = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
export type TaskStatus = (typeof taskStatusValues)[number];

/* ── Task priority ───────────────────────────────────────── */
export const taskPriorityValues = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = (typeof taskPriorityValues)[number];

/* ── Task transition actions ─────────────────────────────── */
export const taskTransitionValues = ['start', 'complete', 'reject', 'cancel'] as const;
export type TaskTransition = (typeof taskTransitionValues)[number];

/** Maps a transition action to the resulting status */
export const transitionResultStatus: Record<TaskTransition, TaskStatus> = {
  start: 'in_progress',
  complete: 'completed',
  reject: 'pending',
  cancel: 'cancelled',
};

/* ── Filters ─────────────────────────────────────────────── */
export const taskFiltersSchema = z.object({
  status: z.enum(taskStatusValues).optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(taskPriorityValues).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
});
export type TaskFilters = z.infer<typeof taskFiltersSchema>;

/* ── Create task ─────────────────────────────────────────── */
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  priority: z.enum(taskPriorityValues).optional(),
  assigneeId: z.string().optional(),
  dueAt: z.string().optional(),
  templateId: z.string().optional(),
});
export type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

/* ── Update task ─────────────────────────────────────────── */
export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
  assigneeId: z.string().optional(),
  dueAt: z.string().optional(),
});
export type UpdateTaskFormValues = z.infer<typeof updateTaskSchema>;

/* ── Task stats (derived from list) ─────────────────────── */
export const taskStatsSchema = z.object({
  pending: z.number(),
  in_progress: z.number(),
  completed: z.number(),
  cancelled: z.number(),
});
export type TaskStats = z.infer<typeof taskStatsSchema>;
