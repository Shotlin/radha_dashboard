'use server';
/**
 * features/tasks/tasks.actions.ts — Server Actions for the tasks module.
 * Calls server-only API clients; results revalidate relevant paths.
 */
import { revalidatePath } from 'next/cache';
import {
  createTask,
  updateTask,
  deleteTask,
  transitionTask,
} from '@/lib/api/clients/tasks';

/* ── createTask ──────────────────────────────────────────── */
export async function createTaskAction(data: {
  storeId: string;
  title: string;
  description?: string;
  priority?: string;
  assigneeId?: string;
  dueAt?: string;
}) {
  const result = await createTask(data);
  revalidatePath('/tasks');
  return result;
}

/* ── updateTask ──────────────────────────────────────────── */
export async function updateTaskAction(
  id: string,
  data: Partial<{
    title: string;
    status: string;
    priority: string;
    assigneeId: string;
    dueAt: string;
  }>,
) {
  const result = await updateTask(id, data);
  revalidatePath('/tasks');
  return result;
}

/* ── deleteTask ──────────────────────────────────────────── */
export async function deleteTaskAction(id: string) {
  const result = await deleteTask(id);
  revalidatePath('/tasks');
  return result;
}

/* ── transitionTask ──────────────────────────────────────── */
export async function transitionTaskAction(id: string, status: string) {
  const result = await transitionTask(id, status);
  revalidatePath('/tasks');
  return result;
}

/* ── assignTask ──────────────────────────────────────────── */
export async function assignTaskAction(id: string, assigneeId: string) {
  const result = await updateTask(id, { assigneeId });
  revalidatePath('/tasks');
  return result;
}

/* ── instantiateTemplate ─────────────────────────────────── */
export async function instantiateTemplateAction(data: {
  storeId: string;
  templateId: string;
  assigneeId?: string;
  dueAt?: string;
}) {
  // Templates are instantiated by creating a task with templateId reference
  const result = await createTask({
    storeId: data.storeId,
    title: `Template task (${data.templateId})`,
    assigneeId: data.assigneeId,
    dueAt: data.dueAt,
  });
  revalidatePath('/tasks');
  return result;
}
