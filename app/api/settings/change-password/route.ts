/**
 * app/api/settings/change-password/route.ts
 * POST /api/settings/change-password — step-up password change.
 * Proxies POST /auth/change-password. The current password is verified
 * server-side; a wrong current password returns 401/400 from the backend
 * which is surfaced as a form validation error to the client.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export async function POST(request: NextRequest): Promise<NextResponse> {
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
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      // Surface the backend message directly so the form can show it
      return NextResponse.json(
        { message: err.message ?? 'Failed to change password' },
        { status: res.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
