/**
 * GET /api/billing/usage — usage meters (demo-aware, tenant-scoped).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUsage } from '@/lib/api/clients/subscriptions';
import { getSession } from '@/lib/auth/session';
import type { DemoDataset } from '@/lib/demo';
import {
  buildStoreScope,
  isDemoRequest,
  noScopeAssertion,
  resolveToResponse,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

interface Usage {
  stores: number;
  users: number;
  scans: number;
  plan: string;
}

const EMPTY: Usage = { stores: 0, users: 0, scans: 0, plan: 'unknown' };

function selectDemoUsage(ds: DemoDataset): Usage {
  const meters = (ds.regions.usage as Array<{ metric: string; used: number }> | undefined) ?? [];
  const sub = (ds.regions.subscription as Array<{ storeId: string | null; plan: string }> | undefined) ?? [];
  const meter = (m: RegExp) => meters.find((x) => m.test(x.metric))?.used ?? 0;
  const plan = (sub.find((s) => s.storeId === null) ?? sub[0])?.plan ?? 'unknown';
  return {
    stores: meter(/Active stores/i),
    users: meter(/Team members/i),
    scans: meter(/Scans/i),
    plan,
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const tenantId = req.nextUrl.searchParams.get('tenantId') ?? session.user.tenantId;

  return resolveToResponse<Usage>(
    {
      area: 'billing',
      region: 'usage',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => getUsage(tenantId) as Promise<Usage>),
      selectDemo: selectDemoUsage,
      assertScope: noScopeAssertion,
    },
    EMPTY,
  );
}
