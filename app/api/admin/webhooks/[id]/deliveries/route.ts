/**
 * GET /api/admin/webhooks/[id]/deliveries — list webhook deliveries
 */
import { NextRequest, NextResponse } from 'next/server';
import { listWebhookDeliveries } from '@/lib/api/clients/admin';
import { getSession } from '@/lib/auth/session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const sp = req.nextUrl.searchParams;
  const cursor = sp.get('cursor') ?? undefined;
  const limit = sp.get('limit') ? Number(sp.get('limit')) : undefined;
  try {
    const data = await listWebhookDeliveries(id, { cursor, limit });
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
