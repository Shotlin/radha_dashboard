/**
 * GET /api/expiry/calendar — expiry calendar density (demo-aware, store-scoped).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getExpiryCalendar } from '@/lib/api/clients/expiry';
import { getSession } from '@/lib/auth/session';
import type { DemoDataset } from '@/lib/demo';
import {
  buildStoreScope,
  isDemoRequest,
  noScopeAssertion,
  resolveToResponse,
  scopeQuery,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

interface CalendarResponse {
  month: string;
  days: Array<{ date: string; count: number; severity: string }>;
}

function selectDemoCalendar(ds: DemoDataset, month: string): CalendarResponse {
  const rows = (ds.regions.calendar as Array<{ date: string; count: number; band: string }> | undefined) ?? [];
  return { month, days: rows.map((r) => ({ date: r.date, count: r.count, severity: r.band })) };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);
  const month = req.nextUrl.searchParams.get('month') ?? '';

  return resolveToResponse<CalendarResponse>(
    {
      area: 'expiry',
      region: 'calendar',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => getExpiryCalendar(q.storeId, month) as Promise<CalendarResponse>),
      selectDemo: (ds) => selectDemoCalendar(ds, month),
      assertScope: noScopeAssertion,
    },
    { month, days: [] },
  );
}
