/**
 * GET  /api/inventory/movements — list stock movements (demo-aware, store-scoped).
 * POST /api/inventory/movements — record a stock movement.
 */
import { NextRequest, NextResponse } from 'next/server';
import { listStockMovements, recordStockMovement } from '@/lib/api/clients/inventory';
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

function selectDemoMovements(ds: DemoDataset): ListResponse {
  const rows = (ds.regions.movements as unknown[] | undefined) ?? [];
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
      region: 'movements',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () =>
        withBackendTimeout(
          () =>
            listStockMovements(q.storeId, {
              cursor: sp.get('cursor') ?? undefined,
              limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
            }) as Promise<ListResponse>,
        ),
      selectDemo: selectDemoMovements,
      assertScope: noScopeAssertion,
    },
    { items: [], total: 0 },
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await request.json()) as { storeId: string; ean: string; type: string; quantity: number; reason?: string };
    const data = await recordStockMovement(body);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
