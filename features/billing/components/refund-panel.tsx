'use client';
/**
 * features/billing/components/refund-panel.tsx
 * Admin/owner only SidePanel: step-up confirm (reason + amount), POST to refund endpoint.
 * Doc 3 §B.7: refund is gated + step-up confirm + audited.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { SidePanel } from '@/components/ui/side-panel';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { FormField, Input } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';
import { RefundInputSchema, type RefundInput } from '../billing.schema';
import { requestRefund } from '../billing.actions';

interface RefundPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId?: string;
  maxAmount?: number;
}

export function RefundPanel({ open, onOpenChange, paymentId = '', maxAmount }: RefundPanelProps) {
  const [showStepUp, setShowStepUp] = useState(false);
  const [pendingData, setPendingData] = useState<RefundInput | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<RefundInput>({
    resolver: zodResolver(RefundInputSchema),
    defaultValues: { paymentId, amount: 0, reason: '' },
  });

  const refundMutation = useMutation({
    mutationFn: (data: RefundInput) => requestRefund(data),
    onSuccess: () => {
      setSuccess(true);
      setShowStepUp(false);
      setPendingData(null);
      reset();
    },
  });

  const onSubmit = (data: RefundInput) => {
    // Step-up: show confirm modal before executing
    setPendingData(data);
    setShowStepUp(true);
  };

  const confirmRefund = () => {
    if (!pendingData) return;
    void refundMutation.mutateAsync(pendingData);
  };

  return (
    <>
      <SidePanel
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            reset();
            setSuccess(false);
          }
          onOpenChange(next);
        }}
        title="Refund Payment"
        description="Admin/owner only. This action is audited."
        isDirty={isDirty}
        footer={
          <Button
            variant="danger"
            className="w-full"
            onClick={handleSubmit(onSubmit)}
            loading={refundMutation.isPending}
            disabled={success}
          >
            Request Refund
          </Button>
        }
      >
        {success ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-[color:rgb(21_128_61_/_0.1)] flex items-center justify-center">
              <span className="text-success text-xl">✓</span>
            </div>
            <p className="text-[17px] font-bold text-ink">Refund initiated</p>
            <p className="text-[13px] text-ink-soft">The refund request has been submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Warning banner */}
            <div className={cn(
              'flex items-start gap-3 p-4 rounded-lg',
              'bg-[color:rgb(185_28_28_/_0.06)] border border-[color:rgb(185_28_28_/_0.2)]',
            )}>
              <AlertTriangle className="h-4 w-4 text-danger mt-0.5 flex-shrink-0" aria-hidden="true" />
              <p className="text-[13px] text-danger">
                Refunds are irreversible. This action will be logged for audit.
              </p>
            </div>

            {/* Payment ID */}
            <FormField label="Payment ID" htmlFor="paymentId" required error={errors.paymentId?.message}>
              <Input
                id="paymentId"
                mono
                {...register('paymentId')}
                placeholder="pay_xxxxxxxxxxxxx"
              />
            </FormField>

            {/* Amount */}
            <FormField
              label="Refund Amount (₹)"
              htmlFor="amount"
              required
              error={errors.amount?.message}
              hint={maxAmount !== undefined ? `Maximum: ₹${maxAmount}` : undefined}
            >
              <Input
                id="amount"
                type="number"
                mono
                min={0}
                max={maxAmount}
                step={0.01}
                {...register('amount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </FormField>

            {/* Reason */}
            <FormField label="Reason" htmlFor="reason" required error={errors.reason?.message}>
              <textarea
                id="reason"
                {...register('reason')}
                rows={4}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-[14px] text-ink bg-surface border border-hairline',
                  'placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
                  'transition-shadow duration-150 resize-y',
                )}
                placeholder="Reason for refund (required for audit)…"
              />
            </FormField>
          </form>
        )}
      </SidePanel>

      {/* Step-up confirm modal */}
      <Modal
        open={showStepUp}
        onOpenChange={setShowStepUp}
        title="Confirm Refund"
        description={
          pendingData
            ? `You are about to refund ₹${pendingData.amount} for payment ${pendingData.paymentId}. Reason: "${pendingData.reason}". This cannot be undone.`
            : 'Confirm this refund?'
        }
        destructive
        primaryAction={{
          label: 'Confirm Refund',
          onClick: confirmRefund,
          loading: refundMutation.isPending,
        }}
        cancelLabel="Go Back"
      />
    </>
  );
}
