/**
 * GET /api/inventory/low-stock — low-stock alerts (demo-aware, store-scoped).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLowStockAlerts } from '@/lib/api/clients/inventory';
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

interface ListResponse {
  items: unknown[];
  total: number;
}

function selectDemoLowStock(ds: DemoDataset): ListResponse {
  const rows = (ds.regions.lowStock as unknown[] | undefined) ?? [];
  return { items: rows, total: rows.length };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, request);
  const q = scopeQuery(scope);

  return resolveToResponse<ListResponse>(
    {
      area: 'inventory',
      region: 'lowStock',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => getLowStockAlerts(q.storeId) as Promise<ListResponse>),
      selectDemo: selectDemoLowStock,
      assertScope: noScopeAssertion,
    },
    { items: [], total: 0 },
  );
}
