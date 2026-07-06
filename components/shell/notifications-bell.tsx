'use client';
/**
 * NotificationsBell — polls GET /notifications for unread count.
 */
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

async function fetchUnread(): Promise<number> {
  const res = await fetch('/api/notifications?unreadOnly=true&limit=1', { credentials: 'include' });
  if (!res.ok) return 0;
  const data = (await res.json()) as { unreadCount?: number };
  return data.unreadCount ?? 0;
}

export function NotificationsBell() {
  const { data: unread = 0 } = useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnread,
    refetchInterval: 60_000, // throttled: once per minute
    staleTime: 30_000,
  });

  return (
    <Link
      href="/notifications"
      className={cn(
        'relative flex items-center justify-center w-9 h-9 rounded-lg',
        'text-[var(--ink-soft)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)]',
        'transition-colors duration-100',
        'focus-visible:outline-2 focus-visible:outline-[var(--accent)]',
      )}
      aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
    >
      <Bell className="w-5 h-5" aria-hidden="true" />
      {unread > 0 && (
        <span
          className={cn(
            'absolute top-1 right-1 min-w-[16px] h-4 px-1',
            'rounded-full bg-[var(--accent)] text-white text-[10px] font-bold',
            'flex items-center justify-center',
          )}
          aria-hidden="true"
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}
