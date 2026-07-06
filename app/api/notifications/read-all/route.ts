/**
 * POST /api/notifications/read-all — mark all notifications as read
 */
import { NextResponse } from 'next/server';
import { markAllRead } from '@/lib/api/clients/notifications';
import { getSession } from '@/lib/auth/session';

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await markAllRead();
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
  }
}
