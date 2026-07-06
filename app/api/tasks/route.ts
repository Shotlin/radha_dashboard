/**
 * GET  /api/tasks — list tasks (demo-aware, store-scoped).
 * POST /api/tasks — create a new task.
 */
import { NextRequest, NextResponse } from 'next/server';
import { listTasks, createTask } from '@/lib/api/clients/tasks';
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

interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  assigneeId: string | null;
  dueAt: string;
  storeId: string | null;
  createdAt: string;
}
interface TasksResponse {
  items: TaskItem[];
  total: number;
  nextCursor: string | null;
}

/** Map a demo task status to the client contract vocabulary. */
function mapStatus(s: string): string {
  if (s === 'open') return 'pending';
  if (s === 'done') return 'completed';
  return s;
}

function selectDemoTasks(ds: DemoDataset, status: string | null): TasksResponse {
  const rows =
    (ds.regions.list as Array<{ id: string; title: string; assignee: string; due: string; priority: string; status: string; storeId: string | null }> | undefined) ??
    [];
  let items: TaskItem[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: '',
    priority: r.priority,
    status: mapStatus(r.status),
    assigneeId: null,
    dueAt: r.due,
    storeId: r.storeId,
    createdAt: r.due,
  }));
  if (status) items = items.filter((t) => t.status === status);
  return { items, total: items.length, nextCursor: null };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const scope = buildStoreScope(session, req);
  const q = scopeQuery(scope);
  const status = sp.get('status');

  return resolveToResponse<TasksResponse>(
    {
      area: 'tasks',
      region: 'list',
      scope,
      isDemo: isDemoRequest(session),
      fetchReal: () =>
        withBackendTimeout(
          () =>
            listTasks({
              storeId: q.storeId,
              status: status ?? undefined,
              assigneeId: sp.get('assigneeId') ?? undefined,
              priority: sp.get('priority') ?? undefined,
              from: sp.get('from') ?? undefined,
              to: sp.get('to') ?? undefined,
            }) as Promise<TasksResponse>,
        ),
      selectDemo: (ds) => selectDemoTasks(ds, status),
      assertScope: noScopeAssertion,
    },
    { items: [], total: 0, nextCursor: null },
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const data = await createTask(body);
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
