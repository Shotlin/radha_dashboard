'use client';
/**
 * Email verification page — (auth)/verify?token=xxx
 * Submits POST /api/auth/verify-email and shows result.
 *
 * useSearchParams must be inside a Suspense boundary in Next.js 15 (App Router).
 */
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Missing verification token.');
      return;
    }

    let cancelled = false;
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          setStatus('success');
        } else {
          const err = (await res.json().catch(() => ({}))) as { message?: string };
          setStatus('error');
          setErrorMsg(err.message ?? 'Verification failed. The link may have expired.');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg('A network error occurred. Please try again.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-6">
      <div className="card p-10 text-center max-w-md flex flex-col gap-4 items-center">
        {status === 'pending' && (
          <>
            <div className="w-10 h-10 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin" aria-label="Verifying…" />
            <p className="text-[15px] text-[var(--ink-soft)]">Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full bg-[color:rgb(21_128_61_/_0.1)] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <h1 className="text-[20px] font-bold text-[var(--ink)]">Email verified!</h1>
            <p className="text-[14px] text-[var(--ink-soft)]">Your email has been confirmed. You can now sign in.</p>
            <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold text-[15px] transition-transform active:scale-[0.98]">
              Sign in
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-[color:rgb(185_28_28_/_0.1)] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h1 className="text-[20px] font-bold text-[var(--ink)]">Verification failed</h1>
            <p className="text-[14px] text-[var(--ink-soft)]">{errorMsg}</p>
            <Link href="/login" className="text-[13px] text-[var(--accent)] font-medium hover:underline">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function VerifyFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-6">
      <div className="card p-10 text-center max-w-md flex flex-col gap-4 items-center">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin" aria-label="Loading…" />
        <p className="text-[15px] text-[var(--ink-soft)]">Loading…</p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyContent />
    </Suspense>
  );
}
