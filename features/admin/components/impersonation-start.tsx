'use client';
/**
 * features/admin/components/impersonation-start.tsx
 * Step-up confirm dialog: target user ID, reason → POST /admin/impersonate.
 * Shows a time-box warning before confirming.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField, Input } from '@/components/ui/form-field';
import { Modal } from '@/components/ui/modal';
import { useStartImpersonationMutation } from '../admin.actions';
import { StartImpersonationSchema, type StartImpersonationPayload } from '../admin.schema';

interface ImpersonationStartProps {
  onSuccess?: () => void;
}

export function ImpersonationStart({ onSuccess }: ImpersonationStartProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<StartImpersonationPayload | null>(null);
  const mutation = useStartImpersonationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StartImpersonationPayload>({
    resolver: zodResolver(StartImpersonationSchema),
  });

  function onSubmit(data: StartImpersonationPayload) {
    setPendingPayload(data);
    setConfirmOpen(true);
  }

  function handleConfirm() {
    if (!pendingPayload) return;
    mutation.mutate(pendingPayload, {
      onSuccess: () => {
        setConfirmOpen(false);
        reset();
        onSuccess?.();
      },
    });
  }

  return (
    <>
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          <h3 className="text-[15px] font-bold text-[var(--ink)]">Start Impersonation</h3>
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-3 p-3 mb-4 rounded-lg bg-[color:rgb(180_83_9_/_0.08)] border border-[color:rgb(180_83_9_/_0.25)]">
          <AlertTriangle className="h-4 w-4 text-[var(--warn)] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[13px] text-[var(--warn)]">
            Impersonation sessions are <strong>time-boxed and fully audited</strong>. All actions
            taken during impersonation are logged against your admin account. Use only when
            necessary for support purposes.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
          <FormField
            label="Target User ID / Tenant ID"
            htmlFor="targetUserId"
            required
            error={errors.targetUserId?.message}
            hint="Enter the UUID of the user or tenant to impersonate"
          >
            <Input
              id="targetUserId"
              mono
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              {...register('targetUserId')}
            />
          </FormField>

          <FormField
            label="Reason"
            htmlFor="reason"
            required
            error={errors.reason?.message}
            hint="Explain why impersonation is needed (e.g. 'Customer support ticket #1234')"
          >
            <textarea
              id="reason"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-[14px] text-[var(--ink)] bg-[var(--surface)] border border-[var(--hairline)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-none"
              placeholder="Describe the support reason..."
              {...register('reason')}
            />
          </FormField>

          {mutation.isError && (
            <p className="text-[13px] text-[var(--danger)]" role="alert">
              Failed to start impersonation. Please try again.
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm">
              Start impersonation
            </Button>
          </div>
        </form>
      </div>

      {/* Step-up confirm dialog */}
      <Modal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Impersonation"
        description={`You are about to impersonate user "${pendingPayload?.targetUserId ?? ''}". This action is audited and time-boxed. Are you sure?`}
        destructive
        primaryAction={{
          label: 'Confirm & start',
          onClick: handleConfirm,
          loading: mutation.isPending,
        }}
        cancelLabel="Cancel"
      >
        <div className="flex items-start gap-3 p-3 rounded-lg bg-[color:rgb(185_28_28_/_0.06)] border border-[color:rgb(185_28_28_/_0.2)]">
          <AlertTriangle className="h-4 w-4 text-[var(--danger)] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-[13px] text-[var(--ink)]">
            <p className="font-semibold mb-1">Session details</p>
            <p className="text-[var(--ink-soft)]">Target: <span className="font-mono text-[var(--ink)]">{pendingPayload?.targetUserId}</span></p>
            <p className="text-[var(--ink-soft)] mt-0.5">Reason: {pendingPayload?.reason}</p>
            <p className="mt-2 text-[var(--warn)]">⏱ Session will expire automatically (time-boxed).</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
