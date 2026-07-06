'use client';
/**
 * features/notifications/components/inbox-list.tsx
 * Notification inbox — list of items with type glyph, title, body,
 * mono timestamp, unread dot. Mark-read on click, mark-all-read button.
 */
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmptyState, Skeleton } from '@/components/ui/states';
import { useNotifications } from '../notifications.queries';
import { useMarkReadMutation, useMarkAllReadMutation } from '../notifications.actions';
import { NOTIFICATION_TYPE_META } from '../notifications.schema';
import type { NotificationItem } from '../notifications.schema';

/* ── Single notification row ─────────────────────────────────────────────── */
function NotificationRow({
  item,
  onMarkRead,
  isPending,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
  isPending: boolean;
}) {
  const meta = NOTIFICATION_TYPE_META[item.type] ?? {
    label: item.type,
    glyph: '🔔',
    color: 'text-[var(--ink-soft)]',
  };

  const ts = new Date(item.createdAt);
  const formattedDate = ts.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = ts.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => !item.isRead && onMarkRead(item.id)}
      className={cn(
        'group w-full flex items-start gap-3 px-4 py-3.5 text-left',
        'border-b border-[var(--hairline)] last:border-b-0',
        'transition-colors duration-100',
        !item.isRead
          ? 'bg-[var(--surface-raised)] hover:bg-[color:rgb(234_88_12_/_0.04)] cursor-pointer'
          : 'bg-transparent cursor-default hover:bg-[var(--surface-sunken)]',
        isPending && 'opacity-50',
      )}
      aria-label={`${item.isRead ? '' : 'Unread: '}${item.title}`}
    >
      {/* Glyph badge */}
      <div
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[16px]',
          'bg-[var(--surface-sunken)] border border-[var(--hairline)]',
          !item.isRead && 'bg-[var(--accent-tint)]',
        )}
        aria-hidden="true"
      >
        {meta.glyph}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'text-[14px] leading-snug truncate',
              item.isRead ? 'font-normal text-[var(--ink-soft)]' : 'font-semibold text-[var(--ink)]',
            )}
          >
            {item.title}
          </p>
          {/* Unread dot */}
          {!item.isRead && (
            <span
              className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--accent)]"
              aria-hidden="true"
            />
          )}
        </div>
        {item.body && (
          <p className="mt-0.5 text-[13px] text-[var(--ink-soft)] line-clamp-2">{item.body}</p>
        )}
        {/* Mono timestamp */}
        <p className="mt-1 font-mono text-[11px] text-[var(--ink-soft)] tabular-nums">
          {formattedDate} · {formattedTime}
        </p>
      </div>
    </button>
  );
}

/* ── Inbox list ──────────────────────────────────────────────────────────── */
export function InboxList() {
  const { data, isLoading, isError, refetch } = useNotifications();
  const markReadMutation = useMarkReadMutation();
  const markAllMutation = useMarkAllReadMutation();

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  function handleMarkRead(id: string) {
    markReadMutation.mutate(id);
  }

  function handleMarkAllRead() {
    markAllMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <EmptyState
          title="Could not load notifications"
          description="Check your connection and try again."
          action={{ label: 'Retry', onClick: () => void refetch() }}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="All caught up"
        description="No notifications right now. We'll let you know when something needs your attention."
        className="mx-4 my-6"
      />
    );
  }

  return (
    <div>
      {/* Header row with mark-all-read */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--hairline)]">
        <p className="text-[13px] font-semibold text-[var(--ink-soft)]">
          {unreadCount > 0 ? (
            <span>
              <span className="text-[var(--accent)] font-bold">{unreadCount}</span> unread
            </span>
          ) : (
            'All read'
          )}
        </p>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            loading={markAllMutation.isPending}
            className="text-[12px] h-7 px-2"
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification rows */}
      <div role="list" aria-label="Notifications">
        {items.map((item) => (
          <div key={item.id} role="listitem">
            <NotificationRow
              item={item}
              onMarkRead={handleMarkRead}
              isPending={
                markReadMutation.isPending && markReadMutation.variables === item.id
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
