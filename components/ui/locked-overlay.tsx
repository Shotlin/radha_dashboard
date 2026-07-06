import { Lock } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface LockedOverlayProps {
  /** The real content to render behind the overlay */
  children: React.ReactNode;
  title?: string;
  description?: string;
  ctaLabel?: string;
  onUpgrade?: () => void;
  className?: string;
}

/**
 * Locked Overlay (Doc 2 §4.12) — real layout rendered behind blur/scrim + lock glyph + plan CTA.
 * Shows value behind glass; never a blank wall. Paid surfaces only.
 */
export function LockedOverlay({
  children,
  title = 'Premium feature',
  description = 'Upgrade your plan to unlock this feature.',
  ctaLabel = 'View plans',
  onUpgrade,
  className,
}: LockedOverlayProps) {
  return (
    <div className={cn('relative rounded-lg overflow-hidden', className)}>
      {/* Real content blurred */}
      <div className="pointer-events-none select-none blur-[6px] opacity-60" aria-hidden="true">
        {children}
      </div>

      {/* Scrim + CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/70 backdrop-blur-[2px] rounded-lg">
        <div className="w-12 h-12 rounded-full bg-accent-tint flex items-center justify-center">
          <Lock className="h-6 w-6 text-accent-deep" aria-hidden="true" />
        </div>
        <div className="text-center px-6">
          <p className="text-[16px] font-bold text-ink">{title}</p>
          <p className="text-[13px] text-ink-soft mt-1 max-w-[240px]">{description}</p>
        </div>
        {onUpgrade && (
          <Button variant="primary" size="sm" onClick={onUpgrade}>
            {ctaLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
