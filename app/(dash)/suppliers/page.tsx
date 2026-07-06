'use client';
/**
 * app/(dash)/suppliers/page.tsx — Suppliers list page (Phase 10).
 */
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { FilterBar } from '@/components/ui/filter-bar';
import { Eyebrow } from '@/components/ui/eyebrow';
import { usePermission } from '@/lib/auth/use-session';
import { PERMISSIONS } from '@/lib/permissions';
import { SuppliersTable } from '@/features/suppliers/components/suppliers-table';
import { SupplierCreatePanel } from '@/features/suppliers/components/supplier-create-panel';
import { ImportExport } from '@/features/suppliers/components/import-export';
import { useSuppliersList } from '@/features/suppliers/suppliers.queries';

const STATUS_SEGMENTS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function SuppliersPage() {
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const canManage = usePermission(PERMISSIONS.SUPPLIERS_MANAGE);
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const showManageActions = mounted && canManage;

  // Derive active filter
  const isActiveFilter =
    statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;

  const { data } = useSuppliersList({ search: search || undefined, isActive: isActiveFilter });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="PROCUREMENT"
        title="Suppliers"
        subtitle="Manage your supplier directory for GRN and procurement."
        primaryAction={
          showManageActions
            ? {
                label: 'Add Supplier',
                icon: Plus,
                onClick: () => setPanelOpen(true),
              }
            : undefined
        }
        secondaryActions={
          showManageActions && data?.items.length
            ? []
            : undefined
        }
      />

      {/* Filter bar + import/export */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Eyebrow>SUPPLIER DIRECTORY</Eyebrow>
          {showManageActions && (
            <ImportExport
              suppliers={data}
            />
          )}
        </div>

        <FilterBar
          segments={STATUS_SEGMENTS}
          activeSegment={statusFilter}
          onSegmentChange={setStatusFilter}
          searchPlaceholder="Search by name, phone…"
          onSearchChange={setSearch}
        />

        <SuppliersTable
          filters={{
            search: search || undefined,
            isActive: isActiveFilter,
          }}
          onRowClick={(supplier) => router.push(`/suppliers/${supplier.id}`)}
        />
      </div>

      {/* Create side panel */}
      <SupplierCreatePanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
      />
    </div>
  );
}
