/**
 * POST /api/suppliers/import — CSV import proxy.
 */
import { NextRequest, NextResponse } from 'next/server';
import { importSuppliers } from '@/lib/api/clients/suppliers';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await request.json()) as { csv: string };
    const data = await importSuppliers(body.csv);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
