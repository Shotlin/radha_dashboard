/**
 * POST /api/audit/ean-lists/[id]/import — proxy import EAN items CSV
 */
import { NextRequest, NextResponse } from 'next/server';
import { importEanItems } from '@/lib/api/clients/ean-lists';
import { getSession } from '@/lib/auth/session';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const body = (await req.json()) as { csv: string };
    const data = await importEanItems(id, body.csv);
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
