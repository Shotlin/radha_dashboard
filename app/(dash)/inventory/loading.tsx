import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * Inventory loading state (R5.2, R5.4): header + KPI strip + low-stock list +
 * recent-movements table, matching the page's two-column body.
 */
export default function Loading() {
  return (
    <PageSkeleton
      withAction
      regions={[
        { variant: 'kpi', rows: 4 },
        { variant: 'list', rows: 3 },
        { variant: 'table', rows: 5 },
      ]}
    />
  );
}
