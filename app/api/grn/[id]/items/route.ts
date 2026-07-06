/**
 * GET  /api/grn/[id]/items — list line items for a GRN.
 * POST /api/grn/[id]/items — add a line item to a GRN.
 */
import { NextRequest, NextResponse } from 'next/server';
import { listGrnLineItems, addGrnLineItem } from '@/lib/api/clients/grn';
import { getSession } from '@/lib/auth/session';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ items: [] }, { status: 200 });

  const { id } = await params;
  try {
    const data = await listGrnLineItems(id);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json() as Parameters<typeof addGrnLineItem>[1];
    const data = await addGrnLineItem(id, body);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
