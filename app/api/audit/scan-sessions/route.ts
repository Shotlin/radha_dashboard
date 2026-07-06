/**
 * GET /api/audit/scan-sessions — list audit scan sessions (demo-aware, store-scoped).
 */
import { NextRequest, NextResponse } from 'next/server';
import { listScanSessions } from '@/lib/api/clients/ean-lists';
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
  nextCursor: string | null;
}

function selectDemoScanSessions(ds: DemoDataset): ListResponse {
  const rows = (ds.regions.scanSessions as unknown[] | undefined) ?? [];
  return { items: rows, total: rows.length, nextCursor: null };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);

  return resolveToResponse<ListResponse>(
    {
      area: 'audit',
      region: 'scanSessions',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => listScanSessions(q.storeId) as Promise<ListResponse>),
      selectDemo: selectDemoScanSessions,
      assertScope: noScopeAssertion,
    },
    { items: [], total: 0, nextCursor: null },
  );
}
