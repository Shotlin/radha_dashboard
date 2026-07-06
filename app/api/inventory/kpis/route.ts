/**
 * GET /api/inventory/kpis — inventory KPIs (demo-aware, store-scoped).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getInventoryKpis } from '@/lib/api/clients/inventory';
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

interface InventoryKpis {
  totalSkus: number;
  lowStockCount: number;
  outOfStockCount: number;
}

const EMPTY: InventoryKpis = { totalSkus: 0, lowStockCount: 0, outOfStockCount: 0 };

function selectDemoInventoryKpis(ds: DemoDataset): InventoryKpis {
  const kpis = (ds.regions.kpis as Array<{ label: string; value: number }> | undefined) ?? [];
  const lowStock = (ds.regions.lowStock as unknown[] | undefined) ?? [];
  const pick = (m: RegExp) => kpis.find((k) => m.test(k.label))?.value ?? 0;
  return {
    totalSkus: pick(/Active SKUs/i),
    lowStockCount: pick(/Low stock/i),
    outOfStockCount: lowStock.length,
  };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, request);
  const q = scopeQuery(scope);

  return resolveToResponse<InventoryKpis>(
    {
      area: 'inventory',
      region: 'kpis',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => getInventoryKpis(q.storeId) as Promise<InventoryKpis>),
      selectDemo: selectDemoInventoryKpis,
      assertScope: noScopeAssertion,
    },
    EMPTY,
  );
}
