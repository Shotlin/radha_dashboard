'use client';
/**
 * features/admin/components/feature-flags.tsx
 * Read-only list of feature flags with enabled/disabled status chips.
 * Note: "Read-only — management requires backend."
 */
import { Flag, Info } from 'lucide-react';
import { EmptyState, Skeleton } from '@/components/ui/states';
import { useFeatureFlags } from '../admin.queries';
import type { FeatureFlag } from '../admin.schema';
import { cn } from '@/lib/utils';

function FlagRow({ flag }: { flag: FeatureFlag }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4 border-b border-[var(--hairline)] last:border-b-0">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[var(--ink)] font-mono truncate">
          {flag.key}
        </p>
        {flag.description && (
          <p className="text-[12px] text-[var(--ink-soft)] mt-0.5">{flag.description}</p>
        )}
      </div>
      <span
        className={cn(
          'flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold border',
          flag.enabled
            ? 'bg-[color:rgb(21_128_61_/_0.08)] border-[color:rgb(21_128_61_/_0.35)] text-[var(--success)]'
            : 'bg-[var(--surface-sunken)] border-[var(--hairline)] text-[var(--ink-soft)]',
        )}
        aria-label={flag.enabled ? `${flag.key} is enabled` : `${flag.key} is disabled`}
      >
        {flag.enabled ? '✓ Enabled' : '✗ Disabled'}
      </span>
    </div>
  );
}

export function FeatureFlagsList() {
  const { data, isLoading, isError } = useFeatureFlags();
  const flags = data?.flags ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Read-only notice */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-[color:rgb(15_118_110_/_0.06)] border border-[color:rgb(15_118_110_/_0.25)]">
        <Info className="h-4 w-4 text-[var(--teal)] flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-[13px] text-[var(--ink-soft)]">
          <span className="font-semibold text-[var(--teal)]">Read-only —</span> Feature flag
          management (toggling, tenant overrides, rollout %) requires backend configuration.
          This view shows the current state.
        </p>
      </div>

      {isLoading && (
        <div className="card">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center px-4 py-3 border-b border-[var(--hairline)] last:border-b-0">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          title="Could not load feature flags"
          description="Feature flags are unavailable. The backend endpoint may not be implemented yet."
          icon={Flag}
        />
      )}

      {!isLoading && !isError && flags.length === 0 && (
        <EmptyState
          title="No feature flags configured"
          description="Feature flags will appear here once configured in the backend."
          icon={Flag}
        />
      )}

      {!isLoading && !isError && flags.length > 0 && (
        <div className="card overflow-hidden">
          {flags.map((flag) => (
            <FlagRow key={flag.key} flag={flag} />
          ))}
        </div>
      )}
    </div>
  );
}
