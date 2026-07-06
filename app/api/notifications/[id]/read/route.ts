/**
 * POST /api/notifications/[id]/read — mark a single notification as read
 */
import { NextRequest, NextResponse } from 'next/server';
import { markNotificationRead } from '@/lib/api/clients/notifications';
import { getSession } from '@/lib/auth/session';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  try {
    const data = await markNotificationRead(id);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}
