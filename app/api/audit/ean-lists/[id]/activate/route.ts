/**
 * POST /api/audit/ean-lists/[id]/activate — proxy activate EAN list
 */
import { NextRequest, NextResponse } from 'next/server';
import { activateEanList } from '@/lib/api/clients/ean-lists';
import { getSession } from '@/lib/auth/session';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const data = await activateEanList(id);
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
