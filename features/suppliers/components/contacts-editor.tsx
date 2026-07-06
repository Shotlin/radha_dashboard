'use client';
/**
 * features/suppliers/components/contacts-editor.tsx
 * Simple contacts list viewer. The backend SupplierSchema includes contactName+phone+email
 * at the top level. This component presents them in a clean editable card.
 * Full multi-contact CRUD requires additional backend endpoints.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Phone, Mail } from 'lucide-react';
import { FormField, Input } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { useUpdateSupplier } from '../suppliers.actions';
import type { Supplier } from '../suppliers.queries';

const contactSchema = z.object({
  contactName: z.string().max(100).optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});
type ContactValues = z.infer<typeof contactSchema>;

interface ContactsEditorProps {
  supplier: Supplier;
}

export function ContactsEditor({ supplier }: ContactsEditorProps) {
  const update = useUpdateSupplier(supplier.id);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contactName: supplier.contactName ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
    },
  });

  const onSubmit = (data: ContactValues) => {
    update.mutate({
      contactName: data.contactName || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
    });
  };

  return (
    <div className="card p-5 flex flex-col gap-4">
      <p className="text-[12px] font-semibold text-ink-soft uppercase tracking-wide">Contact Information</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <FormField label="Contact name" htmlFor="contact-name" error={errors.contactName?.message}>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" aria-hidden="true" />
            <Input
              id="contact-name"
              className="pl-9"
              placeholder="Contact person"
              {...register('contactName')}
            />
          </div>
        </FormField>
        <FormField label="Phone" htmlFor="contact-phone" error={errors.phone?.message}>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" aria-hidden="true" />
            <Input
              id="contact-phone"
              mono
              type="tel"
              className="pl-9"
              placeholder="+91 98765 43210"
              {...register('phone')}
            />
          </div>
        </FormField>
        <FormField label="Email" htmlFor="contact-email" error={errors.email?.message}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" aria-hidden="true" />
            <Input
              id="contact-email"
              type="email"
              className="pl-9"
              placeholder="email@supplier.com"
              {...register('email')}
            />
          </div>
        </FormField>
        {update.isError && (
          <p className="text-[13px] text-danger" role="alert">
            {(update.error as Error)?.message ?? 'Update failed.'}
          </p>
        )}
        {update.isSuccess && (
          <p className="text-[13px] text-success">Contact information updated.</p>
        )}
        <Button type="submit" variant="primary" size="sm" disabled={update.isPending || !isDirty}>
          {update.isPending ? 'Saving…' : 'Save Contact'}
        </Button>
      </form>
    </div>
  );
}
