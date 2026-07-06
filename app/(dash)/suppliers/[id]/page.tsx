'use client';
/**
 * app/(dash)/suppliers/[id]/page.tsx — Supplier detail page (Phase 10).
 */
import { use } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Eyebrow } from '@/components/ui/eyebrow';
import { usePermission } from '@/lib/auth/use-session';
import { PERMISSIONS } from '@/lib/permissions';
import { SupplierDetail } from '@/features/suppliers/components/supplier-detail';
import { ContactsEditor } from '@/features/suppliers/components/contacts-editor';
import { StatusActions } from '@/features/suppliers/components/status-actions';
import { useSupplierDetail } from '@/features/suppliers/suppliers.queries';
import { Skeleton } from '@/components/ui/states';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SupplierDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const canManage = usePermission(PERMISSIONS.SUPPLIERS_MANAGE);
  const { data: supplier, isLoading } = useSupplierDetail(id);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-soft" aria-label="Breadcrumb">
        <Link href="/suppliers" className="hover:text-ink transition-colors">
          Suppliers
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-ink-soft" aria-hidden="true" />
        <span className="text-ink font-semibold">
          {isLoading ? '…' : supplier?.name ?? id.slice(0, 8)}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Eyebrow>SUPPLIER</Eyebrow>
          <h1 className="text-[24px] font-extrabold text-ink mt-0.5">
            {isLoading ? <Skeleton className="h-8 w-48" /> : supplier?.name ?? 'Unknown Supplier'}
          </h1>
        </div>
        {canManage && supplier && (
          <StatusActions supplierId={id} isActive={supplier.isActive} />
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: info + performance */}
        <div className="lg:col-span-2">
          <SupplierDetail id={id} />
        </div>

        {/* Right: contacts editor */}
        {canManage && supplier && (
          <div>
            <ContactsEditor supplier={supplier} />
          </div>
        )}
      </div>
    </div>
  );
}
