/**
 * GET  /api/audit/ean-lists  — list EAN lists (demo-aware, store-scoped).
 * POST /api/audit/ean-lists  — create EAN list.
 */
import { NextRequest, NextResponse } from 'next/server';
import { listEanLists, createEanList } from '@/lib/api/clients/ean-lists';
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

function selectDemoEanLists(ds: DemoDataset): ListResponse {
  const rows = (ds.regions.eanLists as unknown[] | undefined) ?? [];
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
      region: 'eanLists',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => listEanLists(q.storeId) as Promise<ListResponse>),
      selectDemo: selectDemoEanLists,
      assertScope: noScopeAssertion,
    },
    { items: [], total: 0, nextCursor: null },
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = (await req.json()) as { storeId: string; name: string };
    const data = await createEanList({ storeId: body.storeId, name: body.name });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
