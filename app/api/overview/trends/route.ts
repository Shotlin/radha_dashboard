/**
 * GET /api/overview/trends — overview trend series.
 *
 * Demo data from the Demo_Data_Provider (R1.6); session tenant + active store
 * forwarded to the backend (R8.1, R8.3); 30s AbortController (R10.2).
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

interface TrendPoint {
  date: string;
  value: number;
}
interface TrendResponse {
  series: TrendPoint[];
}

function selectDemoTrends(ds: DemoDataset): TrendResponse {
  const rows = (ds.regions.trends as Array<{ date: string; scans: number }> | undefined) ?? [];
  return { series: rows.map((r) => ({ date: r.date, value: r.scans })) };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);
  const from = req.nextUrl.searchParams.get('from') ?? '';
  const to = req.nextUrl.searchParams.get('to') ?? '';

  return resolveToResponse<TrendResponse>(
    {
      area: 'overview',
      region: 'trends',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () =>
        withBackendTimeout(async (signal) => {
          const res = await fetch(
            `${API_BASE}/dashboard/quick-stats?storeId=${encodeURIComponent(q.storeId)}&tenantId=${encodeURIComponent(q.tenantId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
            { headers: { Authorization: `Bearer ${session.accessToken}` }, signal, next: { revalidate: 0 } },
          );
          await throwIfNotOk(res);
          return (await res.json()) as TrendResponse;
        }),
      selectDemo: selectDemoTrends,
      assertScope: noScopeAssertion,
    },
    { series: [] },
  );
}
