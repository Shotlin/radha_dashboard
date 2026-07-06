/**
 * GET /api/billing/subscription — current subscription (demo-aware, tenant-scoped).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSubscription } from '@/lib/api/clients/subscriptions';
import { getSession } from '@/lib/auth/session';
import type { DemoDataset } from '@/lib/demo';
import type { StoreScope } from '@/lib/api/core/scope-types';
import {
  buildStoreScope,
  isDemoRequest,
  noScopeAssertion,
  resolveToResponse,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

interface Subscription {
  plan: string;
  status: string;
  renewsOn: string;
  amount: number;
}

function selectDemoSubscription(ds: DemoDataset, scope: StoreScope): Subscription | undefined {
  const rows =
    (ds.regions.subscription as Array<{ storeId: string | null; plan: string; status: string; renewsOn: string; amount: number }> | undefined) ?? [];
  const record = scope.storeId
    ? (rows.find((r) => r.storeId === scope.storeId) ?? rows.find((r) => r.storeId === null))
    : (rows.find((r) => r.storeId === null) ?? rows[0]);
  if (!record) return undefined;
  return { plan: record.plan, status: record.status, renewsOn: record.renewsOn, amount: record.amount };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const tenantId = req.nextUrl.searchParams.get('tenantId') ?? session.user.tenantId;

  return resolveToResponse<Subscription>(
    {
      area: 'billing',
      region: 'subscription',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => getSubscription(tenantId) as unknown as Promise<Subscription>),
      selectDemo: (ds) => selectDemoSubscription(ds, scope),
      assertScope: noScopeAssertion,
    },
    {},
  );
}
