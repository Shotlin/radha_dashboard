/**
 * GET    /api/audit/ean-lists/[id]
 * PATCH  /api/audit/ean-lists/[id]
 * DELETE /api/audit/ean-lists/[id]
 */
import { NextRequest, NextResponse } from 'next/server';
import { getEanList } from '@/lib/api/clients/ean-lists';
import { getSession } from '@/lib/auth/session';
import { apiFetch } from '@/lib/api/core/api-fetch';
import { z } from 'zod';
import { EanListSchema } from '@/lib/api/schemas/common';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const data = await getEanList(id);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const data = await apiFetch(`/ean-lists/${id}`, {
      method: 'PATCH',
      body,
      schema: EanListSchema,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 400 });
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
    await apiFetch(`/ean-lists/${id}`, {
      method: 'DELETE',
      schema: z.object({}),
      noBody: true,
    });
    return NextResponse.json({}, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
