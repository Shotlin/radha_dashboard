/**
 * POST /api/grn/[id]/receive — mark GRN as received.
 */
import { NextRequest, NextResponse } from 'next/server';
import { receiveGrn } from '@/lib/api/clients/grn';
import { getSession } from '@/lib/auth/session';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const data = await receiveGrn(id);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
