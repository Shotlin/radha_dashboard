/**
 * GET  /api/suppliers — list suppliers (demo-aware, tenant-scoped).
 * POST /api/suppliers — create a supplier.
 */
import { NextRequest, NextResponse } from 'next/server';
import { listSuppliers, createSupplier } from '@/lib/api/clients/suppliers';
import { getSession } from '@/lib/auth/session';
import type { DemoDataset } from '@/lib/demo';
import {
  buildStoreScope,
  isDemoRequest,
  noScopeAssertion,
  resolveToResponse,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

interface SuppliersResponse {
  items: unknown[];
  total: number;
}

function selectDemoSuppliers(ds: DemoDataset): SuppliersResponse {
  const rows = (ds.regions.list as unknown[] | undefined) ?? [];
  return { items: rows, total: rows.length };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const scope = buildStoreScope(session, request);

  return resolveToResponse<SuppliersResponse>(
    {
      area: 'suppliers',
      region: 'list',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () =>
        withBackendTimeout(async () => {
          const data = (await listSuppliers({
            search: sp.get('search') ?? undefined,
            isActive: sp.get('isActive') !== null ? sp.get('isActive') === 'true' : undefined,
            cursor: sp.get('cursor') ?? undefined,
            limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
          })) as Record<string, unknown>;
          // Normalise PaginatedSchema {items, nextCursor, total} to the list contract.
          return { items: (data.items as unknown[]) ?? [], total: (data.total as number) ?? 0 };
        }),
      selectDemo: selectDemoSuppliers,
      assertScope: noScopeAssertion,
    },
    { items: [], total: 0 },
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await request.json()) as Parameters<typeof createSupplier>[0];
    const data = await createSupplier(body);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
