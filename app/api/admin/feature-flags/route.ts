/**
 * GET /api/admin/feature-flags — list feature flags (admin/owner only, demo-aware).
 */
import { NextRequest, NextResponse } from 'next/server';
import { listFeatureFlags } from '@/lib/api/clients/admin';
import { getSession } from '@/lib/auth/session';
import type { DemoDataset } from '@/lib/demo';
import {
  buildStoreScope,
  isDemoRequest,
  noScopeAssertion,
  resolveToResponse,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

interface FlagsResponse {
  flags: unknown[];
}

function selectDemoFlags(ds: DemoDataset): FlagsResponse {
  const rows = (ds.regions.flags as unknown[] | undefined) ?? [];
  return { flags: rows };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const scope = buildStoreScope(session, req);

  return resolveToResponse<FlagsResponse>(
    {
      area: 'admin',
      region: 'flags',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => listFeatureFlags() as Promise<FlagsResponse>),
      selectDemo: selectDemoFlags,
      assertScope: noScopeAssertion,
    },
    { flags: [] },
  );
}
