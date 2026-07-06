'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * useIntersectionObserver — fires `true` once when the element first enters the viewport.
 * Used to trigger count-up animations and SVG arc sweeps on first reveal.
 * Disconnects after the first intersection (fires exactly once).
 *
 * @param threshold - 0–1 ratio of element that must be visible before firing.
 */
export function useIntersectionObserver(threshold = 0.3): {
  ref: React.RefObject<HTMLDivElement | null>;
  isVisible: boolean;
} {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Respect reduced-motion: immediately reveal (skip observer setup)
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
