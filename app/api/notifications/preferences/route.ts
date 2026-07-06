/**
 * GET  /api/notifications/preferences — get notification preferences
 * PATCH /api/notifications/preferences — update notification preferences
 */
import { NextRequest, NextResponse } from 'next/server';
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/api/clients/notifications';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ channels: {}, types: {} }, { status: 200 });
  }
  try {
    const data = await getNotificationPreferences();
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ channels: {}, types: {} }, { status: 200 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { channels?: Record<string, boolean>; types?: Record<string, boolean> };
    const data = await updateNotificationPreferences(body);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
