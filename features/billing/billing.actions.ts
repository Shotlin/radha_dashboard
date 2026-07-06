'use server';
/**
 * features/billing/billing.actions.ts — Server Actions for billing mutations.
 * Payment verification ALWAYS happens server-side via /api/billing/verify.
 */
import {
  cancelSubscription as apiCancel,
  createCheckoutSession,
  verifyPayment as apiVerify,
} from '@/lib/api/clients/subscriptions';
import { apiFetch } from '@/lib/api/core/api-fetch';
import { SubscriptionSchema, RefundResultSchema, VerifyPaymentInputSchema } from './billing.schema';
import { z } from 'zod';

/* ── Upgrade plan — creates checkout order ──────────────────────────────── */
export async function upgradePlan(planId: string, tenantId: string) {
  return createCheckoutSession(planId, tenantId);
}

/* ── Cancel subscription ─────────────────────────────────────────────────── */
export async function cancelSubscriptionAction(tenantId: string) {
  return apiCancel(tenantId);
}

/* ── Reactivate subscription ─────────────────────────────────────────────── */
export async function reactivateSubscription(tenantId: string) {
  return apiFetch('/subscriptions/reactivate', {
    method: 'POST',
    body: { tenantId },
    schema: SubscriptionSchema,
  });
}

/* ── Create checkout (create order server-side) ─────────────────────────── */
export async function createCheckout(planId: string, tenantId: string) {
  return createCheckoutSession(planId, tenantId);
}

/**
 * verifyPayment — called from the /api/billing/verify Route Handler.
 * This should NOT be called directly from client code.
 */
export async function verifyPayment(data: z.infer<typeof VerifyPaymentInputSchema>) {
  const validated = VerifyPaymentInputSchema.parse(data);
  return apiVerify(validated);
}

/* ── Request refund (admin/owner only, audited) ─────────────────────────── */
export async function requestRefund(data: {
  paymentId: string;
  amount: number;
  reason: string;
}) {
  return apiFetch('/payments/refund', {
    method: 'POST',
    body: data,
    schema: RefundResultSchema,
  });
}
