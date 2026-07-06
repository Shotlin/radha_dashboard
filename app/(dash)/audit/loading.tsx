import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * Audit / EAN loading state (R5.2, R5.4): header + match-rate KPI + EAN lists
 * table (the default tab).
 */
export default function Loading() {
  return (
    <PageSkeleton
      withAction
      regions={[
        { variant: 'kpi', rows: 1 },
        { variant: 'table', rows: 5 },
      ]}
    />
  );
}
