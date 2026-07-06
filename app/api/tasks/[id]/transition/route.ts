/**
 * POST /api/tasks/[id]/transition — transition task status.
 */
import { NextRequest, NextResponse } from 'next/server';
import { transitionTask } from '@/lib/api/clients/tasks';
import { getSession } from '@/lib/auth/session';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const body = (await req.json()) as { status: string };
    const data = await transitionTask(id, body.status);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to transition task' }, { status: 500 });
  }
}
