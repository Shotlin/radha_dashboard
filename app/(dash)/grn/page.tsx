'use client';
/**
 * app/(dash)/grn/page.tsx — GRN list page (Phase 09).
 */
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/ui/page-header';
import { FilterBar } from '@/components/ui/filter-bar';
import { SidePanel } from '@/components/ui/side-panel';
import { FormField, Input } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { useStoreScope } from '@/lib/hooks/use-store-scope';
import { usePermission } from '@/lib/auth/use-session';
import { PERMISSIONS } from '@/lib/permissions';
import { GrnStats } from '@/features/grn/components/grn-stats';
import { GrnTable } from '@/features/grn/components/grn-table';
import { useCreateGrn } from '@/features/grn/grn.actions';
import { createGrnSchema, type CreateGrnFormValues } from '@/features/grn/grn.schema';

const STATUS_SEGMENTS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'partial', label: 'Partial' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function GrnPage() {
  const { storeId } = useStoreScope();
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const canCreate = usePermission(PERMISSIONS.GRN_CREATE);
  // Stable initial value prevents SSR/client structural mismatch
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const showCreate = mounted && canCreate;

  const createGrn = useCreateGrn(storeId ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGrnFormValues>({
    resolver: zodResolver(createGrnSchema),
  });

  const onSubmit = (data: CreateGrnFormValues) => {
    if (!storeId) return;
    createGrn.mutate(data, {
      onSuccess: (created) => {
        reset();
        setPanelOpen(false);
        const grn = created as { id?: string };
        if (grn?.id) router.push(`/grn/${grn.id}`);
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="INVENTORY"
        title="Goods Received Notes"
        subtitle="Track inward stock receipts from suppliers."
        primaryAction={
          showCreate
            ? {
                label: 'New GRN',
                icon: Plus,
                onClick: () => setPanelOpen(true),
              }
            : undefined
        }
      />

      {/* KPI strip */}
      <GrnStats storeId={storeId} />

      {/* Filter bar + table */}
      <div className="flex flex-col gap-4">
        <Eyebrow>GRN RECORDS</Eyebrow>
        <FilterBar
          segments={STATUS_SEGMENTS}
          activeSegment={status}
          onSegmentChange={setStatus}
          searchPlaceholder="Search invoice #…"
          onSearchChange={setSearch}
        />
        <GrnTable storeId={storeId} filters={{ status, supplierId: undefined }} />
      </div>

      {/* Create GRN side panel */}
      <SidePanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        title="New GRN"
        description="Create a new Goods Received Note."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <FormField label="Invoice number (optional)" htmlFor="grn-invoice" error={errors.invoiceNo?.message}>
            <Input id="grn-invoice" mono placeholder="e.g. INV-2024-001" {...register('invoiceNo')} />
          </FormField>
          <FormField
            label="Supplier ID (optional)"
            htmlFor="grn-supplier"
            error={errors.supplierId?.message}
            hint="You can add the supplier from the Suppliers page."
          >
            <Input id="grn-supplier" mono placeholder="UUID" {...register('supplierId')} />
          </FormField>

          {createGrn.isError && (
            <p className="text-[13px] text-danger" role="alert">
              {(createGrn.error as Error)?.message ?? 'Failed to create GRN.'}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={createGrn.isPending || !storeId}>
            {createGrn.isPending ? 'Creating…' : 'Create GRN'}
          </Button>
        </form>
      </SidePanel>
    </div>
  );
}
