/**
 * POST /api/auth/logout
 *
 * Calls POST /api/v1/auth/logout with Bearer (server-side) to revoke the
 * session on the backend, then clears the session cookie.
 */
import { NextResponse } from 'next/server';
import { getSession, clearSession } from '@/lib/auth/session';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export async function POST() {
  const session = await getSession();

  if (session) {
    // Best-effort revoke on backend — we clear the cookie regardless
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
    } catch {
      // Swallow — cookie will be cleared anyway
    }
  }

  await clearSession();
  return new NextResponse(null, { status: 204 });
}
