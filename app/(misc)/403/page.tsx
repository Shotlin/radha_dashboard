import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Access Denied' };

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-6 py-12">
      <div className="card max-w-md w-full p-12 text-center flex flex-col items-center gap-5">
        {/* Eyebrow */}
        <p className="eyebrow">Error 403</p>

        {/* Lock icon */}
        <div className="w-14 h-14 rounded-full bg-[color:rgb(234_88_12_/_0.1)] flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1
          className="text-[26px] font-extrabold text-[var(--ink)]"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Access Denied
        </h1>
        <p className="text-[15px] text-[var(--ink-soft)] max-w-xs leading-relaxed">
          You don&apos;t have permission to view this page. Contact your admin if you believe this
          is a mistake.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--accent)] text-white font-semibold text-[15px] transition-transform active:scale-[0.98] mt-2"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
