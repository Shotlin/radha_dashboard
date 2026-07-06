import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * Billing loading state (R5.2, R5.4): header (no primary action) + plan/usage
 * KPIs + subscription card + invoices table.
 */
export default function Loading() {
  return (
    <PageSkeleton
      withAction={false}
      regions={[
        { variant: 'kpi', rows: 3 },
        { variant: 'card' },
        { variant: 'table', rows: 5 },
      ]}
    />
  );
}
