/**
 * GET /api/product-image?ean=<ean> — the Product_Image_Service resolve proxy.
 *
 * Resolves a product image URL for a scanned/listed EAN via the backend's
 * product lookup, which backfills from the Open Food Facts integration (BE-11)
 * when the local catalog has no row (Requirement 4.2). The session tenant is
 * carried by the server-side Bearer token; the backend enforces scope.
 *
 * Behaviour:
 *  • No/blank `ean` → `{ url: null }` immediately, no backend call (R4.4).
 *  • Demo mode (DEMO_MODE env or a `_demo` session) → `{ url: null }` without
 *    touching the backend (honest-data: demo never calls the backend). Demo
 *    datasets carry their own `imageUrl`, so the component renders that directly
 *    or shows the Placeholder_Image.
 *  • Real mode → bound the backend lookup with a 5-second `AbortController`
 *    (R4.2). On a hit, return `{ url }` with the backend-provided image URL.
 *  • Miss, timeout (5 s elapsed), or any transport/backend failure → `{ url:
 *    null }` so the component shows the Placeholder_Image (R4.3, R4.5). A 401
 *    is surfaced so the client auth layer can refresh/redirect (Requirement 6).
 *
 * Honest-data: the response carries only what the backend returns — never a
 * fabricated or demo-origin image URL when demo mode is off.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { DEMO_MODE } from '@/lib/demo/demo-session';
import { resolveProductImageByEan } from '@/lib/api/clients/products';
import { UnauthorizedError, ApiRequestError } from '@/lib/api/core/errors';

/** The 5-second window the OFF/backend image lookup is bounded to (R4.2). */
const IMAGE_TIMEOUT_MS = 5_000;

/** True for a request that was aborted because the 5-second window elapsed. */
function isAbortError(err: unknown): boolean {
  return err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError');
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 },
    );
  }

  // No EAN to resolve → placeholder path, never issue a backend/OFF request (R4.4).
  const ean = (req.nextUrl.searchParams.get('ean') ?? '').trim();
  if (ean.length === 0) {
    return NextResponse.json({ url: null }, { status: 200 });
  }

  // Demo mode — never touch the backend (honest-data). The component renders any
  // demo-supplied `imageUrl` directly or shows the Placeholder_Image.
  if (DEMO_MODE || (session as unknown as Record<string, unknown>)._demo) {
    return NextResponse.json({ url: null }, { status: 200 });
  }

  // Real mode — bound the backend lookup to 5 seconds (R4.2).
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
  try {
    const { url } = await resolveProductImageByEan(ean, controller.signal);
    return NextResponse.json({ url }, { status: 200 });
  } catch (err) {
    // 5-second window elapsed, or a miss/transport/backend failure → placeholder
    // (R4.3, R4.5): the proxy honestly reports "no image" as a null URL.
    if (isAbortError(err)) {
      return NextResponse.json({ url: null }, { status: 200 });
    }

    // 401 → let the client's auth layer refresh/redirect (Requirement 6).
    if (
      err instanceof UnauthorizedError ||
      (err instanceof ApiRequestError && err.status === 401)
    ) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 },
      );
    }

    // Any other failure is reported honestly as "no image" so the cell falls back
    // to the Placeholder_Image without disrupting the rest of the page (R4.5).
    return NextResponse.json({ url: null }, { status: 200 });
  } finally {
    clearTimeout(timeout);
  }
}
