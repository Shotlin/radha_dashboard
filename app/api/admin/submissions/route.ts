/**
 * GET /api/admin/submissions — list the BE-56 v2 barcode-learning
 * moderation queue (pending or flagged).
 */
import { NextRequest, NextResponse } from 'next/server';
import { listSubmissions } from '@/lib/api/clients/admin';
import { getSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = (req.nextUrl.searchParams.get('status') ?? 'pending') as 'pending' | 'flagged';
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '50');
  const offset = Number(req.nextUrl.searchParams.get('offset') ?? '0');

  try {
    const data = await listSubmissions({ status, limit, offset });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ data: [], total: 0, limit, offset }, { status: 200 });
  }
}
