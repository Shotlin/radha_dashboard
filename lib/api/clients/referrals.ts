/**
 * lib/api/clients/referrals.ts — Referrals endpoints
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';

export async function getReferralCode(tenantId: string) {
  return apiFetch('/referrals/code', {
    schema: z.object({ code: z.string(), usageCount: z.number() }),
    query: { tenantId },
  });
}

export async function listReferralHistory(tenantId: string) {
  return apiFetch('/referrals/history', {
    schema: z.object({ referrals: z.array(z.object({ id: z.string(), referredTenantId: z.string(), createdAt: z.string() })) }),
    query: { tenantId },
  });
}
