/**
 * GET /api/notifications — notification list + unread count (demo-aware).
 *
 * Demo data from the Demo_Data_Provider (R1.6); session tenant + active store
 * forwarded to the backend (R8.1, R8.3); 30s AbortController (R10.2).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import type { DemoDataset } from '@/lib/demo';
import {
  buildStoreScope,
  isDemoRequest,
  noScopeAssertion,
  resolveToResponse,
  scopeQuery,
  throwIfNotOk,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}
interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

function selectDemoNotifications(ds: DemoDataset): NotificationsResponse {
  const rows =
    (ds.regions.list as Array<{ id: string; type: string; title: string; body: string; at: string; read: boolean }> | undefined) ?? [];
  const items = rows.map((r) => ({ id: r.id, type: r.type, title: r.title, body: r.body, isRead: r.read, createdAt: r.at }));
  return { items, unreadCount: items.filter((i) => !i.isRead).length };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);

  // Preserve any caller filters, then layer the forwarded scope on top.
  const forwarded = new URLSearchParams(req.nextUrl.searchParams);
  forwarded.set('tenantId', q.tenantId);
  forwarded.set('storeId', q.storeId);

  return resolveToResponse<NotificationsResponse>(
    {
      area: 'notifications',
      region: 'list',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () =>
        withBackendTimeout(async (signal) => {
          const res = await fetch(`${API_BASE}/notifications?${forwarded.toString()}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
            signal,
            next: { revalidate: 0 },
          });
          await throwIfNotOk(res);
          return (await res.json()) as NotificationsResponse;
        }),
      selectDemo: selectDemoNotifications,
      assertScope: noScopeAssertion,
    },
    { items: [], unreadCount: 0 },
  );
}
