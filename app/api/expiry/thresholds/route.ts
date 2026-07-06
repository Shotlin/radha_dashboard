/**
 * GET /api/expiry/thresholds — category thresholds (demo-aware, store-scoped).
 * PUT /api/expiry/thresholds — update thresholds.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getExpiryThresholds, updateExpiryThresholds } from '@/lib/api/clients/expiry';
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

interface ThresholdsResponse {
  thresholds: Array<{ category: string; warningDays: number }>;
}

function selectDemoThresholds(ds: DemoDataset): ThresholdsResponse {
  const rows = (ds.regions.thresholds as Array<{ category: string; warnDays: number }> | undefined) ?? [];
  return { thresholds: rows.map((r) => ({ category: r.category, warningDays: r.warnDays })) };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);

  return resolveToResponse<ThresholdsResponse>(
    {
      area: 'expiry',
      region: 'thresholds',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => getExpiryThresholds(q.storeId) as Promise<ThresholdsResponse>),
      selectDemo: selectDemoThresholds,
      assertScope: noScopeAssertion,
    },
    { thresholds: [] },
  );
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = (await req.json()) as { storeId: string; thresholds: Array<{ category: string; warningDays: number }> };
    const data = await updateExpiryThresholds(body.storeId, body.thresholds);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update thresholds' }, { status: 500 });
  }
}
