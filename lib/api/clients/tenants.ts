/**
 * lib/api/clients/tenants.ts — Tenant management endpoints (Doc 1 §6.2)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';

const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  plan: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export async function getTenant(tenantId: string) {
  return apiFetch(`/tenants/${tenantId}`, { schema: TenantSchema });
}

export async function updateTenant(tenantId: string, data: Partial<{ name: string; ownerName: string; phone: string; email: string }>) {
  return apiFetch(`/tenants/${tenantId}`, { method: 'PATCH', body: data, schema: TenantSchema });
}

export async function listTenants(params?: { search?: string; limit?: number; cursor?: string }) {
  return apiFetch('/tenants', {
    schema: z.object({ tenants: z.array(TenantSchema), total: z.number().optional() }),
    query: params,
  });
}
