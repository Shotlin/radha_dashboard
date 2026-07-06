'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * useCountUp — animates a number from 0 to `target` over `durationMs`.
 * Immediately returns `target` when the user has prefers-reduced-motion set.
 * Uses rAF for smooth animation; safe to interrupt mid-animation.
 */
export function useCountUp(target: number, durationMs = 600): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    // Respect reduced-motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }

    // Cancel any running animation
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    setValue(0);

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      // easeOut cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return value;
}
