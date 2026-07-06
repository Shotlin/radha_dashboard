'use server';
/**
 * features/analytics/analytics.actions.ts — Server Actions for analytics + leads.
 * convertLead and updateLeadStatus run server-side for auth and audit.
 */
import { convertLead as apiConvertLead } from '@/lib/api/clients/analytics';
import { apiFetch } from '@/lib/api/core/api-fetch';
import { z } from 'zod';
import { LeadSchema, UpdateLeadSchema } from './analytics.schema';

/* ── Convert lead ────────────────────────────────────────────────────────── */
export async function convertLead(leadId: string) {
  return apiConvertLead(leadId);
}

/* ── Update lead status + notes ─────────────────────────────────────────── */
export async function updateLeadStatus(leadId: string, data: z.infer<typeof UpdateLeadSchema>) {
  const validated = UpdateLeadSchema.parse(data);
  return apiFetch(`/marketing/leads/${leadId}`, {
    method: 'PATCH',
    body: validated,
    schema: LeadSchema,
  });
}
