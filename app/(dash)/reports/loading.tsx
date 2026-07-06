import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * Reports loading state (R5.2, R5.4): header (no primary action) + report builder
 * card + artefacts table.
 */
export default function Loading() {
  return (
    <PageSkeleton
      withAction={false}
      regions={[
        { variant: 'card' },
        { variant: 'table', rows: 5 },
      ]}
    />
  );
}
