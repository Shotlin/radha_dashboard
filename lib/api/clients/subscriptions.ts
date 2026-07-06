/**
 * lib/api/clients/subscriptions.ts — Subscriptions & billing (Doc 1 §6.14, §7.5)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { SubscriptionSchema } from '../schemas/common';

const PlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceMonthly: z.number(),
  priceQuarterly: z.number().optional(),
  features: z.array(z.string()).optional(),
  isPopular: z.boolean().optional(),
});

export async function getSubscription(tenantId: string) {
  return apiFetch('/subscriptions/current', { schema: SubscriptionSchema, query: { tenantId } });
}

export async function listPlans() {
  return apiFetch('/subscriptions/plans', { schema: z.object({ plans: z.array(PlanSchema) }) });
}

export async function createCheckoutSession(planId: string, tenantId: string) {
  return apiFetch('/subscriptions/checkout', {
    method: 'POST',
    body: { planId, tenantId },
    schema: z.object({ orderId: z.string(), amount: z.number(), currency: z.string(), key: z.string() }),
  });
}

export async function verifyPayment(data: { razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string; tenantId: string }) {
  return apiFetch('/subscriptions/verify', { method: 'POST', body: data, schema: SubscriptionSchema });
}

export async function cancelSubscription(tenantId: string) {
  return apiFetch('/subscriptions/cancel', { method: 'POST', body: { tenantId }, schema: SubscriptionSchema });
}

export async function getUsage(tenantId: string) {
  return apiFetch('/subscriptions/usage', {
    schema: z.object({ stores: z.number(), users: z.number(), scans: z.number(), plan: z.string() }),
    query: { tenantId },
  });
}
