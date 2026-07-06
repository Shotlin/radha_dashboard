'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MonoNumber } from './mono-number';
import { Eyebrow } from './eyebrow';
import { cn } from '@/lib/utils';

export type KpiTileState = 'default' | 'loading' | 'error';

export interface KpiTileProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  /** Percentage trend — positive=up, negative=down, undefined=no trend */
  trend?: number;
  /** Tailwind color class for the category icon tint, e.g. 'text-warn' */
  tint?: string;
  /** Background tint class for the tile icon well */
  tintBg?: string;
  icon?: React.ElementType;
  href?: string;
  actionLabel?: string;
  state?: KpiTileState;
  className?: string;
}

/**
 * KPI Tile (Doc 2 §4.1) — category glyph + mono count-up + label + trend chip.
 * One orange CTA max (actionLabel). State matrix: default · loading · error.
 */
export function KpiTile({
  label,
  value,
  format,
  trend,
  tint = 'text-accent',
  tintBg = 'bg-accent-tint',
  icon: Icon,
  href,
  actionLabel,
  state = 'default',
  className,
}: KpiTileProps) {
  // Prevent SSR/client hydration mismatch with loading skeleton
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const resolvedState = mounted ? state : 'default';

  if (resolvedState === 'loading') {
    return (
      <div className={cn('card p-4 flex flex-col gap-3', className)} aria-busy="true" suppressHydrationWarning>
        <div className="skeleton h-8 w-8 rounded-md" />
        <div className="skeleton h-7 w-20 rounded" />
        <div className="skeleton h-4 w-28 rounded" />
      </div>
    );
  }

  if (resolvedState === 'error') {
    return (
      <div className={cn('card p-4 flex flex-col items-center justify-center gap-2 min-h-[100px]', className)} suppressHydrationWarning>
        <span className="text-danger text-[13px]">Failed to load</span>
      </div>
    );
  }

  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <div className={cn('card p-4 flex flex-col gap-2 hover:shadow-card-md transition-shadow duration-150 min-h-[110px]', className)} suppressHydrationWarning>
      {/* Top row: icon well */}
      {Icon && (
        <div className={cn('w-8 h-8 rounded-md flex items-center justify-center', tintBg)}>
          <Icon className={cn('h-4 w-4', tint)} aria-hidden="true" />
        </div>
      )}

      {/* Big mono number */}
      <MonoNumber
        value={value}
        format={format}
        className={cn('text-2xl font-bold', tint)}
        aria-label={`${label}: ${value}`}
      />

      {/* Label */}
      <p className="text-[13px] text-ink-soft leading-tight">{label}</p>

      {/* Trend chip */}
      {trend !== undefined && (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[12px] font-medium',
            trendPositive ? 'text-success' : 'text-danger',
          )}
          aria-label={`${trendPositive ? 'Up' : 'Down'} ${Math.abs(trend)}% from last period`}
        >
          {trendPositive ? (
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {Math.abs(trend)}%
        </span>
      )}

      {/* Action link */}
      {href && actionLabel && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent mt-auto"
        >
          {actionLabel} <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
