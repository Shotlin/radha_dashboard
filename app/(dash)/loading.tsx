import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * app/(dash)/loading.tsx — Overview (Command Centre) loading state AND the
 * universal fallback for any nested (dash) segment that does not define its own
 * loading.tsx. Rendered inside the persistent DashShell while the segment streams,
 * so the shell stays mounted and a skeleton appears within the first viewport
 * (R5.2, R5.4). Mirrors the overview layout: KPI bento + performance chart +
 * alerts/activity lists.
 */
export default function Loading() {
  return (
    <PageSkeleton
      withAction
      regions={[
        { variant: 'kpi', rows: 4 },
        { variant: 'chart' },
        { variant: 'list', rows: 4 },
      ]}
    />
  );
}
