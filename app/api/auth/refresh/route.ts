/**
 * POST /api/auth/refresh
 *
 * Rotates the session server-side using the refresh token held in the httpOnly
 * cookie. The rotation runs through the shared single-flight `refreshSessionOnce()`
 * so concurrent refresh attempts collapse to AT MOST ONE upstream call (R6.6),
 * bounded to 5 s (R6.4).
 *
 * On a hard failure (refresh token invalid/expired) the cookie is cleared and a
 * 401 `SESSION_ENDED` is returned so the client redirects to /login (R6.5). On a
 * transient failure (network/timeout) the cookie is RETAINED and a non-fatal 503
 * is returned — the user is not logged out (R6.2).
 *
 * Tokens are NEVER returned to the client; the rotated tokens live only in the
 * httpOnly cookie.
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { refreshSessionOnce, endSession } from '@/lib/auth/refresh-session';

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'No session', code: 'NO_SESSION' }, { status: 401 });
  }

  const outcome = await refreshSessionOnce();

  if (outcome.ok) {
    // Success — tokens were rotated into the httpOnly cookie, never returned here.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (outcome.hard) {
    // Refresh token invalid/expired → end the session (R6.5).
    await endSession();
    return NextResponse.json({ message: 'Session expired', code: 'SESSION_ENDED' }, { status: 401 });
  }

  // Transient network/timeout failure → keep the cookie, do not log out (R6.2).
  return NextResponse.json(
    { message: 'Could not refresh session', code: 'REFRESH_TRANSIENT' },
    { status: 503 },
  );
}
