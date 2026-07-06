'use client';
/**
 * features/notifications/notifications.actions.ts
 * Client-side mutation actions for the Notifications feature (Phase 15).
 * These call the Next.js /api/notifications route handlers.
 */
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import type { UpdatePrefsPayload } from './notifications.schema';

/* ── Mark a single notification as read ─────────────────────────────────── */
export async function markRead(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}/read`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to mark notification as read');
}

/* ── Mark all notifications as read ─────────────────────────────────────── */
export async function markAllRead(): Promise<{ updated: number }> {
  const res = await fetch('/api/notifications/read-all', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to mark all notifications as read');
  return res.json() as Promise<{ updated: number }>;
}

/* ── Update notification preferences ────────────────────────────────────── */
export async function updatePrefs(prefs: UpdatePrefsPayload): Promise<{ ok: boolean }> {
  const res = await fetch('/api/notifications/preferences', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error('Failed to update notification preferences');
  return res.json() as Promise<{ ok: boolean }>;
}

/* ── Send a test notification ────────────────────────────────────────────── */
export async function sendTest(channel: string): Promise<{ ok: boolean }> {
  const res = await fetch('/api/notifications/test', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel }),
  });
  if (!res.ok) throw new Error('Failed to send test notification');
  return res.json() as Promise<{ ok: boolean }>;
}

/* ── React mutation hooks ────────────────────────────────────────────────── */

export function useMarkReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.notifications() });
      void qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useMarkAllReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.notifications() });
      void qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useUpdatePrefsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePrefs,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.notificationPrefs() });
    },
  });
}

export function useSendTestMutation() {
  return useMutation({ mutationFn: sendTest });
}
