'use client';

/**
 * components/system/region-state.tsx
 * RegionState — the canonical wrapper that drives a single page region through
 * its loaded / loading / error lifecycle from a TanStack Query result.
 *
 * Rendering rules (R5.5, R5.6, R5.7):
 *   - has data        → render `children`. Cached data shows immediately on a
 *                       revisit (within 500ms) while a background revalidation
 *                       runs transparently; TanStack swaps in differing data
 *                       automatically (R5.5 / R5.7). Stale data is preferred over
 *                       a skeleton even if a background refetch later errors
 *                       (siblings/last-data preserved — R10.1/R10.4).
 *   - loading (<10s)  → render `RegionSkeleton` (block layout matches final content).
 *   - loading ≥10s OR
 *     primary error   → render `RegionError` with a retry that re-issues this
 *                       region's request via the query's `refetch` (R5.6 / R10.5).
 *
 * Tokens-only (R9.1): all visuals come from RegionSkeleton / RegionError, which
 * read design tokens via Tailwind classes — this file holds no literals.
 */
import type { ReactNode } from 'react';
import { RegionSkeleton, type RegionSkeletonVariant } from './region-skeleton';
import { RegionError } from './region-error';
import { useRegionLoadGuard, type RegionLoadGuardInput } from '@/lib/hooks/use-region-load-guard';

/**
 * The minimal subset of a TanStack `UseQueryResult` that RegionState needs.
 * A `useQuery(...)` result satisfies this directly.
 */
export interface RegionQueryLike<T> {
  data: T | undefined;
  isError: boolean;
  isPending: boolean;
  refetch: () => unknown;
}

export interface RegionStateProps<T> {
  /** The region's TanStack Query result. */
  query: RegionQueryLike<T>;
  /** Rendered when the region has data (possibly while revalidating). */
  children: ReactNode;
  /** Skeleton shape to mimic the final content. Defaults to 'card'. */
  variant?: RegionSkeletonVariant;
  /** Repeated rows/cells for list/table/kpi skeletons. */
  rows?: number;
  /** Override the 10s primary-load timeout (R5.6). */
  timeoutMs?: RegionLoadGuardInput['timeoutMs'];
  /** Error-state copy. */
  errorTitle?: string;
  errorMessage?: string;
  retryLabel?: string;
  className?: string;
}

/**
 * RegionState — wrap a region's content so its loading/error lifecycle is handled
 * consistently across every Feature_Area.
 *
 * @example
 *   const q = useExpiryKpis(storeId);
 *   <RegionState query={q} variant="kpi" rows={4}>
 *     <ExpiryKpiRow data={q.data!} />
 *   </RegionState>
 */
export function RegionState<T>({
  query,
  children,
  variant = 'card',
  rows = 3,
  timeoutMs,
  errorTitle,
  errorMessage,
  retryLabel,
  className,
}: RegionStateProps<T>) {
  const showError = useRegionLoadGuard({
    isPending: query.isPending,
    isError: query.isError,
    timeoutMs,
  });

  // Data present → show it (cache-then-revalidate keeps it visible while a
  // background refetch runs, and stale data is preferred over a skeleton).
  if (query.data !== undefined) {
    return <>{children}</>;
  }

  // No data yet, but errored or exceeded the load timeout → error + retry.
  if (showError) {
    return (
      <RegionError
        title={errorTitle}
        message={errorMessage}
        retryLabel={retryLabel}
        onRetry={() => query.refetch()}
        className={className}
      />
    );
  }

  // No data yet, still within the load window → skeleton.
  return <RegionSkeleton variant={variant} rows={rows} className={className} />;
}
