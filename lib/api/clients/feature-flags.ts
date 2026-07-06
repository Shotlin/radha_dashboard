/**
 * lib/api/clients/feature-flags.ts — Feature flag endpoints (Doc 1 §6.18)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';

const FeatureFlagSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  description: z.string().optional(),
});

export async function getFeatureFlags(tenantId?: string) {
  return apiFetch('/feature-flags', {
    schema: z.object({ flags: z.array(FeatureFlagSchema) }),
    query: tenantId ? { tenantId } : undefined,
  });
}

export async function isFeatureEnabled(key: string, tenantId?: string): Promise<boolean> {
  const { flags } = await getFeatureFlags(tenantId);
  return flags.find((f) => f.key === key)?.enabled ?? false;
}
