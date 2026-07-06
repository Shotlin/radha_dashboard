/**
 * GET /api/billing/plans — subscription plans (demo-aware).
 */
import { NextRequest, NextResponse } from 'next/server';
import { listPlans } from '@/lib/api/clients/subscriptions';
import { getSession } from '@/lib/auth/session';
import type { DemoDataset } from '@/lib/demo';
import {
  buildStoreScope,
  isDemoRequest,
  noScopeAssertion,
  resolveToResponse,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

interface PlansResponse {
  plans: unknown[];
}

function selectDemoPlans(ds: DemoDataset): PlansResponse {
  const rows = (ds.regions.plans as unknown[] | undefined) ?? [];
  return { plans: rows };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);

  return resolveToResponse<PlansResponse>(
    {
      area: 'billing',
      region: 'plans',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => listPlans() as Promise<PlansResponse>),
      selectDemo: selectDemoPlans,
      assertScope: noScopeAssertion,
    },
    { plans: [] },
  );
}
