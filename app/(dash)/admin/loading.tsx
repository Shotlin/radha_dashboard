import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * Admin console loading state (R5.2, R5.4) and the fallback for admin subpages
 * (tenants, audit-logs, flags, webhooks, impersonation) that do not define their
 * own loading.tsx. Header + KPI row + table matches the typical admin layout.
 */
export default function Loading() {
  return (
    <PageSkeleton
      withAction={false}
      regions={[
        { variant: 'kpi', rows: 4 },
        { variant: 'table', rows: 5 },
      ]}
    />
  );
}
