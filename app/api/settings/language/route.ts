/**
 * app/api/settings/language/route.ts
 * GET  /api/settings/language — retrieve current user's language preference
 * PUT  /api/settings/language — update language (proxies PUT /users/me/language)
 *
 * Server-side proxy: attaches Bearer from httpOnly session cookie — token never
 * touches the client.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/* ── GET /api/settings/language ─────────────────────────────────────────── */
export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_BASE}/users/me/language`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      // If the endpoint doesn't exist yet (proposed feature), return default
      if (res.status === 404) {
        return NextResponse.json({ language: 'en' });
      }
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      return NextResponse.json(
        { message: err.message ?? 'Failed to get language preference' },
        { status: res.status },
      );
    }

    const data = (await res.json()) as unknown;
    return NextResponse.json(data);
  } catch {
    // Backend not reachable — return default gracefully
    return NextResponse.json({ language: 'en' });
  }
}

/* ── PUT /api/settings/language ─────────────────────────────────────────── */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_BASE}/users/me/language`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      return NextResponse.json(
        { message: err.message ?? 'Failed to update language preference' },
        { status: res.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Backend not reachable — acknowledge gracefully (preference is saved client-side)
    return NextResponse.json({ ok: true });
  }
}
