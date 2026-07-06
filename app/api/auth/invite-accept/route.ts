/**
 * POST /api/auth/invite-accept
 * Proxies POST /api/v1/auth/admin/invitations/accept
 */
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { token: string; name: string; password: string };
    const upstream = await fetch(`${API_BASE}/auth/admin/invitations/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ message: 'Invite accept failed' }, { status: 500 });
  }
}
