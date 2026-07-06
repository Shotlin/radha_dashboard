/**
 * GET /api/overview/health-score — store health gauge.
 *
 * Demo data from the Demo_Data_Provider (R1.6); session tenant + active store
 * forwarded to the backend (R8.1, R8.3); 30s AbortController (R10.2).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import type { StoreScope } from '@/lib/api/core/scope-types';
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

interface HealthScore {
  overall: number;
  components?: { label: string; score: number }[];
  lastAssessedAt?: string | null;
}

function selectDemoHealth(ds: DemoDataset, scope: StoreScope): HealthScore {
  const ohs = (ds.regions.ohs as Array<{ storeId: string | null; score: number }> | undefined) ?? [];
  const record = scope.storeId
    ? (ohs.find((o) => o.storeId === scope.storeId) ?? ohs[0])
    : (ohs.find((o) => o.storeId === null) ?? ohs[0]);
  return { overall: record?.score ?? 0, lastAssessedAt: null };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);

  return resolveToResponse<HealthScore>(
    {
      area: 'overview',
      region: 'ohs',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () =>
        withBackendTimeout(async (signal) => {
          const res = await fetch(
            `${API_BASE}/dashboard/health-score?storeId=${encodeURIComponent(q.storeId)}&tenantId=${encodeURIComponent(q.tenantId)}`,
            { headers: { Authorization: `Bearer ${session.accessToken}` }, signal, next: { revalidate: 0 } },
          );
          await throwIfNotOk(res);
          return (await res.json()) as HealthScore;
        }),
      selectDemo: (ds) => selectDemoHealth(ds, scope),
      assertScope: noScopeAssertion,
    },
    { overall: 0 },
  );
}
