/**
 * app/api/settings/tenant/route.ts
 * GET /api/settings/tenant — read current user's tenant info.
 * Proxies GET /tenants/:tenantId from the session's tenantId.
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { accessToken } = session;
  const { tenantId } = session.user;

  try {
    const res = await fetch(`${API_BASE}/tenants/${tenantId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      return NextResponse.json(
        { message: err.message ?? 'Failed to load tenant info' },
        { status: res.status },
      );
    }

    const data = (await res.json()) as unknown;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
