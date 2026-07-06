/**
 * GET  /api/admin/webhooks — list webhooks for a tenant (admin/owner only, demo-aware).
 * POST /api/admin/webhooks — create a new webhook.
 */
import { NextRequest, NextResponse } from 'next/server';
import { listWebhooks, createWebhook } from '@/lib/api/clients/admin';
import { getSession } from '@/lib/auth/session';
import type { DemoDataset } from '@/lib/demo';
import {
  buildStoreScope,
  isDemoRequest,
  noScopeAssertion,
  resolveToResponse,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

interface WebhooksResponse {
  items: unknown[];
}

function selectDemoWebhooks(ds: DemoDataset): WebhooksResponse {
  const rows = (ds.regions.webhooks as unknown[] | undefined) ?? [];
  return { items: rows };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const scope = buildStoreScope(session, req);
  const tenantId = req.nextUrl.searchParams.get('tenantId') ?? session.user.tenantId;

  return resolveToResponse<WebhooksResponse>(
    {
      area: 'admin',
      region: 'webhooks',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => listWebhooks(tenantId) as Promise<WebhooksResponse>),
      selectDemo: selectDemoWebhooks,
      assertScope: noScopeAssertion,
    },
    { items: [] },
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = (await req.json()) as { tenantId: string; url: string; events: string[] };
    const data = await createWebhook(body);
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}
