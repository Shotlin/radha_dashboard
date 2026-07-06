/**
 * GET /api/analytics/website — website growth stats (demo-aware).
 *
 * The analytics demo dataset (store scan analytics) defines no `website` region,
 * so demo mode resolves to a designed empty state and logs the gap once (R1.7).
 * Real mode forwards the session scope and is bounded to 30s (R8.1, R10.2).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getWebsiteStats } from '@/lib/api/clients/analytics';
import { getSession } from '@/lib/auth/session';
import type { DemoDataset } from '@/lib/demo';
import {
  buildStoreScope,
  isDemoRequest,
  noScopeAssertion,
  resolveToResponse,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

interface WebsiteStats {
  visitors: number;
  pageViews: number;
  signups: number;
  conversions: number;
  funnel: unknown[];
}

const EMPTY: WebsiteStats = { visitors: 0, pageViews: 0, signups: 0, conversions: 0, funnel: [] };

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  return resolveToResponse<WebsiteStats>(
    {
      area: 'analytics',
      region: 'website',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => getWebsiteStats(from, to) as Promise<WebsiteStats>),
      selectDemo: (ds: DemoDataset) => ds.regions.website as WebsiteStats | undefined,
      assertScope: noScopeAssertion,
    },
    EMPTY,
  );
}
