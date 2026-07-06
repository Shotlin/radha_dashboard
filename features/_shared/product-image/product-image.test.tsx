// Feature: dashboard-production-ready, zero layout shift (R4.7, R4.9)
//
// Component test for <ProductImage> proving the cell's outer box has a fixed
// width/height that is identical before, during, and after the image loads,
// across every resolution state (image · loading · placeholder).
//
// Validates: Requirements 4.7, 4.9
//
// R4.7: WHILE a product image is being resolved or loaded, the cell's fixed
//       dimensions are occupied by the skeleton/placeholder backer.
// R4.9: WHEN a product image or the Placeholder_Image is displayed, the cell's
//       outer dimensions remain unchanged before, during, and after the image
//       loads (zero layout shift).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { ProductImage } from '@/features/_shared/product-image/product-image';

// Read the outer wrapper's inline box. React renders numeric width/height as
// `<n>px`; we assert on the exact string the browser would lay out with. In the
// placeholder/error states the wrapper itself carries role="img", so queries are
// scoped to the render `container` (the wrapper's parent) to include it.
function boxOf(wrapper: HTMLElement): { width: string; height: string } {
  return { width: wrapper.style.width, height: wrapper.style.height };
}

beforeEach(() => {
  // useReducedMotion() calls window.matchMedia in an effect; jsdom lacks it.
  // Re-stub each test since afterEach → vi.unstubAllGlobals() clears it.
  if (!window.matchMedia) {
    vi.stubGlobal(
      'matchMedia',
      (query: string) =>
        ({
          matches: false,
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
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('<ProductImage> — zero layout shift (R4.7, R4.9)', () => {
  beforeEach(() => {
    // Default: a fetch that never settles, so the OFF path stays in `loading`
    // unless a test overrides it. Individual cases stub their own behavior.
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
  });

  it('Case 1 — backend URL: box is unchanged from <img> through a load error to placeholder', () => {
    const { container } = render(
      <ProductImage backendImageUrl="https://cdn.example/p.png" alt="Parle-G" size="md" />,
    );
    const wrapper = container.firstChild as HTMLElement;
    const view = within(container);

    // BEFORE: a backend URL renders an <img> immediately, in a 56px (md) box.
    const before = boxOf(wrapper);
    expect(before).toEqual({ width: '56px', height: '56px' });
    const img = view.getByRole('img', { name: 'Parle-G' });
    expect(img.tagName).toBe('IMG');

    // No OFF request is issued for the backend path (R4.1) — guards the test.
    expect(fetch).not.toHaveBeenCalled();

    // DURING/AFTER: the <img> fails to load → placeholder takes over the box.
    fireEvent.error(img);
    const placeholder = view.getByRole('img', { name: 'Parle-G — image unavailable' });
    expect(placeholder).toBe(wrapper); // the wrapper div now carries the label
    expect(placeholder.tagName).not.toBe('IMG');

    // UNCHANGED: the outer box dimensions are identical after the swap.
    expect(boxOf(wrapper)).toEqual(before);
  });

  it('Case 2a — EAN only: box is unchanged from loading through a resolved OFF image', async () => {
    // A controlled fetch we resolve by hand to observe the loading → image swap.
    let resolveFetch!: (value: Response) => void;
    const deferred = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal('fetch', vi.fn(() => deferred));

    const { container } = render(<ProductImage ean="8901234567890" alt="Lookup" size="lg" />);
    const wrapper = container.firstChild as HTMLElement;
    const view = within(container);

    // DURING: no backend URL but an EAN → loading skeleton fills the 72px (lg) box.
    const during = boxOf(wrapper);
    expect(during).toEqual({ width: '72px', height: '72px' });
    // loading: the skeleton fills the box; no real <img> element has rendered yet
    // (the wrapper itself carries role="img" + aria-label so the cell is labelled).
    expect(container.querySelector('img')).toBeNull();

    // Resolve the OFF lookup to a usable image URL.
    resolveFetch({
      ok: true,
      json: async () => ({ url: 'https://images.openfoodfacts.org/x.jpg' }),
    } as Response);

    const img = await view.findByAltText('Lookup');
    expect(img.tagName).toBe('IMG');

    // AFTER: box unchanged once the resolved image renders.
    expect(boxOf(wrapper)).toEqual(during);
  });

  it('Case 2b — EAN only: box is unchanged from loading through an OFF miss to placeholder', async () => {
    let resolveFetch!: (value: Response) => void;
    const deferred = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal('fetch', vi.fn(() => deferred));

    const { container } = render(<ProductImage ean="0000000000000" alt="Missing" size="md" />);
    const wrapper = container.firstChild as HTMLElement;
    const view = within(container);

    const during = boxOf(wrapper);
    expect(during).toEqual({ width: '56px', height: '56px' });

    // Resolve to a miss ({ url: null }) → Placeholder_Image (R4.5).
    resolveFetch({ ok: true, json: async () => ({ url: null }) } as Response);

    const placeholder = await view.findByRole('img', { name: 'Missing' });
    expect(placeholder).toBe(wrapper);
    expect(placeholder.tagName).not.toBe('IMG');

    // AFTER: box unchanged once the placeholder renders.
    expect(boxOf(wrapper)).toEqual(during);
  });

  it('Case 3 — no URL and no EAN: placeholder renders immediately in the fixed box', () => {
    const { container } = render(<ProductImage alt="Empty" size="xl" />);
    const wrapper = container.firstChild as HTMLElement;
    const view = within(container);

    // Placeholder shows at once with no OFF request (R4.4); box is the 96px (xl) token.
    expect(boxOf(wrapper)).toEqual({ width: '96px', height: '96px' });
    expect(fetch).not.toHaveBeenCalled();
    const placeholder = view.getByRole('img', { name: 'Empty' });
    expect(placeholder).toBe(wrapper);
    expect(placeholder.tagName).not.toBe('IMG');
  });

  it('explicit width/height override the size token and still fix the box', () => {
    const { container } = render(<ProductImage alt="Custom" width={120} height={64} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(boxOf(wrapper)).toEqual({ width: '120px', height: '64px' });
  });
});
