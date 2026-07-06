/**
 * PATCH  /api/admin/webhooks/[id] — update a webhook
 * DELETE /api/admin/webhooks/[id] — delete a webhook
 */
import { NextRequest, NextResponse } from 'next/server';
import { updateWebhook, deleteWebhook } from '@/lib/api/clients/admin';
import { getSession } from '@/lib/auth/session';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = (await req.json()) as { url?: string; events?: string[]; isActive?: boolean };
    const data = await updateWebhook(id, body);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  try {
    await deleteWebhook(id);
    return NextResponse.json({}, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }
}
