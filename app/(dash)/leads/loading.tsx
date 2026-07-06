import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * Leads loading state (R5.2, R5.4): header (no primary action) + pipeline table.
 */
export default function Loading() {
  return (
    <PageSkeleton
      withAction={false}
      regions={[
        { variant: 'kpi', rows: 4 },
        { variant: 'table', rows: 6 },
      ]}
    />
  );
}
