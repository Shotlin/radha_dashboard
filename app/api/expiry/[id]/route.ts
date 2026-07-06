/**
 * PATCH /api/expiry/[id] — update expiry record.
 * DELETE /api/expiry/[id] — delete expiry record.
 */
import { NextRequest, NextResponse } from 'next/server';
import { updateExpiry, deleteExpiry } from '@/lib/api/clients/expiry';
import { getSession } from '@/lib/auth/session';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const body = await req.json();
    const data = await updateExpiry(id, body);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update expiry record' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    await deleteExpiry(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete expiry record' }, { status: 500 });
  }
}
