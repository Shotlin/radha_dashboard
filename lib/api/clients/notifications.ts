/**
 * lib/api/clients/notifications.ts — Notifications endpoints (Doc 1 §6.17)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { NotificationSchema, NotificationListSchema } from '../schemas/common';
import { type CursorParams, cursorParams } from '../core/pagination';

export async function listNotifications(params?: { unreadOnly?: boolean } & CursorParams) {
  const { unreadOnly, ...paging } = params ?? {};
  return apiFetch('/notifications', {
    schema: NotificationListSchema,
    query: { unreadOnly, ...cursorParams(paging) },
  });
}

export async function markNotificationRead(id: string) {
  return apiFetch(`/notifications/${id}/read`, { method: 'POST', schema: NotificationSchema });
}

export async function markAllRead() {
  return apiFetch('/notifications/read-all', { method: 'POST', schema: z.object({ updated: z.number() }) });
}

export async function getNotificationPreferences() {
  return apiFetch('/notifications/preferences', {
    schema: z.object({ channels: z.record(z.boolean()), types: z.record(z.boolean()) }),
  });
}

export async function updateNotificationPreferences(prefs: { channels?: Record<string, boolean>; types?: Record<string, boolean> }) {
  return apiFetch('/notifications/preferences', {
    method: 'PATCH',
    body: prefs,
    schema: z.object({ ok: z.boolean() }),
  });
}

export async function sendTestNotification(channel: string) {
  return apiFetch('/notifications/test', {
    method: 'POST',
    body: { channel },
    schema: z.object({ ok: z.boolean() }),
  });
}
