/**
 * GET /api/admin/impersonation-audit — impersonation audit records (admin/owner only).
 *
 * The backend endpoint (GET /admin/audit-log) is a proposed feature not yet
 * implemented, so real mode resolves to a designed empty state (no fabricated
 * data). Demo mode serves the Demo_Data_Provider's impersonation sessions (R1.6).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import type { DemoDataset } from '@/lib/demo';
import {
  buildStoreScope,
  isDemoRequest,
  noScopeAssertion,
  resolveToResponse,
  withBackendTimeout,
} from '@/lib/api/core/proxy';

interface AuditResponse {
  items: unknown[];
}

function selectDemoImpersonation(ds: DemoDataset): AuditResponse {
  const rows = (ds.regions.impersonation as unknown[] | undefined) ?? [];
  return { items: rows };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const scope = buildStoreScope(session, req);

  return resolveToResponse<AuditResponse>(
    {
      area: 'admin',
      region: 'impersonation',
      scope,
      isDemo: isDemoRequest(session),
      // Proposed backend endpoint — no data to forward yet; resolve to empty.
      fetchReal: () => withBackendTimeout(async () => ({ items: [] }) as AuditResponse),
      selectDemo: selectDemoImpersonation,
      assertScope: noScopeAssertion,
    },
    { items: [] },
  );
}
