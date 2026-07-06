/**
 * GET /api/audit/ean-lists/[id]/items — proxy list EAN items for a list
 */
import { NextRequest, NextResponse } from 'next/server';
import { listEanItems } from '@/lib/api/clients/ean-lists';
import { getSession } from '@/lib/auth/session';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ items: [] }, { status: 200 });
  const { id } = await params;
  try {
    const data = await listEanItems(id);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
