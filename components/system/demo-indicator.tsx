'use client';
/**
 * components/system/demo-indicator.tsx — persistent Demo_Indicator (R2.1–R2.3).
 *
 * Rendered inside the persistent DashShell, above <main>, so it stays visible
 * while the page content scrolls (main is the scroll region, this bar is its
 * sibling) and across client navigations (the shell never unmounts).
 *
 * It is driven entirely by client session state via `useSession()`:
 *   - Present only when the session is a demo session (`user.isDemo === true`)
 *     — R2.1. The `isDemo` flag is surfaced by `/api/auth/me` and never carries
 *     any token.
 *   - Absent entirely when demo mode is off (`user.isDemo` falsy) — R2.2.
 *   - Because presence is bound to the TanStack-Query session state, toggling
 *     demo mode flips the indicator on the next session read (well within 1 s)
 *     with no manual page reload — R2.3.
 *
 * Festive accent per the Visual Bible: the warm accent-tint well + marigold
 * hairline (NOT the orange CTA accent). Tokens-only styling (token-lint clean).
 */
import { Sparkles } from 'lucide-react';
import { useSession } from '@/lib/auth/use-session';
import { cn } from '@/lib/utils';

export function DemoIndicator() {
  const { user } = useSession();

  // Only a demo session shows the indicator (R2.1 / R2.2).
  if (!user?.isDemo) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-demo-indicator=""
      className={cn(
        'flex items-center justify-center gap-2 w-full',
        'px-4 py-2',
        'bg-[var(--accent-tint)] border-b border-[var(--marigold)]',
        'text-[var(--accent-deep)]',
      )}
    >
      <Sparkles className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span className="text-[13px] font-semibold tracking-wide">
        Demo data — sample content, not live business data
      </span>
    </div>
  );
}
