/**
 * POST /api/admin/webhooks/[id]/deliveries/[deliveryId]/replay — replay a delivery
 */
import { NextRequest, NextResponse } from 'next/server';
import { replayWebhookDelivery } from '@/lib/api/clients/admin';
import { getSession } from '@/lib/auth/session';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; deliveryId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id, deliveryId } = await params;
  try {
    const data = await replayWebhookDelivery(id, deliveryId);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to replay delivery' }, { status: 500 });
  }
}
