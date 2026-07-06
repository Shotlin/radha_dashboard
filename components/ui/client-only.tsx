'use client';
/**
 * components/ui/client-only.tsx
 * 
 * Renders children only on the client (after hydration).
 * Prevents hydration mismatches in pages that use TanStack Query
 * loading states — the skeleton/loading states differ from the 
 * server-rendered HTML that has no session/data context.
 * 
 * Use this wrapper on client-rendered dashboard page containers.
 */
import { useEffect, useState, type ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  /** Optional fallback to show on the server/before mount */
  fallback?: ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
