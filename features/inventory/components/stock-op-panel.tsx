'use client';
/**
 * features/inventory/components/stock-op-panel.tsx
 * SidePanel with Stock In / Stock Out / Adjust tabs. Permission-gated (inventory:edit).
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SidePanel } from '@/components/ui/side-panel';
import { FormField, Input } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/ui/filter-bar';
import { usePermission } from '@/lib/auth/use-session';
import { PERMISSIONS } from '@/lib/permissions';
import { useStockIn, useStockOut, useAdjustStock } from '../inventory.actions';
import {
  stockInSchema,
  stockOutSchema,
  adjustStockSchema,
  type StockInFormValues,
  type StockOutFormValues,
  type AdjustStockFormValues,
} from '../inventory.schema';

type Tab = 'in' | 'out' | 'adjust';

const TABS = [
  { value: 'in', label: 'Stock In' },
  { value: 'out', label: 'Stock Out' },
  { value: 'adjust', label: 'Adjust' },
];

/* ── Stock In Form ───────────────────────────────────────────────────────── */
function StockInForm({ storeId, onSuccess }: { storeId: string; onSuccess: () => void }) {
  const mutation = useStockIn(storeId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockInFormValues>({ resolver: zodResolver(stockInSchema) });

  const onSubmit = (data: StockInFormValues) => {
    mutation.mutate(data, {
      onSuccess: () => { reset(); onSuccess(); },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormField label="EAN / Barcode" htmlFor="in-ean" required error={errors.ean?.message}>
        <Input id="in-ean" mono placeholder="e.g. 8901234567890" {...register('ean')} />
      </FormField>
      <FormField label="Quantity" htmlFor="in-qty" required error={errors.quantity?.message}>
        <Input
          id="in-qty"
          type="number"
          mono
          min={1}
          placeholder="0"
          {...register('quantity', { valueAsNumber: true })}
        />
      </FormField>
      <FormField label="Reason (optional)" htmlFor="in-reason" error={errors.reason?.message}>
        <Input id="in-reason" placeholder="e.g. GRN receipt" {...register('reason')} />
      </FormField>
      {mutation.isError && (
        <p className="text-[13px] text-danger" role="alert">
          {(mutation.error as Error)?.message ?? 'Stock in failed.'}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Recording…' : 'Record Stock In'}
      </Button>
    </form>
  );
}

/* ── Stock Out Form ──────────────────────────────────────────────────────── */
function StockOutForm({ storeId, onSuccess }: { storeId: string; onSuccess: () => void }) {
  const mutation = useStockOut(storeId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockOutFormValues>({ resolver: zodResolver(stockOutSchema) });

  const onSubmit = (data: StockOutFormValues) => {
    mutation.mutate(data, {
      onSuccess: () => { reset(); onSuccess(); },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormField label="EAN / Barcode" htmlFor="out-ean" required error={errors.ean?.message}>
        <Input id="out-ean" mono placeholder="e.g. 8901234567890" {...register('ean')} />
      </FormField>
      <FormField label="Quantity" htmlFor="out-qty" required error={errors.quantity?.message}>
        <Input
          id="out-qty"
          type="number"
          mono
          min={1}
          placeholder="0"
          {...register('quantity', { valueAsNumber: true })}
        />
      </FormField>
      <FormField label="Reason (optional)" htmlFor="out-reason" error={errors.reason?.message}>
        <Input id="out-reason" placeholder="e.g. Damaged goods" {...register('reason')} />
      </FormField>
      {mutation.isError && (
        <p className="text-[13px] text-danger" role="alert">
          {(mutation.error as Error)?.message ?? 'Stock out failed.'}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Recording…' : 'Record Stock Out'}
      </Button>
    </form>
  );
}

/* ── Adjust Stock Form ───────────────────────────────────────────────────── */
function AdjustStockForm({ storeId, onSuccess }: { storeId: string; onSuccess: () => void }) {
  const mutation = useAdjustStock(storeId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustStockFormValues>({ resolver: zodResolver(adjustStockSchema) });

  const onSubmit = (data: AdjustStockFormValues) => {
    mutation.mutate(data, {
      onSuccess: () => { reset(); onSuccess(); },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormField label="EAN / Barcode" htmlFor="adj-ean" required error={errors.ean?.message}>
        <Input id="adj-ean" mono placeholder="e.g. 8901234567890" {...register('ean')} />
      </FormField>
      <FormField
        label="New quantity (absolute)"
        htmlFor="adj-qty"
        required
        error={errors.quantity?.message}
        hint="Enter the corrected stock level as an absolute number."
      >
        <Input
          id="adj-qty"
          type="number"
          mono
          placeholder="0"
          {...register('quantity', { valueAsNumber: true })}
        />
      </FormField>
      <FormField label="Reason" htmlFor="adj-reason" required error={errors.reason?.message}>
        <Input id="adj-reason" placeholder="e.g. Stock count correction" {...register('reason')} />
      </FormField>
      {mutation.isError && (
        <p className="text-[13px] text-danger" role="alert">
          {(mutation.error as Error)?.message ?? 'Adjustment failed.'}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : 'Save Adjustment'}
      </Button>
    </form>
  );
}

/* ── Main panel ──────────────────────────────────────────────────────────── */
interface StockOpPanelProps {
  storeId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function StockOpPanel({ storeId, open, onOpenChange }: StockOpPanelProps) {
  const [tab, setTab] = useState<Tab>('in');
  const canEdit = usePermission(PERMISSIONS.INVENTORY_EDIT);

  const handleSuccess = () => onOpenChange(false);

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Stock Operation"
      description="Record a stock in, out, or adjustment for your store."
    >
      {!canEdit ? (
        <p className="text-[14px] text-ink-soft py-8 text-center">
          You do not have permission to perform stock operations.
        </p>
      ) : !storeId ? (
        <p className="text-[14px] text-ink-soft py-8 text-center">
          Select a store to perform stock operations.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <FilterBar
            segments={TABS}
            activeSegment={tab}
            onSegmentChange={(v) => setTab(v as Tab)}
          />
          {tab === 'in' && <StockInForm storeId={storeId} onSuccess={handleSuccess} />}
          {tab === 'out' && <StockOutForm storeId={storeId} onSuccess={handleSuccess} />}
          {tab === 'adjust' && <AdjustStockForm storeId={storeId} onSuccess={handleSuccess} />}
        </div>
      )}
    </SidePanel>
  );
}
