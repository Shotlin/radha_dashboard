/**
 * GET /api/grn/kpis — GRN KPIs (demo-aware, store-scoped).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getGrnKpis } from '@/lib/api/clients/grn';
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

interface GrnKpis {
  pendingCount: number;
  receivedThisMonth: number;
}

const EMPTY: GrnKpis = { pendingCount: 0, receivedThisMonth: 0 };

function selectDemoGrnKpis(ds: DemoDataset): GrnKpis {
  const kpis = (ds.regions.kpis as Array<{ label: string; value: number }> | undefined) ?? [];
  const pick = (m: RegExp) => kpis.find((k) => m.test(k.label))?.value ?? 0;
  return { pendingCount: pick(/Pending/i), receivedThisMonth: pick(/Received/i) };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, request);
  const q = scopeQuery(scope);

  return resolveToResponse<GrnKpis>(
    {
      area: 'grn',
      region: 'kpis',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => getGrnKpis(q.storeId) as Promise<GrnKpis>),
      selectDemo: selectDemoGrnKpis,
      assertScope: noScopeAssertion,
    },
    EMPTY,
  );
}
