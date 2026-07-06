/**
 * components/system/needs-backend.tsx
 * NeedsBackend banner — displays an informational banner over a layout preview
 * for features that require a proposed (🆕) backend endpoint.
 *
 * Usage:
 *   <NeedsBackend route="POST /api/v1/users/invite" description="Team invitation flow">
 *     <MyLayoutPreview />
 *   </NeedsBackend>
 *
 * The children (layout preview) is shown blurred behind an overlay so users can
 * see the value without being able to interact with it.
 * Inspired by LockedOverlay but for "not yet built" rather than "upgrade to unlock".
 */
import { type ReactNode } from 'react';
import { Construction, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NeedsBackendProps {
  /** The backend endpoint that needs to be implemented, e.g. "POST /api/v1/users/invite" */
  route: string;
  /** Human-readable description of what this feature does */
  description: string;
  /** Optional layout preview to show blurred behind the banner */
  children?: ReactNode;
  className?: string;
}

/**
 * NeedsBackend — shows a "this feature needs a backend endpoint" info banner.
 *
 * If children are provided, they are rendered behind a blur overlay so the
 * layout design is visible but non-interactive (same pattern as LockedOverlay).
 * If no children are provided, only the banner is shown.
 */
export function NeedsBackend({ route, description, children, className }: NeedsBackendProps) {
  if (!children) {
    return (
      <Banner route={route} description={description} className={className} />
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Info banner always at top */}
      <Banner route={route} description={description} />

      {/* Layout preview blurred + non-interactive */}
      <div className="relative rounded-lg overflow-hidden">
        <div
          className="pointer-events-none select-none blur-[4px] opacity-50"
          aria-hidden="true"
        >
          {children}
        </div>

        {/* Overlay scrim */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-[var(--surface)]/60 backdrop-blur-[2px] rounded-lg"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <Construction className="h-8 w-8 text-[var(--ink-soft)]" />
            <p className="text-[13px] font-semibold text-[var(--ink-soft)]">
              In development
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Info banner ─────────────────────────────────────────────────────────── */
function Banner({
  route,
  description,
  className,
}: {
  route: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      role="note"
      aria-label="Feature requires backend endpoint"
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg',
        'bg-[color:rgb(15_118_110_/_0.06)] border border-[color:rgb(15_118_110_/_0.25)]',
        className,
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Terminal className="h-5 w-5 text-[var(--teal)]" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-[14px] font-semibold text-[var(--ink)]">
          🆕 Proposed feature — backend endpoint required
        </p>
        <p className="text-[13px] text-[var(--ink-soft)]">{description}</p>
        <p className="text-[12px] text-[var(--teal)] font-mono mt-0.5 break-all">
          This feature requires backend endpoint:{' '}
          <code className="bg-[color:rgb(15_118_110_/_0.1)] px-1.5 py-0.5 rounded text-[var(--teal)]">
            {route}
          </code>
          {' '}— it is currently in development.
        </p>
      </div>
    </div>
  );
}
