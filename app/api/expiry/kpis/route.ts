/**
 * GET /api/expiry/kpis — expiry KPIs (demo-aware, store-scoped).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getExpiryKpis } from '@/lib/api/clients/expiry';
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

interface ExpiryKpis {
  expiring7d: number;
  expiring30d: number;
  expired: number;
}

const EMPTY: ExpiryKpis = { expiring7d: 0, expiring30d: 0, expired: 0 };

function selectDemoExpiryKpis(ds: DemoDataset): ExpiryKpis {
  const kpis = (ds.regions.kpis as Array<{ label: string; value: number }> | undefined) ?? [];
  const calendar = (ds.regions.calendar as Array<{ count: number }> | undefined) ?? [];
  const pick = (m: RegExp) => kpis.find((k) => m.test(k.label))?.value ?? 0;
  return {
    expiring7d: pick(/Expiring in 7/i),
    expiring30d: calendar.reduce((sum, c) => sum + c.count, 0),
    expired: pick(/Expired/i),
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);

  return resolveToResponse<ExpiryKpis>(
    {
      area: 'expiry',
      region: 'kpis',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => getExpiryKpis(q.storeId) as Promise<ExpiryKpis>),
      selectDemo: selectDemoExpiryKpis,
      assertScope: noScopeAssertion,
    },
    EMPTY,
  );
}
