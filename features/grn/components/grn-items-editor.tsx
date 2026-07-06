'use client';
/**
 * features/grn/components/grn-items-editor.tsx
 * Add/edit/delete GRN line items. Shown on the GRN detail page.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField, Input } from '@/components/ui/form-field';
import { Skeleton } from '@/components/ui/states';
import { cn } from '@/lib/utils';
import { useGrnItems, type GrnLineItem } from '../grn.queries';
import { useAddGrnLineItem, useRemoveGrnLineItem } from '../grn.actions';
import { addLineItemSchema, type AddLineItemFormValues } from '../grn.schema';

/* ── Add item form ───────────────────────────────────────────────────────── */
function AddItemForm({
  grnId,
  onAdded,
}: {
  grnId: string;
  onAdded: () => void;
}) {
  const mutation = useAddGrnLineItem(grnId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddLineItemFormValues>({ resolver: zodResolver(addLineItemSchema) });

  const onSubmit = (data: AddLineItemFormValues) => {
    mutation.mutate(data, { onSuccess: () => { reset(); onAdded(); } });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-surface-sunken rounded-lg border border-hairline"
      noValidate
    >
      <FormField label="EAN" htmlFor="item-ean" required error={errors.ean?.message}>
        <Input id="item-ean" mono placeholder="Barcode" {...register('ean')} />
      </FormField>
      <FormField label="Qty" htmlFor="item-qty" required error={errors.quantity?.message}>
        <Input
          id="item-qty"
          type="number"
          mono
          min={1}
          placeholder="0"
          {...register('quantity', { valueAsNumber: true })}
        />
      </FormField>
      <FormField label="Expiry date" htmlFor="item-expiry" error={errors.expiryDate?.message}>
        <Input id="item-expiry" type="date" {...register('expiryDate')} />
      </FormField>
      <FormField label="Batch #" htmlFor="item-batch" error={errors.batchNo?.message}>
        <Input id="item-batch" mono placeholder="Optional" {...register('batchNo')} />
      </FormField>
      <FormField
        label="Unit cost (₹)"
        htmlFor="item-cost"
        error={errors.unitCost?.message}
        className="sm:col-span-2"
      >
        <Input
          id="item-cost"
          type="number"
          mono
          min={0}
          step="0.01"
          placeholder="0.00"
          {...register('unitCost', { valueAsNumber: true })}
        />
      </FormField>
      <div className="sm:col-span-2 flex items-end">
        <Button type="submit" variant="primary" disabled={mutation.isPending} className="w-full">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {mutation.isPending ? 'Adding…' : 'Add Item'}
        </Button>
      </div>
      {mutation.isError && (
        <p className="col-span-full text-[12px] text-danger" role="alert">
          {(mutation.error as Error)?.message ?? 'Failed to add item.'}
        </p>
      )}
    </form>
  );
}

/* ── Item row ────────────────────────────────────────────────────────────── */
function ItemRow({
  item,
  grnId,
  editable,
}: {
  item: GrnLineItem;
  grnId: string;
  editable: boolean;
}) {
  const remove = useRemoveGrnLineItem(grnId);
  return (
    <tr className="border-t border-hairline hover:bg-surface-sunken/40 transition-colors">
      <td className="px-4 py-2.5 font-mono text-[13px] tabular-nums">{item.ean}</td>
      <td className="px-4 py-2.5 text-[13px]">{item.productName ?? '—'}</td>
      <td className="px-4 py-2.5 font-mono text-[13px] tabular-nums">{item.quantity}</td>
      <td className="px-4 py-2.5 font-mono text-[13px]">{item.expiryDate ?? '—'}</td>
      <td className="px-4 py-2.5 font-mono text-[13px]">{item.batchNo ?? '—'}</td>
      <td className="px-4 py-2.5 font-mono text-[13px]">
        {item.unitCost != null ? `₹${item.unitCost.toFixed(2)}` : '—'}
      </td>
      {editable && (
        <td className="px-4 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => remove.mutate(item.id)}
            disabled={remove.isPending}
            aria-label={`Remove item ${item.ean}`}
            className="text-danger hover:bg-[color:rgb(185_28_28_/_0.08)]"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </td>
      )}
    </tr>
  );
}

/* ── Main editor ─────────────────────────────────────────────────────────── */
interface GrnItemsEditorProps {
  grnId: string;
  editable?: boolean;
}

export function GrnItemsEditor({ grnId, editable = true }: GrnItemsEditorProps) {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useGrnItems(grnId);

  return (
    <div className="flex flex-col gap-4">
      {/* Add form toggle */}
      {editable && (
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-ink-soft">
            {data?.items.length ?? 0} item{data?.items.length !== 1 ? 's' : ''}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {showForm ? 'Cancel' : 'Add Item'}
          </Button>
        </div>
      )}

      {showForm && editable && (
        <AddItemForm grnId={grnId} onAdded={() => setShowForm(false)} />
      )}

      {/* Items table */}
      <div className="overflow-auto rounded-lg border border-hairline">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-surface-raised border-b border-hairline">
            <tr>
              {['EAN', 'Product', 'Qty', 'Expiry', 'Batch', 'Unit Cost', ...(editable ? [''] : [])].map((h) => (
                <th key={h} className="px-4 py-2.5 text-[11px] font-semibold text-ink-soft uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-t border-hairline">
                  {Array.from({ length: editable ? 7 : 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-2.5">
                      <Skeleton className="h-4" />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading && !data?.items.length && (
              <tr>
                <td
                  colSpan={editable ? 7 : 6}
                  className="px-4 py-8 text-center text-ink-soft text-[13px]"
                >
                  No items added yet.
                </td>
              </tr>
            )}
            {!isLoading &&
              data?.items.map((item) => (
                <ItemRow key={item.id} item={item} grnId={grnId} editable={editable} />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
