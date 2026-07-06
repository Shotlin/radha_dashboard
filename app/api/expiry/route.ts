/**
 * GET  /api/expiry — list expiry records (demo-aware, store-scoped).
 * POST /api/expiry — create a new expiry record.
 */
import { NextRequest, NextResponse } from 'next/server';
import { listExpiry, createExpiry } from '@/lib/api/clients/expiry';
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

interface ExpiryItem {
  id: string;
  ean: string;
  productName: string;
  batchNo: string;
  quantity: number;
  expiryDate: string;
  status: string;
  storeId: string | null;
  createdAt: string;
}
interface ExpiryResponse {
  items: ExpiryItem[];
  total: number;
  nextCursor: string | null;
}

/** Map a demo list record's status to the client contract status vocabulary. */
function mapStatus(s: string): string {
  return s === 'expiring' ? 'expiring_soon' : s;
}

function selectDemoExpiry(ds: DemoDataset, status: string | null): ExpiryResponse {
  const rows =
    (ds.regions.list as Array<{ id: string; name: string; ean: string; batch: string; expiry: string; qty: number; status: string; storeId: string | null }> | undefined) ??
    [];
  let items: ExpiryItem[] = rows.map((r) => ({
    id: r.id,
    ean: r.ean,
    productName: r.name,
    batchNo: r.batch,
    quantity: r.qty,
    expiryDate: r.expiry,
    status: mapStatus(r.status),
    storeId: r.storeId,
    createdAt: r.expiry,
  }));
  if (status) items = items.filter((i) => i.status === status);
  return { items, total: items.length, nextCursor: null };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);
  const status = sp.get('status');

  return resolveToResponse<ExpiryResponse>(
    {
      area: 'expiry',
      region: 'list',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () =>
        withBackendTimeout(
          () =>
            listExpiry({
              storeId: q.storeId,
              status: (status as 'fresh' | 'expiring_soon' | 'expired' | undefined) ?? undefined,
              from: sp.get('from') ?? undefined,
              to: sp.get('to') ?? undefined,
              categoryId: sp.get('categoryId') ?? undefined,
            }) as Promise<ExpiryResponse>,
        ),
      selectDemo: (ds) => selectDemoExpiry(ds, status),
      assertScope: noScopeAssertion,
    },
    { items: [], total: 0, nextCursor: null },
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const data = await createExpiry(body);
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create expiry record' }, { status: 500 });
  }
}
