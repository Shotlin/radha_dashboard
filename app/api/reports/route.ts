/**
 * GET /api/reports — list report jobs (demo-aware, store-scoped).
 */
import { NextRequest, NextResponse } from 'next/server';
import { listReportJobs } from '@/lib/api/clients/reports';
import { getSession } from '@/lib/auth/session';
import type { DemoDataset } from '@/lib/demo';
import {
  buildStoreScope,
  isDemoRequest,
  noScopeAssertion,
  resolveToResponse,
  scopeQuery,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

interface ReportsResponse {
  items: unknown[];
}

function selectDemoReports(ds: DemoDataset): ReportsResponse {
  const rows = (ds.regions.recent as unknown[] | undefined) ?? [];
  return { items: rows };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);

  return resolveToResponse<ReportsResponse>(
    {
      area: 'reports',
      region: 'recent',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => listReportJobs(q.storeId) as Promise<ReportsResponse>),
      selectDemo: selectDemoReports,
      assertScope: noScopeAssertion,
    },
    { items: [] },
  );
}
