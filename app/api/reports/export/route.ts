/**
 * POST /api/reports/export — create a new ad-hoc export job
 */
import { NextRequest, NextResponse } from 'next/server';
import { createReport } from '@/lib/api/clients/reports';
import { getSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = (await req.json()) as {
      type: string;
      storeId?: string;
      from?: string;
      to?: string;
      format?: 'xlsx' | 'pdf' | 'csv';
    };
    const data = await createReport({
      type: body.type,
      storeId: body.storeId ?? '',
      from: body.from,
      to: body.to,
      format: body.format,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
