'use client';
/**
 * app/(dash)/grn/[id]/page.tsx — GRN detail page (Phase 09).
 */
import { use } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Eyebrow } from '@/components/ui/eyebrow';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { useStoreScope } from '@/lib/hooks/use-store-scope';
import { GrnDetail } from '@/features/grn/components/grn-detail';
import { GrnItemsEditor } from '@/features/grn/components/grn-items-editor';
import { useGrnDetail } from '@/features/grn/grn.queries';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GrnDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { storeId } = useStoreScope();
  const { data: grn, isLoading, isError } = useGrnDetail(id);

  const isDraft = grn?.status === 'draft' || grn?.status === 'partial';

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-soft" aria-label="Breadcrumb">
        <Link href="/grn" className="hover:text-ink transition-colors">
          GRN
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-ink-soft" aria-hidden="true" />
        <span className="text-ink font-semibold font-mono">{id.slice(0, 8)}…</span>
      </nav>

      {/* Page title */}
      <div>
        <Eyebrow>GRN DETAIL</Eyebrow>
        <h1 className="text-[24px] font-extrabold text-ink mt-0.5">
          {grn ? (grn.invoiceNo ? `Invoice ${grn.invoiceNo}` : `GRN ${id.slice(0, 8)}`) : 'Loading…'}
        </h1>
      </div>

      {/* Detail card */}
      {isError ? (
        <ErrorState title="Could not load GRN" description="The GRN may have been deleted or you don't have access." />
      ) : isLoading ? (
        <div className="card p-6 flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
          <Skeleton className="h-16" />
        </div>
      ) : grn ? (
        <GrnDetail grn={grn} storeId={storeId ?? ''} />
      ) : null}

      {/* Line items */}
      <div className="flex flex-col gap-3">
        <Eyebrow>LINE ITEMS</Eyebrow>
        {grn ? (
          <GrnItemsEditor grnId={id} editable={isDraft} />
        ) : (
          <Skeleton className="h-32" />
        )}
      </div>
    </div>
  );
}
