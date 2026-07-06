import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * Expiry loading state (R5.2, R5.4): header + KPI row + records table, matching
 * the page's "At a glance" KPIs and the calendar/records grid.
 */
export default function Loading() {
  return (
    <PageSkeleton
      withAction
      regions={[
        { variant: 'kpi', rows: 4 },
        { variant: 'table', rows: 6 },
      ]}
    />
  );
}
