/**
 * GET    /api/reports/[id] — get report job
 * DELETE /api/reports/[id] — delete report job
 */
import { NextRequest, NextResponse } from 'next/server';
import { getReportJob, deleteReportJob } from '@/lib/api/clients/reports';
import { getSession } from '@/lib/auth/session';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const data = await getReportJob(id);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    await deleteReportJob(id);
    return NextResponse.json({}, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
