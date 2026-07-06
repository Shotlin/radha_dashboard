/**
 * PATCH /api/inventory/[id]/min-stock — update minimum stock threshold.
 */
import { NextRequest, NextResponse } from 'next/server';
import { updateMinStock } from '@/lib/api/clients/inventory';
import { getSession } from '@/lib/auth/session';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const body = (await request.json()) as { storeId: string; minStock: number };
    const data = await updateMinStock(id, body.storeId, body.minStock);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
