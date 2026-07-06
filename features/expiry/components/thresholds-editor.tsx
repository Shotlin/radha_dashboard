'use client';
/**
 * features/expiry/components/thresholds-editor.tsx
 * SidePanel with per-category warning day inputs.
 * Gated to manager+ (permission: expiry:edit).
 */
import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Lock } from 'lucide-react';
import { SidePanel } from '@/components/ui/side-panel';
import { FormField, Input } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/states';
import { qk } from '@/lib/api/query-keys';
import { usePermission } from '@/lib/auth/use-session';
import { useExpiryThresholds } from '../expiry.queries';
import { thresholdsSchema, type ThresholdsFormValues } from '../expiry.schema';

interface ThresholdsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
}

async function saveThresholds(
  storeId: string,
  thresholds: Array<{ category: string; warningDays: number }>,
) {
  const res = await fetch('/api/expiry/thresholds', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ storeId, thresholds }),
  });
  if (!res.ok) throw new Error('Failed to save thresholds');
  return res.json();
}

export function ThresholdsEditor({ open, onOpenChange, storeId }: ThresholdsEditorProps) {
  const canEdit = usePermission('expiry:edit');
  const queryClient = useQueryClient();
  const { data, isLoading } = useExpiryThresholds(storeId);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ThresholdsFormValues>({
    resolver: zodResolver(thresholdsSchema),
    defaultValues: { thresholds: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'thresholds' });

  // Populate form when data loads
  useEffect(() => {
    if (data?.thresholds) {
      reset({ thresholds: data.thresholds });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: ThresholdsFormValues) => {
      if (!storeId) throw new Error('No store selected');
      return saveThresholds(storeId, values.thresholds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.expiryThresholds(storeId ?? '') });
      onOpenChange(false);
    },
  });

  const onSubmit = (values: ThresholdsFormValues) => mutation.mutate(values);

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Expiry Thresholds"
      description="Set the warning window (in days) for each product category."
      isDirty={isDirty}
      footer={
        canEdit ? (
          <Button
            variant="primary"
            className="w-full"
            onClick={handleSubmit(onSubmit)}
            loading={mutation.isPending}
            disabled={!isDirty || mutation.isPending}
          >
            Save thresholds
          </Button>
        ) : undefined
      }
    >
      {/* Permission gate */}
      {!canEdit && (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center">
            <Lock className="h-5 w-5 text-ink-soft" aria-hidden="true" />
          </div>
          <p className="text-[14px] text-ink-soft">
            You need manager or higher permissions to edit expiry thresholds.
          </p>
        </div>
      )}

      {canEdit && (
        <>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
              aria-label="Thresholds form"
            >
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-end gap-3">
                  <FormField
                    label="Category"
                    htmlFor={`thresholds.${idx}.category`}
                    error={errors.thresholds?.[idx]?.category?.message}
                    className="flex-1"
                  >
                    <Input
                      id={`thresholds.${idx}.category`}
                      placeholder="e.g. Dairy"
                      {...register(`thresholds.${idx}.category`)}
                    />
                  </FormField>
                  <FormField
                    label="Warning days"
                    htmlFor={`thresholds.${idx}.warningDays`}
                    error={errors.thresholds?.[idx]?.warningDays?.message}
                    className="w-32"
                  >
                    <Input
                      id={`thresholds.${idx}.warningDays`}
                      type="number"
                      min={1}
                      max={365}
                      mono
                      {...register(`thresholds.${idx}.warningDays`, { valueAsNumber: true })}
                    />
                  </FormField>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mb-0.5 p-2 text-ink-soft hover:text-danger"
                    onClick={() => remove(idx)}
                    aria-label={`Remove threshold for ${field.category}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}

              {errors.thresholds?.root?.message && (
                <p className="text-[12px] text-danger" role="alert">
                  {errors.thresholds.root.message}
                </p>
              )}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-fit"
                onClick={() => append({ category: '', warningDays: 7 })}
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                Add category
              </Button>

              {mutation.isError && (
                <p className="text-[12px] text-danger" role="alert">
                  Failed to save thresholds. Please try again.
                </p>
              )}
            </form>
          )}
        </>
      )}
    </SidePanel>
  );
}
