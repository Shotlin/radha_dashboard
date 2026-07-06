'use client';

import { useCountUp } from '@/lib/hooks/use-count-up';
import { useIntersectionObserver } from '@/lib/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';

interface MonoNumberProps {
  value: number;
  /** Format function applied to the animated number */
  format?: (n: number) => string;
  /** Duration of count-up animation in ms. Default 600. */
  durationMs?: number;
  className?: string;
  'aria-label'?: string;
}

/**
 * MonoNumber — JetBrains Mono, tabular-nums, count-up on first viewport entry.
 * Count-up is triggered by IntersectionObserver, not mount (avoids off-screen animation waste).
 * Immediately shows final value under prefers-reduced-motion.
 */
export function MonoNumber({
  value,
  format = (n) => n.toLocaleString('en-IN'),
  durationMs = 600,
  className,
  'aria-label': ariaLabel,
}: MonoNumberProps) {
  const { ref, isVisible } = useIntersectionObserver(0.5);
  const animated = useCountUp(isVisible ? value : 0, durationMs);

  return (
    <span
      ref={ref as React.RefObject<HTMLSpanElement>}
      className={cn('font-mono tabular-nums', className)}
      aria-label={ariaLabel ?? format(value)}
    >
      {format(animated)}
    </span>
  );
}
