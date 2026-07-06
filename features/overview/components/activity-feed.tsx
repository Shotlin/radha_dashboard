'use client';
/**
 * Activity feed — recent store actions from /dashboard/activity
 * Redesigned as a vertical timeline with connector line and circular nodes.
 */
import { EmptyState } from '@/components/ui/states';
import { Eyebrow } from '@/components/ui/eyebrow';
import { RegionState } from '@/components/system/region-state';
import { useOverviewActivity } from '../overview.queries';
import type { ActivityItem } from '../overview.schema';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  storeId: string | null;
}

/** Human-readable relative timestamp */
function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const ts = new Date(iso).getTime();
  const diffMs = now - ts;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

/** Map action string to a short initials-style node label */
function actionInitials(action: string): string {
  return action.slice(0, 1).toUpperCase();
}

/** Map action to a background tint */
function actionNodeColor(action: string): string {
  const a = action.toLowerCase();
  if (a.includes('expir') || a.includes('clear')) return 'bg-[color:rgb(180_83_9_/_0.12)] text-warn';
  if (a.includes('task') || a.includes('complet')) return 'bg-[color:rgb(21_128_61_/_0.1)] text-success';
  if (a.includes('scan') || a.includes('audit')) return 'bg-[color:rgb(234_88_12_/_0.1)] text-accent';
  if (a.includes('grn') || a.includes('receiv')) return 'bg-[color:rgb(21_128_61_/_0.1)] text-success';
  return 'bg-surface-sunken text-ink-soft';
}

export function ActivityFeed({ storeId }: ActivityFeedProps) {
  const query = useOverviewActivity(storeId, 8);

  return (
    <RegionState
      query={query}
      variant="list"
      rows={5}
      errorTitle="Could not load activity"
      errorMessage="Recent activity could not be loaded. Other sections are unaffected."
    >
      {query.data ? <ActivityContent items={query.data.items} /> : null}
    </RegionState>
  );
}

function ActivityContent({ items }: { items: ActivityItem[] }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <Eyebrow>Recent Activity</Eyebrow>
      {items.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Once your team starts scanning and completing tasks, activity will appear here."
          className="border-0 bg-transparent py-6"
        />
      ) : (
        <div className="relative flex flex-col">
          {/* Vertical connector line */}
          <div
            className="absolute left-3.5 top-4 bottom-4 w-px bg-[var(--hairline)]"
            aria-hidden="true"
          />

          {items.map((item) => {
            const nodeColor = actionNodeColor(item.action);
            return (
              <div
                key={item.id}
                className="relative flex items-start gap-3 py-2.5"
              >
                {/* Timeline node */}
                <span
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center',
                    'flex-shrink-0 z-10 text-[10px] font-bold',
                    'border border-[var(--hairline)]',
                    nodeColor,
                  )}
                  aria-hidden="true"
                >
                  {actionInitials(item.action)}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-[13px] text-[var(--ink)] leading-snug">
                    <span className="font-semibold">{item.actor}</span>
                    {' '}
                    <span className="text-[var(--ink-soft)]">{item.action}</span>
                    {item.target && (
                      <span className="text-[var(--ink-soft)]"> · {item.target}</span>
                    )}
                  </p>
                  <span className="text-[11px] font-mono tabular-nums text-[var(--ink-soft)]">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
