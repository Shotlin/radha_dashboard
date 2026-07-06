'use client';
/**
 * billing-client.tsx — Client-side billing page logic.
 * Handles upgrade flow (plan picker → checkout → verify) and refund panel.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Modal } from '@/components/ui/modal';
import { CurrentPlan } from '@/features/billing/components/current-plan';
import { UsageCards } from '@/features/billing/components/usage-cards';
import { PlanPicker } from '@/features/billing/components/plan-picker';
import { Checkout } from '@/features/billing/components/checkout';
import { RefundPanel } from '@/features/billing/components/refund-panel';
import { useSubscription, usePlans, useUsage } from '@/features/billing/billing.queries';
import { upgradePlan } from '@/features/billing/billing.actions';
import { qk } from '@/lib/api/query-keys';
import type { CheckoutOrder } from '@/features/billing/billing.schema';

interface BillingClientProps {
  tenantId: string;
  role: string;
}

export function BillingClient({ tenantId, role }: BillingClientProps) {
  const [checkoutOrder, setCheckoutOrder] = useState<CheckoutOrder | null>(null);
  const [checkoutPlanName, setCheckoutPlanName] = useState('');
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const queryClient = useQueryClient();
  const subscriptionQuery = useSubscription(tenantId);
  const plansQuery = usePlans();
  const usageQuery = useUsage(tenantId);

  const isOwnerOrAdmin = role === 'owner' || role === 'admin';

  const upgradeMutation = useMutation({
    mutationFn: async ({ planId, planName }: { planId: string; planName: string }) => {
      setUpgradingPlanId(planId);
      setCheckoutPlanName(planName);
      const order = await upgradePlan(planId, tenantId);
      return order;
    },
    onSuccess: (order) => {
      setCheckoutOrder(order);
      setCheckoutError(null);
      setCheckoutSuccess(false);
      setShowCheckoutModal(true);
      setUpgradingPlanId(null);
    },
    onError: (err) => {
      setUpgradingPlanId(null);
      setCheckoutError(err instanceof Error ? err.message : 'Failed to create checkout');
    },
  });

  const handleUpgrade = (planId: string) => {
    const plan = plansQuery.data?.plans.find((p) => p.id === planId);
    void upgradeMutation.mutateAsync({ planId, planName: plan?.name ?? planId });
  };

  const handleCheckoutSuccess = () => {
    setCheckoutSuccess(true);
    void queryClient.invalidateQueries({ queryKey: qk.subscription(tenantId) });
    void queryClient.invalidateQueries({ queryKey: qk.usage(tenantId) });
    setTimeout(() => {
      setShowCheckoutModal(false);
      setCheckoutOrder(null);
    }, 2000);
  };

  const handleCheckoutError = (message: string) => {
    setCheckoutError(message);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ── Section: Current plan ───────────────────────────────────────── */}
      <section>
        <Eyebrow className="mb-3">CURRENT PLAN</Eyebrow>
        <CurrentPlan
          subscription={subscriptionQuery.data}
          tenantId={tenantId}
          isLoading={subscriptionQuery.isLoading}
          isError={subscriptionQuery.isError}
        />
      </section>

      {/* ── Section: Usage ──────────────────────────────────────────────── */}
      <section>
        <Eyebrow className="mb-3">USAGE</Eyebrow>
        <UsageCards
          usage={usageQuery.data}
          isLoading={usageQuery.isLoading}
          isError={usageQuery.isError}
        />
      </section>

      {/* ── Section: Plans ──────────────────────────────────────────────── */}
      <section>
        <Eyebrow className="mb-3">AVAILABLE PLANS</Eyebrow>
        {checkoutError && (
          <div className="mb-4 p-3 rounded-lg bg-[color:rgb(185_28_28_/_0.06)] border border-[color:rgb(185_28_28_/_0.2)] text-[13px] text-danger">
            {checkoutError}
          </div>
        )}
        <PlanPicker
          plans={plansQuery.data?.plans}
          currentSubscription={subscriptionQuery.data}
          isLoading={plansQuery.isLoading}
          onUpgrade={handleUpgrade}
          upgradingPlanId={upgradingPlanId}
        />
      </section>

      {/* ── Refund (admin/owner only) ────────────────────────────────────── */}
      {isOwnerOrAdmin && (
        <section>
          <Eyebrow className="mb-3">REFUNDS</Eyebrow>
          <div className="card p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[14px] font-semibold text-ink">Request a Refund</p>
              <p className="text-[13px] text-ink-soft mt-0.5">
                Admin/owner only. All refunds are audited.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="text-danger border-danger/30 hover:bg-danger/5 flex-shrink-0"
              onClick={() => setRefundOpen(true)}
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Refund
            </Button>
          </div>
        </section>
      )}

      {/* ── Checkout modal ───────────────────────────────────────────────── */}
      <Modal
        open={showCheckoutModal}
        onOpenChange={(open) => {
          if (!open) {
            setCheckoutOrder(null);
            setCheckoutError(null);
          }
          setShowCheckoutModal(open);
        }}
        title={checkoutSuccess ? 'Payment successful!' : `Upgrade to ${checkoutPlanName}`}
        description={
          checkoutSuccess
            ? 'Your plan has been upgraded. Changes take effect immediately.'
            : `Complete your payment to upgrade to the ${checkoutPlanName} plan.`
        }
      >
        {checkoutSuccess ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-12 h-12 rounded-full bg-[color:rgb(21_128_61_/_0.1)] flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-success" aria-hidden="true" />
            </div>
          </div>
        ) : checkoutOrder ? (
          <Checkout
            orderId={checkoutOrder.orderId}
            amount={checkoutOrder.amount}
            currency={checkoutOrder.currency}
            tenantId={tenantId}
            planName={checkoutPlanName}
            onSuccess={handleCheckoutSuccess}
            onError={handleCheckoutError}
            onCancel={() => setShowCheckoutModal(false)}
          />
        ) : (
          <div className="flex items-center justify-center py-6">
            <span
              className="inline-block h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin"
              aria-label="Loading"
            />
          </div>
        )}
      </Modal>

      {/* ── Refund panel ────────────────────────────────────────────────── */}
      <RefundPanel
        open={refundOpen}
        onOpenChange={setRefundOpen}
      />
    </div>
  );
}
