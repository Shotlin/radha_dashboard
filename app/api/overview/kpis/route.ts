/**
 * GET /api/overview/kpis — Overview KPI tiles.
 *
 * Sources demo data from the Demo_Data_Provider (never inline — R1.6); forwards
 * the session tenant + active store to the backend (R8.1, R8.3) and bounds the
 * call with a 30s AbortController (R10.2). Backend failures with demo off yield a
 * region error / empty state, never fabricated data (R2.4, R2.5).
 */
import { NextRequest, NextResponse } from 'next/server';
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
  throwIfNotOk,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

interface OverviewKpi {
  expiringItems: number;
  expiredItems: number;
  lowStockItems: number;
  openTasks: number;
  pendingGrns: number;
  storeHealthScore: number;
}

const EMPTY: OverviewKpi = {
  expiringItems: 0,
  expiredItems: 0,
  lowStockItems: 0,
  openTasks: 0,
  pendingGrns: 0,
  storeHealthScore: 0,
};

/** Pick a KPI value from a demo `kpis` region by matching its label. */
function kpiValue(ds: DemoDataset | null, match: RegExp): number {
  const arr = (ds?.regions.kpis as Array<{ label: string; value: number }> | undefined) ?? [];
  return arr.find((r) => match.test(r.label))?.value ?? 0;
}

/**
 * Adapt the Demo_Data_Provider into the Overview KPI contract. The overview
 * dataset supplies the health score; the per-area datasets supply the operational
 * counts so the demo KPI tile is coherent and honestly sourced (no inline data).
 */
function deriveDemoKpis(scope: StoreScope): OverviewKpi {
  const overview = getDemoDataset('overview', scope);
  const expiry = getDemoDataset('expiry', scope);
  const inventory = getDemoDataset('inventory', scope);
  const tasks = getDemoDataset('tasks', scope);
  const grn = getDemoDataset('grn', scope);

  const ohs = (overview?.regions.ohs as Array<{ storeId: string | null; score: number }> | undefined) ?? [];
  const ohsRecord = scope.storeId
    ? (ohs.find((o) => o.storeId === scope.storeId) ?? ohs[0])
    : (ohs.find((o) => o.storeId === null) ?? ohs[0]);

  return {
    expiringItems: kpiValue(expiry, /^Expiring/i),
    expiredItems: kpiValue(expiry, /Expired/i),
    lowStockItems: kpiValue(inventory, /Low stock/i),
    openTasks: kpiValue(tasks, /Open tasks/i),
    pendingGrns: kpiValue(grn, /Pending/i),
    storeHealthScore: ohsRecord?.score ?? 0,
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);

  return resolveToResponse<OverviewKpi>(
    {
      area: 'overview',
      region: 'kpis',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () =>
        withBackendTimeout(async (signal) => {
          const res = await fetch(
            `${API_BASE}/dashboard/kpis?storeId=${encodeURIComponent(q.storeId)}&tenantId=${encodeURIComponent(q.tenantId)}`,
            { headers: { Authorization: `Bearer ${session.accessToken}` }, signal, next: { revalidate: 0 } },
          );
          await throwIfNotOk(res);
          return (await res.json()) as OverviewKpi;
        }),
      selectDemo: () => deriveDemoKpis(scope),
      assertScope: noScopeAssertion,
    },
    EMPTY,
  );
}
