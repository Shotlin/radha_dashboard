/**
 * POST /api/auth/login
 *
 * In DEMO_MODE=true: authenticates against the local demo user list (no backend needed).
 * In production: proxies credentials to POST /api/v1/auth/admin/login server-side,
 * sets httpOnly session cookies, returns minimal user info.
 *
 * The raw token NEVER reaches client JS either way.
 */
import { NextRequest, NextResponse } from 'next/server';
import { setSession } from '@/lib/auth/session';
import { DEMO_MODE, findDemoUser, buildDemoSession } from '@/lib/demo/demo-session';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email: string; password: string; deviceId?: string };

    /* ── DEMO MODE ──────────────────────────────────────────────────────── */
    if (DEMO_MODE) {
      const demoUser = findDemoUser(body.email, body.password);
      if (!demoUser) {
        return NextResponse.json(
          { message: 'Invalid demo credentials. Use one of the demo accounts shown on the login page.', code: 'AUTH_FAILED' },
          { status: 401 },
        );
      }
      const session = buildDemoSession(demoUser);
      await setSession(session);
      return NextResponse.json({ user: session.user }, { status: 200 });
    }

    /* ── REAL BACKEND ───────────────────────────────────────────────────── */
    const upstream = await fetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const err = (await upstream.json().catch(() => ({}))) as {
        message?: string;
        statusCode?: number;
      };
      return NextResponse.json(
        { message: err.message ?? 'Invalid credentials', code: 'AUTH_FAILED' },
        { status: upstream.status },
      );
    }

    const data = (await upstream.json()) as {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      user: {
        id: string;
        name: string;
        role: string;
        tenantId: string;
        storeIds: string[];
        permissions: string[];
      };
    };

    await setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
      user: {
        id: data.user.id,
        name: data.user.name,
        role: data.user.role,
        tenantId: data.user.tenantId,
        storeIds: data.user.storeIds ?? [],
        permissions: data.user.permissions ?? [],
      },
    });

    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Login failed', code: 'INTERNAL' }, { status: 500 });
  }
}
