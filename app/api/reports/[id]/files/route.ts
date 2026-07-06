/**
 * GET /api/reports/[id]/files — list report artefacts
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { apiFetch } from '@/lib/api/core/api-fetch';
import { z } from 'zod';

const ArtefactSchema = z.object({
  id: z.string(),
  reportId: z.string(),
  fileName: z.string(),
  format: z.enum(['xlsx', 'pdf', 'csv']),
  sizeBytes: z.number(),
  downloadUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  expiresAt: z.string().nullable().optional(),
});

const ListSchema = z.object({ items: z.array(ArtefactSchema) });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ items: [] }, { status: 200 });
  const { id } = await params;
  try {
    const data = await apiFetch(`/reports/${id}/files`, { schema: ListSchema });
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
