/**
 * POST /api/billing/verify — server-side Razorpay payment verification.
 *
 * SECURITY (Doc 3 §B.5):
 * - The Razorpay SECRET never leaves the server — it is used only by the backend.
 * - This Route Handler forwards the payment IDs + signature to the backend
 *   `/payments/verify` endpoint (server-to-server, with session Bearer).
 * - The client receives only the updated subscription — never a raw payment token.
 * - Webhook (`POST /payments/webhooks/razorpay`) is the backend's source of truth;
 *   this verify call is the client-flow confirmation path.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/api/clients/subscriptions';
import { getSession } from '@/lib/auth/session';
import { VerifyPaymentInputSchema } from '@/features/billing/billing.schema';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = VerifyPaymentInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  // Enforce tenantId matches the session to prevent cross-tenant abuse
  if (parsed.data.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: 'Forbidden: tenantId mismatch' }, { status: 403 });
  }

  try {
    // Server-to-server: calls backend with session Bearer — secret never exposed to client
    const result = await verifyPayment(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
