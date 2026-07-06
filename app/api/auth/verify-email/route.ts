/**
 * POST /api/auth/verify-email
 * Proxies POST /api/v1/auth/email/verify
 */
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { token: string };
    const upstream = await fetch(`${API_BASE}/auth/email/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ message: 'Verification failed' }, { status: 500 });
  }
}
