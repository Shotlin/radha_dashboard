/**
 * GET /api/auth/me
 *
 * In DEMO_MODE: returns user data from the session cookie directly (no backend call).
 * In production: proxies GET /api/v1/auth/me with the server-side Bearer token.
 *
 * SESSION HARDENING (R6.2–R6.6):
 * - Proactive refresh when the access token is within 60 s of expiry, via the
 *   shared single-flight `refreshSessionOnce()` (R6.4, R6.6).
 * - Transient upstream failures (HTTP 502/503/504, request timeout, or no
 *   network response) are retried up to 3 times with backoff [1000, 2000, 4000]
 *   ms; the cookie is KEPT throughout and on exhaustion, and the response is a
 *   non-fatal 503 — NEVER a logout (R6.2, R6.3).
 * - On a hard refresh failure (refresh token invalid/expired) the cookie is
 *   cleared and a 401 `SESSION_ENDED` is returned so the client redirects (R6.5).
 *
 * The access/refresh tokens are NEVER sent to the browser in either mode — only
 * the user's identity is returned.
 */
import { NextResponse } from 'next/server';
import { getSession, isTokenExpiringSoon } from '@/lib/auth/session';
import { refreshSessionOnce, endSession } from '@/lib/auth/refresh-session';
import { isTransient, backoffSchedule } from '@/lib/auth/retry';
import { DEMO_MODE } from '@/lib/demo/demo-session';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/** Max transient retries for the upstream `/auth/me` probe (R6.3). */
const ME_MAX_RETRIES = 3;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthenticated', code: 'NO_SESSION' }, { status: 401 });
  }

  /* ── DEMO MODE — return user from session cookie directly ───────────── */
  if (DEMO_MODE || (session as unknown as { _demo?: boolean })._demo) {
    return NextResponse.json(
      {
        user: {
          ...session.user,
          isVerified: true,
          bypassOnboarding: true,
          isDemo: true,
          mobile: '9999999999',
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      { status: 200 },
    );
  }

  /* ── REAL BACKEND ───────────────────────────────────────────────────── */
  // Proactive refresh when the token is expiring soon (R6.4, R6.6). A hard
  // failure ends the session; a transient failure keeps it and proceeds.
  if (isTokenExpiringSoon(session.expiresAt)) {
    const outcome = await refreshSessionOnce();
    if (!outcome.ok && outcome.hard) {
      await endSession();
      return NextResponse.json(
        { message: 'Session expired', code: 'SESSION_ENDED' },
        { status: 401 },
      );
    }
  }

  const schedule = backoffSchedule(ME_MAX_RETRIES);

  /** Issue one upstream attempt. Returns a NextResponse, or null to retry transiently. */
  async function attempt(refreshed: boolean): Promise<NextResponse | null> {
    const active = await getSession();
    if (!active) {
      return NextResponse.json({ message: 'Session expired', code: 'NO_SESSION' }, { status: 401 });
    }

    let upstream: Response;
    try {
      upstream = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${active.accessToken}` },
        next: { revalidate: 0 },
      });
    } catch (err) {
      // Network failure → transient; signal the retry loop (cookie retained).
      void err;
      return null;
    }

    if (!upstream.ok) {
      // 401 → single-flight refresh once, then retry (R6.6).
      if (upstream.status === 401 && !refreshed) {
        const outcome = await refreshSessionOnce();
        if (outcome.ok) return attempt(true);
        if (outcome.hard) {
          await endSession();
          return NextResponse.json(
            { message: 'Session expired', code: 'SESSION_ENDED' },
            { status: 401 },
          );
        }
        // Transient refresh failure: keep the cookie, do not log out (R6.2).
        return NextResponse.json(
          { message: 'Could not refresh session', code: 'REFRESH_TRANSIENT' },
          { status: 503 },
        );
      }

      // Transient upstream status → signal the retry loop (cookie retained).
      if (isTransient(upstream.status)) return null;

      // Other non-success (non-401) → surface the error WITHOUT logging out.
      return NextResponse.json(
        { message: 'Could not fetch user', code: 'UPSTREAM_ERROR' },
        { status: upstream.status },
      );
    }

    const user = await upstream.json();
    return NextResponse.json({ user }, { status: 200 });
  }

  // Transient-retry loop with backoff (R6.3). The cookie is never cleared here.
  for (let i = 0; ; i += 1) {
    const result = await attempt(false);
    if (result) return result;
    if (i < schedule.length) {
      await delay(schedule[i]);
      continue;
    }
    // Retries exhausted: non-fatal 503, session retained (R6.2, R6.3).
    return NextResponse.json(
      { message: 'Service temporarily unavailable', code: 'UPSTREAM_TRANSIENT' },
      { status: 503 },
    );
  }
}
