/**
 * GET /api/overview/multi-store — owner/admin multi-store rollup.
 *
 * Demo data from the Demo_Data_Provider (R1.6); session tenant forwarded to the
 * backend (R8.1); 30s AbortController (R10.2). The rollup is owner/admin-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import type { DemoDataset } from '@/lib/demo';
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

interface MultiStoreItem {
  storeId: string;
  name: string;
  kpis: { expiringItems: number; expiredItems: number; lowStockItems: number; openTasks: number };
  healthScore: number;
}
interface MultiStoreResponse {
  stores: MultiStoreItem[];
}

function selectDemoMultiStore(ds: DemoDataset): MultiStoreResponse {
  const rows =
    (ds.regions.multiStore as Array<{ storeId: string | null; storeName: string; health: number; expiring: number; lowStock: number }> | undefined) ?? [];
  return {
    stores: rows.map((r) => ({
      storeId: r.storeId ?? '',
      name: r.storeName,
      kpis: { expiringItems: r.expiring, expiredItems: 0, lowStockItems: r.lowStock, openTasks: 0 },
      healthScore: r.health,
    })),
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const isDemo = isDemoRequest(session);

  // The multi-store rollup is owner/admin-only (R8.2); non-privileged roles get
  // an empty rollup rather than cross-store data.
  if (!isDemo && session.user.role !== 'owner' && session.user.role !== 'admin') {
    return NextResponse.json({ stores: [] }, { status: 403 });
  }

  const q = scopeQuery(scope);

  return resolveToResponse<MultiStoreResponse>(
    {
      area: 'overview',
      region: 'multiStore',
      scope,
      isDemo,
      fetchReal: () =>
        withBackendTimeout(async (signal) => {
          const res = await fetch(`${API_BASE}/dashboard/multi-store?tenantId=${encodeURIComponent(q.tenantId)}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
            signal,
            next: { revalidate: 0 },
          });
          await throwIfNotOk(res);
          return (await res.json()) as MultiStoreResponse;
        }),
      selectDemo: selectDemoMultiStore,
      assertScope: noScopeAssertion,
    },
    { stores: [] },
  );
}
