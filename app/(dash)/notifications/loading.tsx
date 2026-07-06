import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * Notifications loading state (R5.2, R5.4): header (tabs, no primary action) +
 * inbox list.
 */
export default function Loading() {
  return (
    <PageSkeleton
      withAction={false}
      regions={[{ variant: 'list', rows: 6 }]}
    />
  );
}
