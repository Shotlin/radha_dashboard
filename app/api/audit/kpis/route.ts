/**
 * GET /api/audit/kpis — EAN audit KPIs.
 *
 * Demo data from the Demo_Data_Provider (R1.6); active store forwarded via the
 * client (session tenant carried by the Bearer token — R8.1, R8.3); the backend
 * call is bounded by a 30s AbortController (R10.2).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getEanAuditKpis } from '@/lib/api/clients/ean-lists';
import { getSession } from '@/lib/auth/session';
import { getDemoDataset } from '@/lib/demo';
import type { DemoDataset } from '@/lib/demo';
import type { StoreScope } from '@/lib/api/core/scope-types';
import {
  buildStoreScope,
  isDemoRequest,
  noScopeAssertion,
  resolveToResponse,
  scopeQuery,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

interface AuditKpis {
  matchRate: number;
  activeLists: number;
  totalScans: number;
}

const EMPTY: AuditKpis = { matchRate: 0, activeLists: 0, totalScans: 0 };

function selectDemoAuditKpis(ds: DemoDataset, scope: StoreScope): AuditKpis {
  const kpis = (ds.regions.matchRateKpi as Array<{ storeId: string | null; matchRate: number; scanned: number }> | undefined) ?? [];
  const record = scope.storeId
    ? (kpis.find((k) => k.storeId === scope.storeId) ?? kpis[0])
    : (kpis.find((k) => k.storeId === null) ?? kpis[0]);
  const lists = (ds.regions.eanLists as unknown[] | undefined) ?? [];
  return { matchRate: record?.matchRate ?? 0, activeLists: lists.length, totalScans: record?.scanned ?? 0 };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);

  return resolveToResponse<AuditKpis>(
    {
      area: 'audit',
      region: 'matchRateKpi',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => getEanAuditKpis(q.storeId) as Promise<AuditKpis>),
      selectDemo: (ds) => selectDemoAuditKpis(ds, scope),
      assertScope: noScopeAssertion,
    },
    EMPTY,
  );
}
