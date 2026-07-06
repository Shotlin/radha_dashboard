/**
 * POST /api/audit/sync-batches/[batchId]/cancel — proxy cancel sync batch
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { apiFetch } from '@/lib/api/core/api-fetch';
import { z } from 'zod';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { batchId } = await params;
  try {
    await apiFetch(`/scan-sessions/sync-batches/${batchId}/cancel`, {
      method: 'POST',
      schema: z.object({}),
      noBody: true,
    });
    return NextResponse.json({}, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
