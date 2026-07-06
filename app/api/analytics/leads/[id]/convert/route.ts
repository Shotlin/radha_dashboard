/**
 * POST /api/analytics/leads/[id]/convert — server-side lead conversion (audited).
 */
import { NextRequest, NextResponse } from 'next/server';
import { convertLead } from '@/lib/api/clients/analytics';
import { getSession } from '@/lib/auth/session';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = session.user.role;
  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  try {
    const data = await convertLead(id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 });
  }
}
