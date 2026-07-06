/**
 * DELETE /api/grn/[id]/items/[itemId] — remove a line item from a GRN.
 */
import { NextRequest, NextResponse } from 'next/server';
import { removeGrnLineItem } from '@/lib/api/clients/grn';
import { getSession } from '@/lib/auth/session';

interface Params {
  params: Promise<{ id: string; itemId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, itemId } = await params;
  try {
    await removeGrnLineItem(id, itemId);
    return NextResponse.json({}, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
