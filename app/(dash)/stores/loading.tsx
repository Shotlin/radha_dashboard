import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * Stores loading state (R5.2, R5.4): header (no primary action) + content card.
 */
export default function Loading() {
  return (
    <PageSkeleton
      withAction={false}
      regions={[{ variant: 'card' }]}
    />
  );
}
