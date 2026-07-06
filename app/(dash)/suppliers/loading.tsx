import { PageSkeleton } from '@/components/system/page-skeleton';

/**
 * Suppliers loading state (R5.2, R5.4): header + supplier directory table.
 */
export default function Loading() {
  return (
    <PageSkeleton
      withAction
      regions={[{ variant: 'table', rows: 6 }]}
    />
  );
}
