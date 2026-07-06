import { AlertCircle, RefreshCw, Inbox } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

/* ── Empty State (4.11) ─────────────────────────────────── */
interface EmptyStateProps {
  title: string;
  description?: string;
  /** Primary CTA — one orange button. */
  action?: { label: string; onClick: () => void };
  icon?: React.ElementType;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12 px-6 text-center',
        'bg-surface-sunken rounded-lg border border-hairline',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-full bg-accent-tint flex items-center justify-center">
        <Icon className="h-6 w-6 text-accent-deep" aria-hidden="true" />
      </div>
      <h3 className="text-[17px] font-bold text-ink">{title}</h3>
      {description && <p className="text-[14px] text-ink-soft max-w-xs">{description}</p>}
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick} className="mt-1">
          {action.label}
        </Button>
      )}
    </div>
  );
}

/* ── Error State ─────────────────────────────────────────── */
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this data. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12 px-6 text-center',
        'bg-[color:rgb(185_28_28_/_0.04)] rounded-lg border border-[color:rgb(185_28_28_/_0.2)]',
        className,
      )}
      role="alert"
    >
      <div className="w-12 h-12 rounded-full bg-[color:rgb(185_28_28_/_0.1)] flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-danger" aria-hidden="true" />
      </div>
      <h3 className="text-[17px] font-bold text-ink">{title}</h3>
      <p className="text-[14px] text-ink-soft max-w-xs">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-1">
          <RefreshCw className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────── */
interface SkeletonProps {
  className?: string;
  /** Number of repeated skeleton rows */
  rows?: number;
}

export function Skeleton({ className, rows = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn('skeleton rounded h-4 w-full', className)} aria-hidden="true" />
      ))}
    </>
  );
}

/** Card-shaped skeleton matching the final card layout */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card p-4 flex flex-col gap-3', className)} aria-busy="true">
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}
