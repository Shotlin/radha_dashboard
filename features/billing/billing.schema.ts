/**
 * features/billing/billing.schema.ts — Zod schemas for billing + payments.
 */
import { z } from 'zod';

/* ── Plan ────────────────────────────────────────────────────────────────── */
export const PlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceMonthly: z.number(),
  priceQuarterly: z.number().optional(),
  features: z.array(z.string()).optional(),
  isPopular: z.boolean().optional(),
  maxStores: z.number().optional(),
  maxUsers: z.number().optional(),
  maxScans: z.number().optional(),
});
export type Plan = z.infer<typeof PlanSchema>;

export const PlanListSchema = z.object({ plans: z.array(PlanSchema) });
export type PlanList = z.infer<typeof PlanListSchema>;

/* ── Subscription status ─────────────────────────────────────────────────── */
export const SubscriptionStatusSchema = z.enum([
  'trial',
  'active',
  'past_due',
  'cancelled',
  'expired',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

/* ── Subscription ────────────────────────────────────────────────────────── */
export const SubscriptionSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  plan: z.string(),
  status: SubscriptionStatusSchema,
  trialEndsAt: z.string().nullable().optional(),
  currentPeriodEnd: z.string().nullable().optional(),
  cancelledAt: z.string().nullable().optional(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

/* ── Usage ───────────────────────────────────────────────────────────────── */
export const UsageSchema = z.object({
  stores: z.number(),
  users: z.number(),
  scans: z.number(),
  plan: z.string(),
  storesLimit: z.number().optional(),
  usersLimit: z.number().optional(),
  scansLimit: z.number().optional(),
});
export type Usage = z.infer<typeof UsageSchema>;

/* ── Checkout order ──────────────────────────────────────────────────────── */
export const CheckoutOrderSchema = z.object({
  orderId: z.string(),
  amount: z.number(),
  currency: z.string(),
  key: z.string(),
});
export type CheckoutOrder = z.infer<typeof CheckoutOrderSchema>;

/* ── Verify payment input ────────────────────────────────────────────────── */
export const VerifyPaymentInputSchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  tenantId: z.string().min(1),
});
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentInputSchema>;

/* ── Refund input ────────────────────────────────────────────────────────── */
export const RefundInputSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.number().positive('Amount must be positive'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
});
export type RefundInput = z.infer<typeof RefundInputSchema>;

/* ── Refund result ───────────────────────────────────────────────────────── */
export const RefundResultSchema = z.object({
  ok: z.boolean(),
  refundId: z.string().optional(),
});
export type RefundResult = z.infer<typeof RefundResultSchema>;

/* ── Cancel / reactivate result ─────────────────────────────────────────── */
export const SubscriptionActionResultSchema = SubscriptionSchema;
export type SubscriptionActionResult = z.infer<typeof SubscriptionActionResultSchema>;
