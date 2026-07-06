// Feature: dashboard-production-ready, visual rules (R9.2-9.8)
//
// Component test for the first-class designed system states proving the
// dashboard's visual quality rules hold at the component level:
//   - Brand foundations applied via tokens (R9.2)
//   - At most one orange CTA per region (R9.3)
//   - Designed empty / skeleton / error states (R9.4, R9.5, R9.6)
//   - Reduced-motion suppresses skeleton shimmer (R9.7)
//   - Interactive controls are real buttons with accessible names + focus (R9.8)
//
// user-event is NOT installed; interactions use fireEvent.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EmptyState } from '@/components/system/empty-state';
import { RegionError } from '@/components/system/region-error';
import { RegionSkeleton } from '@/components/system/region-skeleton';

// useReducedMotion() calls window.matchMedia in an effect; jsdom lacks it.
// Default stub returns matches:false (motion allowed); reduced-motion tests
// override the global before rendering.
function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('EmptyState — designed empty state + one CTA (R9.4, R9.3)', () => {
  it('renders the title, exactly one support line, and exactly ONE call-to-action', () => {
    const { container } = render(
      <EmptyState
        title="No expiries logged"
        supportLine="Scan products to start tracking their expiry dates."
        cta={{ label: 'Scan a product', onClick: () => {} }}
      />,
    );

    // Title (R9.4)
    expect(screen.getByRole('heading', { name: 'No expiries logged' })).toBeInTheDocument();

    // Exactly one supporting line of text (R9.4): the support paragraph.
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toHaveTextContent('Scan products to start tracking their expiry dates.');

    // Exactly ONE call-to-action in the region (R9.3 one-CTA-per-region).
    const buttons = within(container).getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAccessibleName('Scan a product');
  });

  it('renders the tonal icon as aria-hidden decoration', () => {
    const { container } = render(
      <EmptyState title="Nothing here" supportLine="Try again later." />,
    );
    // The tonal icon badge is decorative — hidden from assistive tech.
    const decorativeIcon = container.querySelector('svg[aria-hidden="true"]');
    expect(decorativeIcon).not.toBeNull();
  });

  it('uses brand token classes on the wrapper and the orange primary CTA (R9.2)', () => {
    const { container } = render(
      <EmptyState
        title="No data"
        supportLine="Nothing to show yet."
        cta={{ label: 'Add item', onClick: () => {} }}
      />,
    );

    // Wrapper carries token classes (sunken surface + hairline border) — not raw hex.
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('bg-surface-sunken');
    expect(wrapper.className).toContain('border-hairline');

    // The single CTA uses the primary/accent variant (orange) — token-driven.
    const cta = within(container).getByRole('button', { name: 'Add item' });
    expect(cta.className).toContain('bg-accent');
  });
});

describe('RegionError — error indication + retry (R9.6)', () => {
  it('announces the failure via role="alert" and fires onRetry on click', () => {
    const onRetry = vi.fn();
    const { container } = render(<RegionError onRetry={onRetry} />);

    // Error indication is announced to assistive tech (R9.6).
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();

    // A retry control exists and re-issues the region's request on click (R9.6).
    const retry = within(container).getByRole('button', { name: /try again/i });
    expect(onRetry).not.toHaveBeenCalled();
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('uses brand token classes on the error wrapper (R9.2)', () => {
    const { container } = render(<RegionError onRetry={() => {}} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('bg-surface-sunken');
    expect(wrapper.className).toContain('border-hairline');
  });
});

describe('RegionSkeleton — reduced-motion suppresses shimmer (R9.7)', () => {
  it('uses the animated shimmer block when motion is allowed', () => {
    stubMatchMedia(false);
    const { container } = render(<RegionSkeleton variant="card" />);
    // At least one block uses the shimmer `skeleton` class.
    expect(container.querySelector('.skeleton')).not.toBeNull();
    // And none fall back to the static sunken block.
    expect(container.querySelector('.bg-surface-sunken')).toBeNull();
  });

  it('uses the static (non-shimmer) block when reduced-motion is preferred', () => {
    stubMatchMedia(true);
    const { container } = render(<RegionSkeleton variant="card" />);
    // Shimmer is suppressed: static tonal block instead of `.skeleton`.
    expect(container.querySelector('.skeleton')).toBeNull();
    expect(container.querySelector('.bg-surface-sunken')).not.toBeNull();
  });
});

describe('Focus / accessible name (R9.8)', () => {
  it('EmptyState CTA is a real button reachable by accessible name', () => {
    render(
      <EmptyState
        title="Empty"
        supportLine="Nothing yet."
        cta={{ label: 'Create your first task', onClick: () => {} }}
      />,
    );
    const cta = screen.getByRole('button', { name: 'Create your first task' });
    expect(cta.tagName).toBe('BUTTON');
    // Reachable by keyboard focus.
    cta.focus();
    expect(cta).toHaveFocus();
  });

  it('RegionError retry is a real button reachable by accessible name', () => {
    render(<RegionError onRetry={() => {}} retryLabel="Retry now" />);
    const retry = screen.getByRole('button', { name: 'Retry now' });
    expect(retry.tagName).toBe('BUTTON');
    retry.focus();
    expect(retry).toHaveFocus();
  });
});
