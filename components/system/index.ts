/**
 * components/system — first-class designed system states.
 * EmptyState (R9.4) · RegionSkeleton (R9.5) · RegionError (R9.6).
 */
export { EmptyState } from './empty-state';
export type { EmptyStateProps, EmptyStateCta } from './empty-state';

export { RegionSkeleton } from './region-skeleton';
export type { RegionSkeletonProps, RegionSkeletonVariant } from './region-skeleton';

export { RegionError } from './region-error';
export type { RegionErrorProps } from './region-error';

export { RegionState } from './region-state';
export type { RegionStateProps, RegionQueryLike } from './region-state';

export { NeedsBackend } from './needs-backend';

export { DemoIndicator } from './demo-indicator';
