/**
 * GET /api/audit/imports/[batchId] — proxy poll import job status
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { apiFetch } from '@/lib/api/core/api-fetch';
import { z } from 'zod';

const ImportJobSchema = z.object({
  id: z.string(),
  listId: z.string(),
  status: z.enum(['queued', 'processing', 'done', 'failed', 'cancelled']),
  total: z.number().optional(),
  processed: z.number().optional(),
  imported: z.number().optional(),
  errors: z.number().optional(),
  errorRows: z.array(z.object({ row: z.number(), ean: z.string().optional(), error: z.string() })).optional(),
  errorCsvUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  completedAt: z.string().nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { batchId } = await params;
  try {
    const data = await apiFetch(`/ean-lists/imports/${batchId}`, { schema: ImportJobSchema });
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
