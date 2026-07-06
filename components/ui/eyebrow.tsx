import { cn } from '@/lib/utils';

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  /** 'soft' = ink-soft (default), 'accent' = accent-deep */
  variant?: 'soft' | 'accent';
}

/**
 * Eyebrow label — 11px, w600, +0.06em tracking, uppercase.
 * Opens every major section. Tokens-only.
 */
export function Eyebrow({ children, className, variant = 'soft' }: EyebrowProps) {
  return (
    <p
      className={cn(
        'text-[11px] font-semibold tracking-[0.06em] uppercase',
        variant === 'soft' && 'text-ink-soft',
        variant === 'accent' && 'text-accent-deep',
        className,
      )}
    >
      {children}
    </p>
  );
}
