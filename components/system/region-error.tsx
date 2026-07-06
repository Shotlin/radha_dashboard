'use client';

/**
 * components/system/region-error.tsx
 * RegionError — the canonical error state for a single page region (R9.6).
 *
 * It renders an error indication (danger-tinted icon + message) and a retry
 * control. It is laid out as a self-contained block inside its own region — it
 * never takes over the full page, so sibling regions keep their loaded data and
 * stay interactive (R9.6 / R10.1).
 *
 * Tokens-only: every color/spacing/radius is read from design tokens via Tailwind
 * classes (no hard-coded color/spacing/radius/duration literals — R9.1).
 */
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface RegionErrorProps {
  /** Headline for the error. */
  title?: string;
  /** One supporting line describing the failure. */
  message?: string;
  /** Re-issues only this region's failed request (R10.5). */
  onRetry: () => void;
  /** Label for the retry control. */
  retryLabel?: string;
  className?: string;
}

/**
 * RegionError — swap a region to this when its data fails to load.
 * Uses role="alert" so the failure is announced to assistive tech.
 */
export function RegionError({
  title = 'Could not load this section',
  message = 'Something went wrong while loading this data. Other sections are unaffected.',
  onRetry,
  retryLabel = 'Try again',
  className,
}: RegionErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        'rounded-lg border border-hairline bg-surface-sunken',
        className,
      )}
    >
      {/* Error indication — tonal badge with danger-colored glyph */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised">
        <AlertTriangle className="h-6 w-6 text-danger" aria-hidden={true} />
      </div>

      <h3 className="text-[17px] font-bold text-ink">{title}</h3>
      <p className="max-w-xs text-[14px] text-ink-soft">{message}</p>

      <Button variant="secondary" size="sm" onClick={onRetry} className="mt-1">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden={true} />
        {retryLabel}
      </Button>
    </div>
  );
}
