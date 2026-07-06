'use client';

/**
 * components/system/region-skeleton.tsx
 * RegionSkeleton — the canonical loading placeholder for a page region (R9.5).
 *
 * Its block layout matches the position and shape of the final rendered content
 * for each region variant (KPI row, table, chart, list, or a generic card), so the
 * shell does not reflow when real data arrives.
 *
 * Reduced motion (R9.7): when the user prefers reduced motion the shimmer is
 * suppressed and a static tonal block is shown instead.
 */
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

export type RegionSkeletonVariant = 'kpi' | 'table' | 'chart' | 'list' | 'card';

export interface RegionSkeletonProps {
  /** Which final-content shape this placeholder mimics. Defaults to 'card'. */
  variant?: RegionSkeletonVariant;
  /** Number of repeated rows/cells for the 'table', 'list', and 'kpi' variants. */
  rows?: number;
  className?: string;
}

/**
 * RegionSkeleton — swap a region to this while its data loads.
 * Marked aria-hidden + aria-busy so assistive tech skips the placeholder blocks.
 */
export function RegionSkeleton({ variant = 'card', rows = 3, className }: RegionSkeletonProps) {
  const reduced = useReducedMotion();
  // Suppress shimmer for reduced-motion users; keep the static tonal block.
  const block = reduced ? 'bg-surface-sunken' : 'skeleton';

  return (
    <div className={cn('w-full', className)} aria-busy="true" aria-hidden="true">
      {variant === 'kpi' && <KpiSkeleton block={block} count={rows} />}
      {variant === 'table' && <TableSkeleton block={block} rows={rows} />}
      {variant === 'list' && <ListSkeleton block={block} rows={rows} />}
      {variant === 'chart' && <ChartSkeleton block={block} />}
      {variant === 'card' && <CardSkeleton block={block} />}
    </div>
  );
}

/* ── Variant layouts (block shapes match the real content) ─────────────────── */

function KpiSkeleton({ block, count }: { block: string; count: number }) {
  return (
    <div className="grid grid-cols-2 gap-16 md:grid-cols-4">
      {Array.from({ length: Math.max(count, 1) }).map((_, i) => (
        <div key={i} className="flex flex-col gap-12 rounded-lg border border-hairline bg-surface-raised p-16">
          <div className={cn('h-8 w-8 rounded-md', block)} />
          <div className={cn('h-7 w-24 rounded-sm', block)} />
          <div className={cn('h-4 w-20 rounded-sm', block)} />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ block, rows }: { block: string; rows: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-surface-raised">
      {/* Header row */}
      <div className="flex items-center gap-16 border-b border-hairline px-16 py-12">
        <div className={cn('h-4 w-1/4 rounded-sm', block)} />
        <div className={cn('h-4 w-1/4 rounded-sm', block)} />
        <div className={cn('h-4 w-1/4 rounded-sm', block)} />
        <div className={cn('h-4 w-1/4 rounded-sm', block)} />
      </div>
      {/* Body rows */}
      {Array.from({ length: Math.max(rows, 1) }).map((_, i) => (
        <div key={i} className="flex items-center gap-16 border-b border-hairline px-16 py-12 last:border-b-0">
          <div className={cn('h-4 w-1/4 rounded-sm', block)} />
          <div className={cn('h-4 w-1/4 rounded-sm', block)} />
          <div className={cn('h-4 w-1/4 rounded-sm', block)} />
          <div className={cn('h-4 w-1/4 rounded-sm', block)} />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton({ block, rows }: { block: string; rows: number }) {
  return (
    <div className="flex flex-col gap-12">
      {Array.from({ length: Math.max(rows, 1) }).map((_, i) => (
        <div key={i} className="flex items-center gap-12 rounded-lg border border-hairline bg-surface-raised p-16">
          <div className={cn('h-10 w-10 rounded-md', block)} />
          <div className="flex flex-1 flex-col gap-8">
            <div className={cn('h-4 w-1/3 rounded-sm', block)} />
            <div className={cn('h-3 w-1/2 rounded-sm', block)} />
          </div>
          <div className={cn('h-6 w-16 rounded-full', block)} />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ block }: { block: string }) {
  return (
    <div className="flex flex-col gap-16 rounded-lg border border-hairline bg-surface-raised p-16">
      <div className={cn('h-4 w-1/3 rounded-sm', block)} />
      <div className={cn('h-48 w-full rounded-md', block)} />
    </div>
  );
}

function CardSkeleton({ block }: { block: string }) {
  return (
    <div className="flex flex-col gap-12 rounded-lg border border-hairline bg-surface-raised p-16">
      <div className={cn('h-8 w-8 rounded-md', block)} />
      <div className={cn('h-7 w-24 rounded-sm', block)} />
      <div className={cn('h-4 w-32 rounded-sm', block)} />
    </div>
  );
}
