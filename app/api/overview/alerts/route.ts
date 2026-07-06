/**
 * GET /api/overview/alerts — overview alerts.
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

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  storeId: string | null;
  actionUrl: string;
  createdAt: string;
}
interface AlertsResponse {
  alerts: Alert[];
}

function selectDemoAlerts(ds: DemoDataset): AlertsResponse {
  const rows =
    (ds.regions.alerts as Array<{ id: string; severity: string; title: string; at: string; storeId?: string | null }> | undefined) ?? [];
  return {
    alerts: rows.map((r) => ({
      id: r.id,
      type: 'system',
      severity: r.severity,
      message: r.title,
      storeId: r.storeId ?? null,
      actionUrl: '',
      createdAt: r.at,
    })),
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);

  return resolveToResponse<AlertsResponse>(
    {
      area: 'overview',
      region: 'alerts',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () =>
        withBackendTimeout(async (signal) => {
          const res = await fetch(
            `${API_BASE}/dashboard/alerts?storeId=${encodeURIComponent(q.storeId)}&tenantId=${encodeURIComponent(q.tenantId)}`,
            { headers: { Authorization: `Bearer ${session.accessToken}` }, signal, next: { revalidate: 0 } },
          );
          await throwIfNotOk(res);
          return (await res.json()) as AlertsResponse;
        }),
      selectDemo: selectDemoAlerts,
      assertScope: noScopeAssertion,
    },
    { alerts: [] },
  );
}
