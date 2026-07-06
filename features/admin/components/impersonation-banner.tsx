'use client';
/**
 * features/admin/components/impersonation-banner.tsx
 * Global banner: "You are impersonating [user]" when impersonation is active.
 * Shown when impersonation session is present in client session state.
 * "End session" button calls DELETE /admin/impersonate.
 */
import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth/use-session';
import { stopImpersonation } from '../admin.actions';
import { cn } from '@/lib/utils';

export function ImpersonationBanner() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [ending, setEnding] = useState(false);

  // Impersonation is active when the user has an impersonating flag in session.
  // Since the session shape doesn't yet include this explicitly, we look for a
  // conventional marker in permissions or a dedicated field from the backend.
  // Convention: the backend should include `"impersonating:TARGET_ID"` in permissions.
  const impersonatingPermission = user?.permissions?.find((p) => p.startsWith('impersonating:'));
  const targetId = impersonatingPermission?.replace('impersonating:', '');

  if (!targetId) return null;

  async function handleEnd() {
    setEnding(true);
    try {
      await stopImpersonation();
      // Invalidate session to reflect the ended impersonation
      void qc.invalidateQueries({ queryKey: ['session', 'me'] });
    } catch {
      // Best-effort
    } finally {
      setEnding(false);
    }
  }

  return (
    <div
      role="banner"
      aria-live="assertive"
      className={cn(
        'sticky top-14 z-20 w-full',
        'flex items-center gap-3 px-4 py-2.5',
        'bg-[color:rgb(180_83_9_/_0.12)] border-b-2 border-[var(--warn)]',
        'text-[var(--warn)]',
      )}
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span className="flex-1 text-[13px] font-semibold">
        You are currently impersonating user{' '}
        <span className="font-mono text-[var(--ink)]">{targetId}</span>.
        All actions are audited under your admin account.
      </span>
      <button
        type="button"
        onClick={() => void handleEnd()}
        disabled={ending}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-bold',
          'bg-[var(--warn)] text-white hover:opacity-90 transition-opacity',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
        aria-label="End impersonation session"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        {ending ? 'Ending…' : 'End session'}
      </button>
    </div>
  );
}
