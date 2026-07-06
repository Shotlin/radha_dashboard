/**
 * GET  /api/grn — list GRNs (demo-aware, store-scoped).
 * POST /api/grn — create a GRN.
 */
import { NextRequest, NextResponse } from 'next/server';
import { listGrns, createGrn } from '@/lib/api/clients/grn';
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

interface GrnResponse {
  items: unknown[];
  total: number;
}

function selectDemoGrns(ds: DemoDataset, status: string | null): GrnResponse {
  let rows = (ds.regions.list as Array<{ status: string }> | undefined) ?? [];
  if (status) rows = rows.filter((r) => r.status === status);
  return { items: rows, total: rows.length };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const scope = buildStoreScope(session, request);
  const q = scopeQuery(scope);
  const status = sp.get('status');

  return resolveToResponse<GrnResponse>(
    {
      area: 'grn',
      region: 'list',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () =>
        withBackendTimeout(
          () =>
            listGrns({
              storeId: q.storeId,
              status: status ?? undefined,
              supplierId: sp.get('supplierId') ?? undefined,
              from: sp.get('from') ?? undefined,
              to: sp.get('to') ?? undefined,
              cursor: sp.get('cursor') ?? undefined,
              limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
            }) as Promise<GrnResponse>,
        ),
      selectDemo: (ds) => selectDemoGrns(ds, status),
      assertScope: noScopeAssertion,
    },
    { items: [], total: 0 },
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await request.json()) as { storeId: string; supplierId?: string; invoiceNo?: string };
    const data = await createGrn(body);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
