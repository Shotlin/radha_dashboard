/**
 * GET /api/stores — list the tenant's stores (populates the store picker).
 *
 * Stores is not one of the 13 demoable Feature_Areas, so it has no demo dataset
 * of its own; in demo mode its list is sourced from the Demo_Data_Provider's
 * settings dataset (`storeSettings` region) rather than an inline constant (R1.6).
 * The picker needs every tenant store, so demo resolution uses a tenant rollup
 * scope. The session tenant is carried to the backend by the Bearer token; the
 * backend call is bounded by a 30s AbortController (R8.1, R10.2).
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDemoDataset } from '@/lib/demo';
import type { Role } from '@/lib/permissions';
import type { StoreScope } from '@/lib/api/core/scope-types';
import { isDemoRequest, throwIfNotOk, withBackendTimeout } from '@/lib/api/core/proxy';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

interface Store {
  id: string;
  name: string;
  tenantId: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ stores: [] }, { status: 200 });

  // The picker shows every store in the tenant, so resolve against a rollup scope.
  const rollupScope: StoreScope = {
    tenantId: session.user.tenantId,
    storeId: null,
    role: session.user.role as Role,
  };

  // Demo mode — source the store list from the Demo_Data_Provider (no inline data).
  if (isDemoRequest(session)) {
    const settings = getDemoDataset('settings', rollupScope);
    const rows =
      (settings?.regions.storeSettings as
        | Array<{ storeId: string | null; storeName: string; address: string; tenantId: string }>
        | undefined) ?? [];
    const stores: Store[] = rows.map((r) => ({
      id: r.storeId ?? '',
      name: r.storeName,
      tenantId: r.tenantId,
      address: r.address,
      isActive: true,
      createdAt: '',
    }));
    return NextResponse.json({ stores }, { status: 200 });
  }

  // Real mode — backend scopes to the session tenant via the Bearer token.
  try {
    const res = await withBackendTimeout(async (signal) => {
      const r = await fetch(`${API_BASE}/stores`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        signal,
        next: { revalidate: 0 },
      });
      await throwIfNotOk(r);
      return (await r.json()) as { stores: Store[] };
    });
    return NextResponse.json(res, { status: 200 });
  } catch {
    // Stores power navigation, not a data region; degrade to an empty picker
    // rather than a hard error so the shell stays usable (R10.6).
    return NextResponse.json({ stores: [] }, { status: 200 });
  }
}
