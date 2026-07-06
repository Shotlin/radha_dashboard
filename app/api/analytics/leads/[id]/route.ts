/**
 * GET /api/analytics/leads/[id] — lead detail.
 * PATCH /api/analytics/leads/[id] — update lead status/notes.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/core/api-fetch';
import { getSession } from '@/lib/auth/session';
import { LeadSchema, UpdateLeadSchema } from '@/features/analytics/analytics.schema';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const data = await apiFetch(`/marketing/leads/${id}`, { schema: LeadSchema });
    return NextResponse.json(data);
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
  const body = await req.json();
  const validated = UpdateLeadSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  try {
    const data = await apiFetch(`/marketing/leads/${id}`, {
      method: 'PATCH',
      body: validated.data,
      schema: LeadSchema,
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
