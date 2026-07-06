/**
 * GET /api/overview/activity — recent activity feed.
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

interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
}
interface ActivityResponse {
  items: ActivityItem[];
}

function selectDemoActivity(ds: DemoDataset): ActivityResponse {
  const rows = (ds.regions.activity as Array<{ id: string; actor: string; action: string; at: string }> | undefined) ?? [];
  return { items: rows.map((r) => ({ id: r.id, actor: r.actor, action: r.action, target: '', createdAt: r.at })) };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);
  const limit = req.nextUrl.searchParams.get('limit') ?? '10';

  return resolveToResponse<ActivityResponse>(
    {
      area: 'overview',
      region: 'activity',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () =>
        withBackendTimeout(async (signal) => {
          const res = await fetch(
            `${API_BASE}/dashboard/activity?storeId=${encodeURIComponent(q.storeId)}&tenantId=${encodeURIComponent(q.tenantId)}&limit=${encodeURIComponent(limit)}`,
            { headers: { Authorization: `Bearer ${session.accessToken}` }, signal, next: { revalidate: 0 } },
          );
          await throwIfNotOk(res);
          return (await res.json()) as ActivityResponse;
        }),
      selectDemo: selectDemoActivity,
      assertScope: noScopeAssertion,
    },
    { items: [] },
  );
}
