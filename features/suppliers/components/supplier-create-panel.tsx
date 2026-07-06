'use client';
/**
 * features/suppliers/components/supplier-create-panel.tsx
 * SidePanel with RHF+Zod form to create a new supplier.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SidePanel } from '@/components/ui/side-panel';
import { FormField, Input } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { useCreateSupplier } from '../suppliers.actions';
import { supplierFormSchema, type SupplierFormValues } from '../suppliers.schema';

interface SupplierCreatePanelProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export function SupplierCreatePanel({
  open,
  onOpenChange,
  onCreated,
}: SupplierCreatePanelProps) {
  const create = useCreateSupplier();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SupplierFormValues>({ resolver: zodResolver(supplierFormSchema) });

  const onSubmit = (data: SupplierFormValues) => {
    create.mutate(
      {
        ...data,
        phone: data.phone || undefined,
        email: data.email || undefined,
      },
      {
        onSuccess: () => {
          reset();
          onCreated?.();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Add Supplier"
      description="Create a new supplier for your GRN workflow."
      isDirty={isDirty}
      footer={
        <Button
          type="submit"
          form="supplier-create-form"
          variant="primary"
          disabled={create.isPending}
          className="w-full"
        >
          {create.isPending ? 'Creating…' : 'Create Supplier'}
        </Button>
      }
    >
      <form
        id="supplier-create-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <FormField label="Supplier name" htmlFor="sup-name" required error={errors.name?.message}>
          <Input id="sup-name" placeholder="e.g. Shree Traders" {...register('name')} />
        </FormField>
        <FormField label="Contact name" htmlFor="sup-contact" error={errors.contactName?.message}>
          <Input id="sup-contact" placeholder="e.g. Ramesh Patel" {...register('contactName')} />
        </FormField>
        <FormField label="Phone" htmlFor="sup-phone" error={errors.phone?.message}>
          <Input id="sup-phone" mono type="tel" placeholder="+91 98765 43210" {...register('phone')} />
        </FormField>
        <FormField label="Email" htmlFor="sup-email" error={errors.email?.message}>
          <Input id="sup-email" type="email" placeholder="supplier@example.com" {...register('email')} />
        </FormField>
        <FormField label="Address" htmlFor="sup-address" error={errors.address?.message}>
          <Input id="sup-address" placeholder="Full address" {...register('address')} />
        </FormField>
        {create.isError && (
          <p className="text-[13px] text-danger" role="alert">
            {(create.error as Error)?.message ?? 'Failed to create supplier.'}
          </p>
        )}
      </form>
    </SidePanel>
  );
}
