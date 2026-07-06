/**
 * GET /api/admin/submissions/[id] — full submission detail + image URLs.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSubmission } from '@/lib/api/clients/admin';
import { getSession } from '@/lib/auth/session';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  try {
    const data = await getSubmission(id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }
}
