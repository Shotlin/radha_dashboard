/**
 * POST /api/reports/[id]/export — re-export an existing report
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { apiFetch } from '@/lib/api/core/api-fetch';
import { z } from 'zod';

const ReportJobSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.enum(['queued', 'processing', 'done', 'failed']),
  storeId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  downloadUrl: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  createdAt: z.string(),
  completedAt: z.string().nullable().optional(),
});

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const data = await apiFetch(`/reports/${id}/export`, {
      method: 'POST',
      body: {},
      schema: ReportJobSchema,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
