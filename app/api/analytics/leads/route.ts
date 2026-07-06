/**
 * GET /api/analytics/leads — leads list (demo-aware).
 *
 * The analytics demo dataset defines no `leads` region, so demo mode resolves to
 * a designed empty state and logs the gap once (R1.7) rather than fabricating
 * leads. Real mode forwards the session scope and is bounded to 30s (R8.1, R10.2).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLeads } from '@/lib/api/clients/analytics';
import { getSession } from '@/lib/auth/session';
import type { DemoDataset } from '@/lib/demo';
import {
  buildStoreScope,
  isDemoRequest,
  noScopeAssertion,
  resolveToResponse,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

interface LeadsResponse {
  items: unknown[];
  total: number;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
  const cursor = searchParams.get('cursor') ?? undefined;

  return resolveToResponse<LeadsResponse>(
    {
      area: 'analytics',
      region: 'leads',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => getLeads({ status, limit, cursor }) as Promise<LeadsResponse>),
      selectDemo: (ds: DemoDataset) => ds.regions.leads as LeadsResponse | undefined,
      assertScope: noScopeAssertion,
    },
    { items: [], total: 0 },
  );
}
