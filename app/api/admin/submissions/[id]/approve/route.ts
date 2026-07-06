/**
 * POST /api/admin/submissions/[id]/approve — approve a submission,
 * pushing it (plus any moderator edits) into the global product
 * catalog.
 */
import { NextRequest, NextResponse } from 'next/server';
import { approveSubmission } from '@/lib/api/clients/admin';
import { getSession } from '@/lib/auth/session';

export async function POST(
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
    const body = await req.json().catch(() => ({}));
    const data = await approveSubmission(id, body);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to approve submission' }, { status: 500 });
  }
}
