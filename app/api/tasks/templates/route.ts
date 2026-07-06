/**
 * GET /api/tasks/templates — task templates (demo-aware, store-scoped).
 *
 * The tasks demo dataset defines no `templates` region, so in demo mode this
 * resolves to a designed empty state ({ templates: [] }) and logs the gap once
 * (R1.7) rather than fabricating templates.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getTaskTemplates } from '@/lib/api/clients/tasks';
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

interface TemplatesResponse {
  templates: Array<{ id: string; title: string }>;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);

  return resolveToResponse<TemplatesResponse>(
    {
      area: 'tasks',
      region: 'templates',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () => withBackendTimeout(() => getTaskTemplates(q.storeId) as Promise<TemplatesResponse>),
      selectDemo: (ds: DemoDataset) => ds.regions.templates as TemplatesResponse | undefined,
      assertScope: noScopeAssertion,
    },
    { templates: [] },
  );
}
