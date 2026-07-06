import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * Settings loading state (R5.2, R5.4): header (tabs, no primary action) + the
 * active settings card.
 */
export default function Loading() {
  return (
    <PageSkeleton
      withAction={false}
      regions={[{ variant: 'card' }]}
    />
  );
}
