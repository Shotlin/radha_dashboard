/**
 * GET /api/analytics/tenant-activity — tenant activity (demo-aware).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getTenantActivity } from '@/lib/api/clients/analytics';
import { getSession } from '@/lib/auth/session';
import type { DemoDataset } from '@/lib/demo';
import {
  buildStoreScope,
  isDemoRequest,
  noScopeAssertion,
  resolveToResponse,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

interface TenantActivity {
  activeUsers: number;
  scans: number;
  tasksCompleted: number;
  series: Array<{ week: string; value: number }>;
}

const EMPTY: TenantActivity = { activeUsers: 0, scans: 0, tasksCompleted: 0, series: [] };

function selectDemoTenantActivity(ds: DemoDataset): TenantActivity {
  const kpis = (ds.regions.kpis as Array<{ label: string; value: number }> | undefined) ?? [];
  const trends = (ds.regions.scanTrends as Array<{ week: string; scans: number }> | undefined) ?? [];
  const scans = kpis.find((k) => /Scans/i.test(k.label))?.value ?? 0;
  return {
    activeUsers: 0,
    scans,
    tasksCompleted: 0,
    series: trends.map((t) => ({ week: t.week, value: t.scans })),
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? session.user.tenantId;
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  return resolveToResponse<TenantActivity>(
    {
      area: 'analytics',
      region: 'scanTrends',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => getTenantActivity(tenantId, from, to) as unknown as Promise<TenantActivity>),
      selectDemo: selectDemoTenantActivity,
      assertScope: noScopeAssertion,
    },
    EMPTY,
  );
}
