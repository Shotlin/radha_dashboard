'use client';

/**
 * lib/hooks/use-region-load-guard.ts
 *
 * Per-region load guard (R5.6). Given a region's load status and a timeout
 * (default 10s), it yields a single `showError` flag that flips to `true` when
 * either:
 *   - the region's primary request has errored, or
 *   - the region is still loading its *primary* data (no cached/loaded data yet)
 *     after the timeout elapses.
 *
 * Consumers swap their skeleton to an error-with-retry state when `showError` is
 * true (see `components/system/region-state.tsx`). The guard only counts the
 * "no data yet" loading window: a revisit that shows cached data while a
 * background revalidation runs is NOT pending, so the timer never starts and the
 * guard stays `false` (cache-then-revalidate is unaffected — R5.5/R5.7).
 */
import { useEffect, useState } from 'react';

export const DEFAULT_REGION_TIMEOUT_MS = 10_000;

export interface RegionLoadGuardInput {
  /** True while the region has no data yet and its first request is in flight. */
  isPending: boolean;
  /** True when the region's primary request has failed. */
  isError: boolean;
  /** Milliseconds to wait before treating a still-pending region as failed. */
  timeoutMs?: number;
}

/**
 * Returns `true` when the region should swap its skeleton for an error state.
 * Pure timer logic — no fetching, no side effects beyond the timeout.
 */
export function useRegionLoadGuard({
  isPending,
  isError,
  timeoutMs = DEFAULT_REGION_TIMEOUT_MS,
}: RegionLoadGuardInput): boolean {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Not pending → no live load to guard; clear any prior timeout flag so a
    // later remount/refetch starts the window fresh.
    if (!isPending) {
      setTimedOut(false);
      return;
    }
    setTimedOut(false);
    const id = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(id);
  }, [isPending, timeoutMs]);

  return isError || (isPending && timedOut);
}
