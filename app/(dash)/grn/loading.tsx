import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * GRN list loading state (R5.2, R5.4): header + KPI strip + GRN records table.
 */
export default function Loading() {
  return (
    <PageSkeleton
      withAction
      regions={[
        { variant: 'kpi', rows: 4 },
        { variant: 'table', rows: 5 },
      ]}
    />
  );
}
