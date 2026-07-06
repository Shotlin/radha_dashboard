'use client';
/**
 * lib/api/core/query-client.tsx — TanStack Query provider with RADHA defaults.
 *
 * This replaces the Phase 03 QueryProvider (identical interface, enhanced defaults).
 * Mounted in the root layout.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { UnauthorizedError, RateLimitError } from './errors';
import { exponentialBackoffMs } from './rate';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 min default
        // gcTime keeps unmounted query data in the cache for 5 min, so revisiting a
        // Feature_Area page within that window serves the cached data instantly
        // (well within 500ms) instead of starting from a blank loading state (R5.5).
        gcTime: 5 * 60 * 1000, // 5 min cache
        // Cache-then-revalidate (R5.5 + R5.7): on every (re)mount we trigger a
        // background refetch even when the cached data is still "fresh" per
        // staleTime. TanStack serves the cached data synchronously (no loading
        // flash — `isPending` stays false while `isFetching` is true), then swaps
        // in the revalidated data automatically when it differs (R5.7). This is the
        // single config that turns a revisit into "show cached now, refresh quietly".
        refetchOnMount: 'always',
        // NOTE (R8.8): we deliberately do NOT set a global `placeholderData`/
        // `keepPreviousData`. Store-scoped query keys include `storeId`, so a
        // Store_Scope change is a new key with no cached data → the region shows
        // a loading state instead of the previous scope's data while it refetches.
        retry: (failureCount, error) => {
          if (error instanceof UnauthorizedError) return false;
          if (error instanceof RateLimitError) return failureCount < 3;
          return failureCount < 2;
        },
        retryDelay: (attempt, error) => {
          if (error instanceof RateLimitError) return error.retryAfterMs;
          return exponentialBackoffMs(attempt);
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserClient) browserClient = makeQueryClient();
  return browserClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => getQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
