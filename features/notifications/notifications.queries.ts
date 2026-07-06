'use client';
/**
 * features/notifications/notifications.queries.ts
 * TanStack Query hooks for the Notifications feature (Phase 15).
 * All data fetching goes through the /api/notifications proxy route.
 */
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import type { NotificationListResponse, NotificationPrefs } from './notifications.schema';

/* ── Fetch helpers (client → Next.js route handlers) ────────────────────── */

async function fetchNotifications(params?: {
  unreadOnly?: boolean;
  cursor?: string;
  limit?: number;
}): Promise<NotificationListResponse> {
  const qs = new URLSearchParams();
  if (params?.unreadOnly) qs.set('unreadOnly', 'true');
  if (params?.cursor) qs.set('cursor', params.cursor);
  if (params?.limit) qs.set('limit', String(params.limit));
  const res = await fetch(`/api/notifications?${qs.toString()}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json() as Promise<NotificationListResponse>;
}

async function fetchNotificationPrefs(): Promise<NotificationPrefs> {
  const res = await fetch('/api/notifications/preferences', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch notification preferences');
  return res.json() as Promise<NotificationPrefs>;
}

/* ── Hooks ───────────────────────────────────────────────────────────────── */

export function useNotifications(params?: {
  unreadOnly?: boolean;
  cursor?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: qk.notifications(params),
    queryFn: () => fetchNotifications(params),
    staleTime: 30_000,
  });
}

export function useNotificationPrefs() {
  return useQuery({
    queryKey: qk.notificationPrefs(),
    queryFn: fetchNotificationPrefs,
    staleTime: 5 * 60_000,
  });
}

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const data = await fetchNotifications({ unreadOnly: true, limit: 1 });
      return data.unreadCount ?? 0;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
