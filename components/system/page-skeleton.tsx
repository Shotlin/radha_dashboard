'use client';

/**
 * components/system/page-skeleton.tsx
 * HeaderSkeleton + PageSkeleton — the canonical route-segment loading placeholder.
 *
 * Used by each `app/(dash)/<segment>/loading.tsx` so that, while a Feature_Area
 * page renders, the persistent DashShell (rendered by `(dash)/layout.tsx`) stays
 * mounted and shows a sensible skeleton within the first viewport rather than a
 * blank page (R5.2). Because the shell lives in the layout, only `{children}` is
 * suspended and swapped — the sidebar/top bar never unmount (R5.4).
 *
 * Block layout mirrors the real page chrome (a `PageHeader` band followed by the
 * page's data regions) so the shell does not reflow when content arrives.
 *
 * Tokens-only: every color/spacing/radius is a Tailwind token class (no literals).
 * Reduced motion (R9.7): the shimmer is suppressed and a static tonal block shown.
 */
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';
import { RegionSkeleton, type RegionSkeletonVariant } from './region-skeleton';

/** One region placeholder in a page skeleton. */
export interface SkeletonRegion {
  variant: RegionSkeletonVariant;
  /** Repeated rows/cells for the 'table', 'list', and 'kpi' variants. */
  rows?: number;
}

export interface PageSkeletonProps {
  /** Render a primary-action placeholder in the header band. Defaults to true. */
  withAction?: boolean;
  /** Region placeholders rendered below the header, in order. */
  regions: SkeletonRegion[];
}

/**
 * HeaderSkeleton — loading placeholder for the `PageHeader` band: eyebrow + title
 * + subtitle on the left, one optional action pill on the right.
 */
export function HeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  const reduced = useReducedMotion();
  // Suppress shimmer for reduced-motion users; keep the static tonal block.
  const block = reduced ? 'bg-surface-sunken' : 'skeleton';

  return (
    <header
      className="flex items-start justify-between gap-16 flex-wrap border-b border-hairline/60 pb-24 mb-8"
      aria-busy="true"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-8">
        <div className={cn('h-3 w-20 rounded-sm', block)} />
        <div className={cn('h-7 w-56 rounded-sm', block)} />
        <div className={cn('h-4 w-72 rounded-sm', block)} />
      </div>
      {withAction && <div className={cn('h-9 w-36 rounded-md', block)} />}
    </header>
  );
}

/**
 * PageSkeleton — composes the header band with a list of region skeletons that
 * match the destination page's region layout. The outer gap mirrors the pages'
 * `flex flex-col gap-6` (24px) so there is no reflow when the real page mounts.
 */
export function PageSkeleton({ withAction = true, regions }: PageSkeletonProps) {
  return (
    <div className="flex flex-col gap-24" aria-busy="true">
      <HeaderSkeleton withAction={withAction} />
      {regions.map((r, i) => (
        <RegionSkeleton key={i} variant={r.variant} rows={r.rows} />
      ))}
    </div>
  );
}
