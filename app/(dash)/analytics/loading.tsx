import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * Analytics loading state (R5.2, R5.4): header (no primary action) + KPI row +
 * funnel/traffic charts.
 */
export default function Loading() {
  return (
    <PageSkeleton
      withAction={false}
      regions={[
        { variant: 'kpi', rows: 4 },
        { variant: 'chart' },
        { variant: 'chart' },
      ]}
    />
  );
}
