/**
 * POST /api/admin/impersonate — start impersonation (admin/owner only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { startImpersonation } from '@/lib/api/clients/admin';
import { getSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = (await req.json()) as { tenantId: string; reason: string };
    const data = await startImpersonation(body.tenantId, body.reason);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to start impersonation' }, { status: 500 });
  }
}
