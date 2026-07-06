'use client';
/**
 * features/expiry/components/add-record-panel.tsx
 * SidePanel form to add a new expiry record. Uses RHF + Zod.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SidePanel } from '@/components/ui/side-panel';
import { FormField, Input } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { qk } from '@/lib/api/query-keys';
import { addExpirySchema, type AddExpiryFormValues } from '../expiry.schema';

async function postExpiry(data: AddExpiryFormValues & { storeId: string }) {
  const res = await fetch('/api/expiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create expiry record');
  return res.json();
}

interface AddRecordPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
}

export function AddRecordPanel({ open, onOpenChange, storeId }: AddRecordPanelProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AddExpiryFormValues>({
    resolver: zodResolver(addExpirySchema),
    defaultValues: { ean: '', expiryDate: '', quantity: 1, batchNo: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: AddExpiryFormValues) => {
      if (!storeId) throw new Error('No store selected');
      return postExpiry({ ...values, storeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.expiry(storeId ?? '') });
      queryClient.invalidateQueries({ queryKey: qk.expiryKpis(storeId ?? '') });
      reset();
      onOpenChange(false);
    },
  });

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const onSubmit = (values: AddExpiryFormValues) => mutation.mutate(values);

  return (
    <SidePanel
      open={open}
      onOpenChange={handleClose}
      title="Add expiry record"
      description="Track a new item's expiry date for this store."
      isDirty={isDirty}
      footer={
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSubmit(onSubmit)}
          loading={mutation.isPending}
          disabled={mutation.isPending}
        >
          Save record
        </Button>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
        aria-label="Add expiry record"
      >
        <FormField
          label="EAN / Barcode"
          htmlFor="ean"
          required
          error={errors.ean?.message}
          hint="8–14 digit product barcode"
        >
          <Input
            id="ean"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 8901234567890"
            mono
            autoComplete="off"
            {...register('ean')}
          />
        </FormField>

        <FormField
          label="Expiry date"
          htmlFor="expiryDate"
          required
          error={errors.expiryDate?.message}
        >
          <Input
            id="expiryDate"
            type="date"
            mono
            {...register('expiryDate')}
          />
        </FormField>

        <FormField
          label="Quantity"
          htmlFor="quantity"
          required
          error={errors.quantity?.message}
        >
          <Input
            id="quantity"
            type="number"
            min={1}
            mono
            {...register('quantity', { valueAsNumber: true })}
          />
        </FormField>

        <FormField
          label="Batch number"
          htmlFor="batchNo"
          error={errors.batchNo?.message}
          hint="Optional — leave blank if not available"
        >
          <Input
            id="batchNo"
            type="text"
            placeholder="e.g. BATCH-001"
            mono
            {...register('batchNo')}
          />
        </FormField>

        {mutation.isError && (
          <p className="text-[12px] text-danger" role="alert">
            Failed to save. Please check your inputs and try again.
          </p>
        )}
      </form>
    </SidePanel>
  );
}
