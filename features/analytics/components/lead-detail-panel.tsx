'use client';
/**
 * features/analytics/components/lead-detail-panel.tsx
 * SidePanel: lead info, status update (PATCH), notes, "Convert to tenant" orange CTA (+ confirm).
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Phone, Globe, Calendar } from 'lucide-react';
import { SidePanel } from '@/components/ui/side-panel';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Skeleton } from '@/components/ui/states';
import { cn } from '@/lib/utils';
import { useLeadDetail, useUpdateLead, useConvertLead } from '../analytics.queries';
import {
  UpdateLeadSchema,
  LEAD_STATUSES,
  type UpdateLeadInput,
  type LeadStatus,
} from '../analytics.schema';

/* ── Status label config ─────────────────────────────────────────────────── */
const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted: 'Converted',
  lost: 'Lost',
};

interface LeadDetailPanelProps {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailPanel({ leadId, open, onOpenChange }: LeadDetailPanelProps) {
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);

  const { data: lead, isLoading, isError } = useLeadDetail(leadId);
  const updateLead = useUpdateLead();
  const convertLead = useConvertLead();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty, errors },
    reset,
  } = useForm<UpdateLeadInput>({
    resolver: zodResolver(UpdateLeadSchema),
    defaultValues: { status: lead?.status, notes: lead?.notes ?? '' },
  });

  // Keep form in sync with loaded data
  const currentStatus = watch('status');

  const onSubmit = async (data: UpdateLeadInput) => {
    if (!leadId) return;
    await updateLead.mutateAsync({ id: leadId, data });
    reset({ status: data.status, notes: data.notes });
  };

  const handleConvert = async () => {
    if (!leadId) return;
    await convertLead.mutateAsync(leadId);
    setShowConvertConfirm(false);
    onOpenChange(false);
  };

  return (
    <>
      <SidePanel
        open={open}
        onOpenChange={onOpenChange}
        title="Lead Details"
        description="Review, update, and convert this lead."
        isDirty={isDirty}
        footer={
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => void handleSubmit(onSubmit)()}
              loading={updateLead.isPending}
              disabled={!isDirty}
            >
              Save Changes
            </Button>
            {lead?.status !== 'converted' && (
              <Button
                variant="secondary"
                className="w-full border-accent text-accent hover:bg-accent-tint"
                onClick={() => setShowConvertConfirm(true)}
              >
                Convert to Tenant
              </Button>
            )}
          </div>
        }
      >
        {isLoading && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}
        {isError && (
          <p className="text-danger text-[14px]">Failed to load lead details.</p>
        )}
        {lead && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Lead info */}
            <div className="card p-4 flex flex-col gap-3">
              <h3 className="text-[17px] font-bold text-ink">{lead.name}</h3>
              <div className="flex flex-col gap-2 text-[13px] text-ink-soft">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  <span className="font-mono">{lead.email}</span>
                </span>
                {lead.phone && (
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    <span className="font-mono">{lead.phone}</span>
                  </span>
                )}
                {lead.source && (
                  <span className="inline-flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    {lead.source}
                  </span>
                )}
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  <span className="font-mono">
                    {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              </div>
            </div>

            {/* Status selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-soft">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {LEAD_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setValue('status', s, { shouldDirty: true });
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors',
                      currentStatus === s
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface-sunken text-ink-soft border-hairline hover:border-accent hover:text-accent',
                    )}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              {errors.status && (
                <p className="text-danger text-[12px]">{errors.status.message}</p>
              )}
            </div>

            {/* Notes */}
            <FormField
              label="Notes"
              error={errors.notes?.message}
            >
              <textarea
                {...register('notes')}
                rows={4}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-[14px] text-ink bg-surface border border-hairline',
                  'placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
                  'transition-shadow duration-150 resize-y',
                )}
                placeholder="Add notes about this lead…"
              />
            </FormField>
          </form>
        )}
      </SidePanel>

      {/* Convert confirm modal */}
      <Modal
        open={showConvertConfirm}
        onOpenChange={setShowConvertConfirm}
        title="Convert Lead to Tenant"
        description="This will create a new tenant account for this lead. The action is audited and cannot be undone."
        primaryAction={{
          label: 'Convert',
          onClick: () => void handleConvert(),
          loading: convertLead.isPending,
        }}
        cancelLabel="Cancel"
      />
    </>
  );
}
