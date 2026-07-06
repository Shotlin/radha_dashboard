import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * Tasks loading state (R5.2, R5.4): header + stats strip + tasks table/board.
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
