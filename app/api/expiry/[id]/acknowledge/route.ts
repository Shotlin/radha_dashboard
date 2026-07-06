/**
 * POST /api/expiry/[id]/acknowledge — acknowledge a specific expiry alert.
 */
import { NextRequest, NextResponse } from 'next/server';
import { acknowledgeExpiryAlert } from '@/lib/api/clients/expiry';
import { getSession } from '@/lib/auth/session';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const data = await acknowledgeExpiryAlert(id);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to acknowledge alert' }, { status: 500 });
  }
}
