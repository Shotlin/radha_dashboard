// Feature: dashboard-production-ready, scope-change refetch (R1.5, R8.7, R8.8)
/**
 * features/expiry/scope-change.test.tsx
 *
 * Component test for Store_Scope-change behaviour of the store-scoped data
 * hooks (exercised here via `useExpiryList`, whose query key includes
 * `storeId` through `qk.expiry`).
 *
 * Proves the R8.7/R8.8 + R1.5 contract end-to-end through a real
 * QueryClientProvider:
 *   1. storeId='s1' → fetch is issued for s1 and s1's data is shown.
 *   2. storeId='s2' with the s2 fetch held pending → a loading state is shown
 *      and the previous scope's (s1) data is NOT displayed during the refetch.
 *      This holds because the storeId is part of the query key, so the new key
 *      has no cached data and no hook opts into placeholderData/keepPreviousData.
 *   3. s2 fetch resolves → s2's data is shown, and the fetch URL carried
 *      storeId=s2 (scope was forwarded to the proxy).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useExpiryList } from './expiry.queries';

/* ── fetch mock: scope-tagged + deferrable per store ─────────────────────── */

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response;
}

// Tag each response with the requested storeId so a rendered value proves
// exactly which scope's data is on screen. `storeId` is the real scope field on
// `ExpiryRecord` (there is no `scope` field) — reading it back proves which
// store's data is rendered without inventing a non-domain property.
function scopedBody(storeId: string) {
  return { items: [{ id: `rec-${storeId}`, storeId }], total: 1, nextCursor: null };
}

let resolveS2: (() => void) | null = null;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resolveS2 = null;
  fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost');
    const storeId = url.searchParams.get('storeId');
    if (storeId === 's1') {
      return Promise.resolve(jsonResponse(scopedBody('s1')));
    }
    if (storeId === 's2') {
      // Hold the s2 fetch pending until the test explicitly releases it, so we
      // can observe the loading state during the scope-change refetch.
      return new Promise<Response>((resolve) => {
        resolveS2 = () => resolve(jsonResponse(scopedBody('s2')));
      });
    }
    return Promise.reject(new Error(`unexpected storeId: ${storeId}`));
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

/* ── harness ─────────────────────────────────────────────────────────────── */

function Harness({ storeId }: { storeId: string }) {
  const q = useExpiryList(storeId);
  if (q.isLoading) return <div>loading…</div>;
  if (q.isError) return <div>error</div>;
  return <div data-testid="scope">{q.data?.items[0]?.storeId ?? 'none'}</div>;
}

function tree(client: QueryClient, storeId: string) {
  return (
    <QueryClientProvider client={client}>
      <Harness storeId={storeId} />
    </QueryClientProvider>
  );
}

function fetchedStoreIds(): Array<string | null> {
  return fetchMock.mock.calls.map((call) =>
    new URL(String(call[0]), 'http://localhost').searchParams.get('storeId'),
  );
}

/* ── tests ───────────────────────────────────────────────────────────────── */

describe('useExpiryList store-scope change (R1.5, R8.7, R8.8)', () => {
  it('shows new-scope data and never shows previous-scope data during the refetch', async () => {
    // retry disabled so transient mock states never trigger backoff retries.
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });

    // 1. Initial scope s1 → fetch issued for s1, s1 data shown.
    const { rerender } = render(tree(client, 's1'));

    expect(await screen.findByTestId('scope')).toHaveTextContent('s1');
    expect(fetchedStoreIds()).toContain('s1');

    // 2. Change scope to s2 while its fetch is held pending (same client).
    rerender(tree(client, 's2'));

    // A loading state must appear, and the prior scope (s1) must NOT be shown
    // while the s2 refetch is in flight (R8.8 — no previous-scope data).
    expect(await screen.findByText('loading…')).toBeInTheDocument();
    expect(screen.queryByTestId('scope')).toBeNull();

    // The new scope must have been forwarded to the proxy (R8.7).
    await waitFor(() => expect(fetchedStoreIds()).toContain('s2'));

    // 3. Resolve the s2 fetch → s2 data shown (R8.7 / R1.5).
    expect(resolveS2).toBeTypeOf('function');
    resolveS2!();

    expect(await screen.findByTestId('scope')).toHaveTextContent('s2');
  });
});
