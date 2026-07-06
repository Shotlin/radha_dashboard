'use client';
/**
 * features/billing/components/checkout.tsx
 * Handles Razorpay flow: create order → open SDK → on success call /api/billing/verify.
 *
 * SECURITY (Doc 3 §B.5):
 * - NEXT_PUBLIC_RAZORPAY_KEY is the only Razorpay value on the client.
 * - Payment verification is server-side: client sends IDs to /api/billing/verify,
 *   which calls the backend verify endpoint with the session Bearer token.
 * - The Razorpay secret NEVER reaches the browser.
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ── Razorpay global type ─────────────────────────────────────────────────── */
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

interface CheckoutProps {
  orderId: string;
  amount: number;
  currency: string;
  tenantId: string;
  planName?: string;
  onSuccess: () => void;
  onError: (message: string) => void;
  onCancel?: () => void;
}

export function Checkout({
  orderId,
  amount,
  currency,
  tenantId,
  planName,
  onSuccess,
  onError,
  onCancel,
}: CheckoutProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Load Razorpay SDK via script tag
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Already loaded?
    if (window.Razorpay) {
      setScriptLoaded(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.onload = () => setScriptLoaded(true);
      existing.onerror = () => setScriptError(true);
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptError(true);
    document.body.appendChild(script);
    scriptRef.current = script;
    return () => {
      // Don't remove the script on unmount — it may be shared
    };
  }, []);

  const openCheckout = () => {
    if (!scriptLoaded || !window.Razorpay) {
      onError('Payment SDK not loaded. Please try again.');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY ?? '';

    const rzp = new window.Razorpay({
      key: publicKey,
      order_id: orderId,
      amount,
      currency,
      name: 'RADHA',
      description: planName ? `Upgrade to ${planName}` : 'Subscription Upgrade',
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        setIsVerifying(true);
        try {
          const res = await fetch('/api/billing/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              tenantId,
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            onError((err as { error?: string }).error ?? 'Verification failed. Contact support.');
          } else {
            onSuccess();
          }
        } catch {
          onError('Network error during verification. Contact support.');
        } finally {
          setIsVerifying(false);
        }
      },
      modal: {
        ondismiss: () => {
          onCancel?.();
        },
      },
    });

    rzp.open();
  };

  if (scriptError) {
    return (
      <p className="text-danger text-[13px]">
        Failed to load payment SDK. Please check your connection and try again.
      </p>
    );
  }

  return (
    <Button
      variant="primary"
      className={cn('w-full')}
      loading={!scriptLoaded || isVerifying}
      onClick={openCheckout}
      disabled={!scriptLoaded}
    >
      {isVerifying ? 'Verifying payment…' : 'Pay Now'}
    </Button>
  );
}
