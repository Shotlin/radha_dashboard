import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/states';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Stores' };

export default function StoresPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Stores"
      />
      <EmptyState
        title="Stores"
        description="Stores screen implemented in Phase 04 shell."
      />
    </div>
  );
}
