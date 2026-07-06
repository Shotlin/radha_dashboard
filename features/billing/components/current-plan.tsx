'use client';
/**
 * features/billing/components/current-plan.tsx
 * Current plan card: status chip (trial/active/expired), dates (mono), cancel/reactivate CTA.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CardSkeleton } from '@/components/ui/states';
import { cn } from '@/lib/utils';
import { qk } from '@/lib/api/query-keys';
import { cancelSubscriptionAction, reactivateSubscription } from '../billing.actions';
import type { Subscription, SubscriptionStatus } from '../billing.schema';

/* ── Status chip ─────────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { bg: string; border: string; text: string; label: string }
> = {
  trial: {
    bg: 'bg-[color:rgb(180_83_9_/_0.08)]',
    border: 'border-[color:rgb(180_83_9_/_0.35)]',
    text: 'text-warn',
    label: 'Trial',
  },
  active: {
    bg: 'bg-[color:rgb(21_128_61_/_0.08)]',
    border: 'border-[color:rgb(21_128_61_/_0.35)]',
    text: 'text-success',
    label: 'Active',
  },
  past_due: {
    bg: 'bg-[color:rgb(185_28_28_/_0.08)]',
    border: 'border-[color:rgb(185_28_28_/_0.35)]',
    text: 'text-danger',
    label: 'Past Due',
  },
  cancelled: {
    bg: 'bg-surface-sunken',
    border: 'border-hairline',
    text: 'text-ink-soft',
    label: 'Cancelled',
  },
  expired: {
    bg: 'bg-[color:rgb(185_28_28_/_0.08)]',
    border: 'border-[color:rgb(185_28_28_/_0.35)]',
    text: 'text-danger',
    label: 'Expired',
  },
};

function PlanStatusChip({ status }: { status: SubscriptionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      role="status"
      aria-label={cfg.label}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold border',
        cfg.bg,
        cfg.border,
        cfg.text,
      )}
    >
      {cfg.label}
    </span>
  );
}

/* ── Current plan card ────────────────────────────────────────────────────── */
interface CurrentPlanProps {
  subscription: Subscription | undefined;
  tenantId: string;
  isLoading?: boolean;
  isError?: boolean;
}

export function CurrentPlan({ subscription, tenantId, isLoading, isError }: CurrentPlanProps) {
  const [showCancel, setShowCancel] = useState(false);
  const [showReactivate, setShowReactivate] = useState(false);
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: () => cancelSubscriptionAction(tenantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.subscription(tenantId) });
      setShowCancel(false);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => reactivateSubscription(tenantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.subscription(tenantId) });
      setShowReactivate(false);
    },
  });

  if (isLoading) return <CardSkeleton className="h-[160px]" />;

  if (isError || !subscription) {
    return (
      <div className="card p-6 flex flex-col gap-2">
        <p className="text-danger text-[14px]">Failed to load subscription.</p>
      </div>
    );
  }

  const isCancelled = subscription.status === 'cancelled' || subscription.status === 'expired';
  const canCancel = subscription.status === 'active' || subscription.status === 'trial';

  const formatDate = (d: string | null | undefined) =>
    d
      ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

  return (
    <>
      <div className="card p-6 flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-tint flex items-center justify-center">
              <Package className="h-5 w-5 text-accent-deep" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
                Current Plan
              </p>
              <h3 className="text-[20px] font-extrabold text-ink capitalize">
                {subscription.plan}
              </h3>
            </div>
          </div>
          <PlanStatusChip status={subscription.status} />
        </div>

        {/* Dates row */}
        <div className="flex flex-wrap gap-4 text-[13px] text-ink-soft">
          {subscription.trialEndsAt && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-warn" aria-hidden="true" />
              Trial ends:{' '}
              <span className="font-mono text-ink">{formatDate(subscription.trialEndsAt)}</span>
            </span>
          )}
          {subscription.currentPeriodEnd && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              Period ends:{' '}
              <span className="font-mono text-ink">{formatDate(subscription.currentPeriodEnd)}</span>
            </span>
          )}
          {subscription.cancelledAt && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-danger" aria-hidden="true" />
              Cancelled:{' '}
              <span className="font-mono text-ink">{formatDate(subscription.cancelledAt)}</span>
            </span>
          )}
        </div>

        {/* CTA row */}
        <div className="flex gap-3 pt-1">
          {canCancel && (
            <Button
              variant="secondary"
              size="sm"
              className="text-danger border-danger/30 hover:bg-danger/5"
              onClick={() => setShowCancel(true)}
            >
              Cancel Plan
            </Button>
          )}
          {isCancelled && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowReactivate(true)}
            >
              Reactivate
            </Button>
          )}
        </div>
      </div>

      {/* Cancel confirm */}
      <Modal
        open={showCancel}
        onOpenChange={setShowCancel}
        title="Cancel Subscription"
        description="Your plan will remain active until the end of the current billing period. You can reactivate at any time."
        destructive
        primaryAction={{
          label: 'Cancel Plan',
          onClick: () => void cancelMutation.mutateAsync(),
          loading: cancelMutation.isPending,
        }}
        cancelLabel="Keep Plan"
      />

      {/* Reactivate confirm */}
      <Modal
        open={showReactivate}
        onOpenChange={setShowReactivate}
        title="Reactivate Subscription"
        description="Your plan will be reactivated and billing will resume."
        primaryAction={{
          label: 'Reactivate',
          onClick: () => void reactivateMutation.mutateAsync(),
          loading: reactivateMutation.isPending,
        }}
      />
    </>
  );
}
