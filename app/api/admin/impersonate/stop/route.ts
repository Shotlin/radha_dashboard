/**
 * POST /api/admin/impersonate/stop — end impersonation session (admin/owner only)
 */
import { NextResponse } from 'next/server';
import { stopImpersonation } from '@/lib/api/clients/admin';
import { getSession } from '@/lib/auth/session';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const data = await stopImpersonation();
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to stop impersonation' }, { status: 500 });
  }
}
