/**
 * lib/api/clients/tasks.ts — Tasks endpoints (Doc 1 §6.9)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { TaskSchema } from '../schemas/common';
import { PaginatedSchema, cursorParams, type CursorParams } from '../core/pagination';

export interface TaskFilters extends CursorParams {
  storeId: string;
  status?: string;
  assigneeId?: string;
  priority?: string;
  from?: string;
  to?: string;
}

export async function listTasks(filters: TaskFilters) {
  const { storeId, status, assigneeId, priority, from, to, ...paging } = filters;
  return apiFetch('/tasks', {
    schema: PaginatedSchema(TaskSchema),
    query: { storeId, status, assigneeId, priority, from, to, ...cursorParams(paging) },
  });
}

export async function getTask(id: string) {
  return apiFetch(`/tasks/${id}`, { schema: TaskSchema });
}

export async function createTask(data: {
  storeId: string;
  title: string;
  description?: string;
  priority?: string;
  assigneeId?: string;
  dueAt?: string;
}) {
  return apiFetch('/tasks', { method: 'POST', body: data, schema: TaskSchema });
}

export async function updateTask(id: string, data: Partial<{ title: string; status: string; priority: string; assigneeId: string; dueAt: string }>) {
  return apiFetch(`/tasks/${id}`, { method: 'PATCH', body: data, schema: TaskSchema });
}

export async function deleteTask(id: string) {
  return apiFetch(`/tasks/${id}`, { method: 'DELETE', schema: z.object({}), noBody: true });
}

export async function transitionTask(id: string, status: string) {
  return apiFetch(`/tasks/${id}/transition`, { method: 'POST', body: { status }, schema: TaskSchema });
}

export async function getTaskTemplates(storeId: string) {
  return apiFetch('/tasks/templates', {
    schema: z.object({ templates: z.array(z.object({ id: z.string(), title: z.string() })) }),
    query: { storeId },
  });
}
