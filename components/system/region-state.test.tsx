// Feature: dashboard-production-ready, navigation behavior (R5.2,5.5,5.6,5.7)
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { RegionState, type RegionQueryLike } from './region-state';

/**
 * Component tests for RegionState navigation behavior.
 *
 * RegionState drives a single page region through its loading / loaded / error
 * lifecycle from a TanStack Query result:
 *   - data present        → children (even while revalidating)        (R5.5, R5.7)
 *   - loading <10s         → RegionSkeleton                            (R5.2)
 *   - loading ≥10s OR error → RegionError with retry                   (R5.6)
 *
 * jsdom lacks `window.matchMedia`, which RegionSkeleton needs via
 * useReducedMotion — mock it here. The 10s load guard is driven by fake timers.
 */

// ── window.matchMedia mock (jsdom lacks it; useReducedMotion in RegionSkeleton uses it) ──
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

afterEach(() => {
  vi.clearAllMocks();
});

/** Build a fake query result that satisfies RegionQueryLike. */
function makeQuery<T>(overrides: Partial<RegionQueryLike<T>> = {}): RegionQueryLike<T> {
  return {
    data: undefined,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

describe('RegionState navigation behavior', () => {
  // 1. Skeleton-on-navigation (R5.2): pending, no data, no error → RegionSkeleton.
  it('renders a skeleton while a freshly-navigated region is pending (R5.2)', () => {
    const query = makeQuery<string>({ data: undefined, isPending: true, isError: false });

    const { container } = render(
      <RegionState query={query} variant="card">
        <div>region content</div>
      </RegionState>,
    );

    // Skeleton present (aria-busy block), children NOT rendered.
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText('region content')).not.toBeInTheDocument();
    // Not an error state.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // 2. Cached revisit / background-update render (R5.5, R5.7).
  it('renders cached children immediately on revisit, even while revalidating (R5.5)', () => {
    // Cached data present while a background refetch runs (isPending false, but
    // data is what matters): children show immediately, no skeleton.
    const query = makeQuery<string>({ data: 'cached value', isPending: false, isError: false });

    const { container } = render(
      <RegionState query={query}>
        <div>{query.data}</div>
      </RegionState>,
    );

    expect(screen.getByText('cached value')).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('applies a background data update without dropping to a skeleton (R5.7)', () => {
    const initial = makeQuery<string>({ data: 'stale value', isPending: false, isError: false });

    const { container, rerender } = render(
      <RegionState query={initial}>
        <div>{initial.data}</div>
      </RegionState>,
    );

    expect(screen.getByText('stale value')).toBeInTheDocument();

    // Background revalidation completes → TanStack swaps in fresh data.
    const updated = makeQuery<string>({ data: 'fresh value', isPending: false, isError: false });
    rerender(
      <RegionState query={updated}>
        <div>{updated.data}</div>
      </RegionState>,
    );

    expect(screen.getByText('fresh value')).toBeInTheDocument();
    expect(screen.queryByText('stale value')).not.toBeInTheDocument();
    // Never showed a skeleton during the background update.
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
  });

  // 3. 10s error swap (R5.6): pending past 10s with no data → RegionError + retry.
  it('swaps a still-pending region to an error with retry after 10s (R5.6)', () => {
    vi.useFakeTimers();
    try {
      const query = makeQuery<string>({ data: undefined, isPending: true, isError: false });

      const { container } = render(
        <RegionState query={query}>
          <div>region content</div>
        </RegionState>,
      );

      // Within the window → still a skeleton, no error.
      expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // Advance past the default 10s load guard.
      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      // Now an error region with a retry control.
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(container.querySelector('[aria-busy="true"]')).toBeNull();

      const retry = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retry);
      expect(query.refetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  // 4. Error state: isError true, no data → RegionError immediately; retry refetches.
  it('renders an error with retry immediately when the query errors with no data', () => {
    const query = makeQuery<string>({ data: undefined, isPending: false, isError: true });

    const { container } = render(
      <RegionState query={query}>
        <div>region content</div>
      </RegionState>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    expect(screen.queryByText('region content')).not.toBeInTheDocument();

    const retry = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retry);
    expect(query.refetch).toHaveBeenCalledTimes(1);
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});
