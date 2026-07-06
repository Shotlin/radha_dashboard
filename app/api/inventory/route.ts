/**
 * GET /api/inventory — list inventory (demo-aware, store-scoped).
 */
import { NextRequest, NextResponse } from 'next/server';
import { listInventory } from '@/lib/api/clients/inventory';
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

function selectDemoInventory(ds: DemoDataset): ListResponse {
  const rows = (ds.regions.list as unknown[] | undefined) ?? [];
  return { items: rows, total: rows.length };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const scope = buildStoreScope(session, request);
  const q = scopeQuery(scope);

  return resolveToResponse<ListResponse>(
    {
      area: 'inventory',
      region: 'list',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () =>
        withBackendTimeout(
          () =>
            listInventory({
              storeId: q.storeId,
              search: sp.get('search') ?? undefined,
              lowStock: sp.get('lowStock') === 'true',
              limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
              cursor: sp.get('cursor') ?? undefined,
            }) as Promise<ListResponse>,
        ),
      selectDemo: selectDemoInventory,
      assertScope: noScopeAssertion,
    },
    { items: [], total: 0 },
  );
}
