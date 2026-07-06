/**
 * POST /api/notifications/test — send a test notification (admin/owner only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { sendTestNotification } from '@/lib/api/clients/notifications';
import { getSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = (await req.json()) as { channel: string };
    const data = await sendTestNotification(body.channel);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 });
  }
}
