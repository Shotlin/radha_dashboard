/**
 * POST /api/audit/scan — store-scoped barcode scan proxy.
 *
 * Demo mode: uses the 100-product catalogue. Real mode: calls backend.
 * Always returns a ScanResult with the exact barcode, timestamp, product name,
 * and image URL.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { DEMO_MODE } from '@/lib/demo/demo-session';
import { getDemoDataset } from '@/lib/demo';
import { getProductByEan } from '@/lib/demo/product-catalogue';
import { validateEan } from '@/lib/api/clients/ean-lists';
import { buildScanResult } from '@/features/audit/scan.logic';
import type { ScanBackendOutcome, ScanResult } from '@/features/audit/scan.types';
import type { Role } from '@/lib/permissions';
import type { StoreScope } from '@/lib/api/core/scope-types';
import { UnauthorizedError, ApiRequestError } from '@/lib/api/core/errors';

const SCAN_TIMEOUT_MS = 5_000;

interface ScanRequestBody { barcode?: unknown }

function isAbortError(err: unknown): boolean {
  return err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError');
}

/** Shape of a demo audit item (from audit.ts items region). */
interface DemoAuditItem {
  ean: string;
  name: string;
  brand?: string;
  category?: string;
  status: string;
  imageUrl?: string | null;
}

/**
 * Build a rich demo ScanResult using the 100-product catalogue.
 *
 * Priority:
 *  1. Exact EAN match in the catalogue → return that product with real image.
 *  2. EAN in the audit items list → use that product (less detail).
 *  3. Any barcode → return the first catalogue item as a fallback demo product.
 */
function buildDemoScanResult(barcode: string, scope: StoreScope, scannedAt: string): ScanResult {
  // 1. Try exact match in product catalogue (richest data — has real imageUrl)
  const catalogueProduct = getProductByEan(barcode);
  if (catalogueProduct) {
    const outcome: ScanBackendOutcome = {
      found: true,
      valid: true,
      name: catalogueProduct.name,
      ean: catalogueProduct.ean,
      imageUrl: catalogueProduct.imageUrl,
    };
    return buildScanResult({ barcode, scannedAt, outcome });
  }

  // 2. Try the audit items region for the active scope
  const dataset = getDemoDataset('audit', scope);
  const items = (dataset?.regions.items as DemoAuditItem[] | undefined) ?? [];
  const auditItem = items.find(i => i.ean === barcode);

  if (auditItem) {
    const outcome: ScanBackendOutcome = {
      found: auditItem.status === 'matched',
      valid: true,
      name: auditItem.name,
      ean: auditItem.ean,
      imageUrl: auditItem.imageUrl ?? null,
    };
    return buildScanResult({ barcode, scannedAt, outcome });
  }

  // 3. Barcode not in any demo list → "not in list" (retain exact barcode)
  // Show first catalogue item as the "closest" known product for demo purposes
  const fallback = items[0] ?? null;
  const outcome: ScanBackendOutcome | null = fallback
    ? {
        found: false,
        valid: true,
        name: fallback.name,
        ean: barcode,           // keep the scanned barcode, not the fallback EAN
        imageUrl: fallback.imageUrl ?? null,
      }
    : null;

  return buildScanResult({ barcode, scannedAt, outcome });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  let body: ScanRequestBody;
  try {
    body = (await req.json()) as ScanRequestBody;
  } catch {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, { status: 400 });
  }

  const barcode = typeof body.barcode === 'string' ? body.barcode.trim() : '';
  if (!barcode) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'A barcode is required' } }, { status: 400 });
  }

  const rawStoreId = req.nextUrl.searchParams.get('storeId');
  const storeId = rawStoreId && rawStoreId !== 'all' ? rawStoreId : null;
  const scope: StoreScope = {
    tenantId: session.user.tenantId,
    storeId,
    role: session.user.role as Role,
  };
  const scannedAt = new Date().toISOString();

  // ── Demo mode ────────────────────────────────────────────────────────────
  if (DEMO_MODE || (session as unknown as Record<string, unknown>)._demo) {
    const result = buildDemoScanResult(barcode, scope, scannedAt);
    return NextResponse.json(result, { status: 200 });
  }

  // ── Real mode ─────────────────────────────────────────────────────────────
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);
  try {
    const res = await validateEan(barcode, storeId, controller.signal);
    const outcome: ScanBackendOutcome = {
      found: res.matched,
      valid: res.valid,
      name: res.product?.name ?? null,
      ean: res.product?.ean ?? res.ean,
      imageUrl: res.product?.imageUrl ?? null,
    };
    return NextResponse.json(buildScanResult({ barcode, scannedAt, outcome }), { status: 200 });
  } catch (err) {
    if (isAbortError(err)) {
      return NextResponse.json(buildScanResult({ barcode, scannedAt, outcome: null }), { status: 200 });
    }
    if (err instanceof UnauthorizedError || (err instanceof ApiRequestError && err.status === 401)) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' }, barcode, scannedAt }, { status: 401 });
    }
    const status = err instanceof ApiRequestError ? err.status : 502;
    return NextResponse.json({ error: { code: 'SCAN_FAILED', message: 'Scan lookup failed' }, barcode, scannedAt }, { status });
  } finally {
    clearTimeout(timeout);
  }
}
