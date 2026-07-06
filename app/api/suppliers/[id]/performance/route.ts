/**
 * GET /api/suppliers/[id]/performance — supplier performance metrics proxy.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupplierPerformance } from '@/lib/api/clients/suppliers';
import { getSession } from '@/lib/auth/session';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const data = await getSupplierPerformance(id);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Not found';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
