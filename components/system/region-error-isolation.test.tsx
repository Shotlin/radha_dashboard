// Feature: dashboard-production-ready, region error isolation (R10.3, R10.5)
/**
 * Component tests for per-region retry isolation and timeout-to-error rendering.
 *
 * Requirements:
 *   R10.3 — WHEN the Dashboard receives a timeout error from an API_Proxy, THE Dashboard
 *           SHALL render the affected region's error state with a visible error indication
 *           and a retry affordance.
 *   R10.5 — WHEN a user activates the retry affordance for a region in an error state,
 *           THE Dashboard SHALL re-issue only that region's failed request and SHALL swap
 *           that region to its loading state until the request completes.
 *
 * Implementation under test:
 *   - `components/system/region-state.tsx` (RegionState) — per-region
 *     loading/error/data wrapper using TanStack Query results.
 *   - `lib/hooks/use-region-load-guard.ts` — 10s load guard.
 *
 * Tests prove:
 *   1. A region in an error state renders RegionError (role="alert") while a
 *      sibling region with data keeps rendering its content (isolation — R10.1).
 *   2. Clicking retry on the errored region calls only THAT region's `refetch`,
 *      not its sibling's (per-region isolation — R10.5).
 *   3. A region still loading after 10s swaps to the error state (timeout — R10.3).
 *   4. While the errored region retries (loading), its sibling stays intact.
 */
import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegionState, type RegionQueryLike } from './region-state';

// ── matchMedia stub (jsdom lacks it; needed by useReducedMotion in RegionSkeleton) ──
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => vi.clearAllMocks());
afterAll(() => vi.restoreAllMocks());

// ── Helpers ────────────────────────────────────────────────────────────────

function makeQuery<T>(overrides: Partial<RegionQueryLike<T>> = {}): RegionQueryLike<T> {
  return {
    data: undefined,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

/**
 * Render two sibling regions inside the same container:
 *  - Region A: takes `queryA` — potentially errored/loading.
 *  - Region B: takes `queryB` — has data (should remain intact).
 */
function TwoRegions({
  queryA,
  queryB,
  timeoutMsA,
}: {
  queryA: RegionQueryLike<string>;
  queryB: RegionQueryLike<string>;
  timeoutMsA?: number;
}) {
  return (
    <div>
      <div data-testid="region-a">
        <RegionState query={queryA} variant="card" timeoutMs={timeoutMsA}>
          <div data-testid="region-a-content">{queryA.data}</div>
        </RegionState>
      </div>
      <div data-testid="region-b">
        <RegionState query={queryB} variant="list">
          <div data-testid="region-b-content">{queryB.data}</div>
        </RegionState>
      </div>
    </div>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Region error isolation (R10.1, R10.3, R10.5)', () => {
  it('an errored region shows error+retry while its sibling keeps its loaded data (R10.1)', () => {
    const queryA = makeQuery<string>({ data: undefined, isPending: false, isError: true });
    const queryB = makeQuery<string>({ data: 'Sibling data intact', isPending: false, isError: false });

    render(<TwoRegions queryA={queryA} queryB={queryB} />);

    // Region A is in the error state.
    const regionA = screen.getByTestId('region-a');
    expect(within(regionA).getByRole('alert')).toBeInTheDocument();
    expect(within(regionA).queryByTestId('region-a-content')).not.toBeInTheDocument();

    // Region B retains its last loaded data (not affected by sibling error).
    const regionB = screen.getByTestId('region-b');
    expect(within(regionB).getByTestId('region-b-content')).toHaveTextContent('Sibling data intact');
    expect(within(regionB).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('retry re-issues only THAT region\'s refetch, not the sibling\'s (R10.5)', () => {
    const queryA = makeQuery<string>({ data: undefined, isPending: false, isError: true });
    const queryB = makeQuery<string>({ data: 'Sibling intact', isPending: false, isError: false });

    render(<TwoRegions queryA={queryA} queryB={queryB} />);

    const regionA = screen.getByTestId('region-a');
    const retryButton = within(regionA).getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);

    // Only region A's refetch was called.
    expect(queryA.refetch).toHaveBeenCalledTimes(1);
    expect(queryB.refetch).not.toHaveBeenCalled();
  });

  it('a region pending past 10s swaps to an error state (timeout — R10.3)', () => {
    vi.useFakeTimers();
    try {
      const queryA = makeQuery<string>({ data: undefined, isPending: true, isError: false });
      const queryB = makeQuery<string>({ data: 'Sibling intact', isPending: false, isError: false });

      render(<TwoRegions queryA={queryA} queryB={queryB} timeoutMsA={10_000} />);

      // Before the timeout — still a skeleton, no error.
      const regionA = screen.getByTestId('region-a');
      expect(within(regionA).queryByRole('alert')).not.toBeInTheDocument();
      // The skeleton renders an aria-busy block.
      expect(regionA.querySelector('[aria-busy="true"]')).not.toBeNull();

      // Advance past the 10s timeout.
      act(() => { vi.advanceTimersByTime(10_000); });

      // After the timeout — region A shows error+retry.
      expect(within(regionA).getByRole('alert')).toBeInTheDocument();
      const retry = within(regionA).getByRole('button', { name: /try again/i });
      fireEvent.click(retry);
      expect(queryA.refetch).toHaveBeenCalledTimes(1);

      // Sibling keeps its loaded data throughout.
      expect(screen.getByTestId('region-b-content')).toHaveTextContent('Sibling intact');
    } finally {
      vi.useRealTimers();
    }
  });

  it('while the errored region retries (pending again), sibling data is preserved', () => {
    // Simulate the state after retry was clicked: queryA is now pending again.
    const queryA = makeQuery<string>({ data: undefined, isPending: true, isError: false });
    const queryB = makeQuery<string>({ data: 'Sibling still intact', isPending: false, isError: false });

    render(<TwoRegions queryA={queryA} queryB={queryB} timeoutMsA={10_000} />);

    // Region A is in loading state (skeleton).
    const regionA = screen.getByTestId('region-a');
    expect(within(regionA).queryByRole('alert')).not.toBeInTheDocument();

    // Region B is unaffected.
    expect(screen.getByTestId('region-b-content')).toHaveTextContent('Sibling still intact');
  });
});
