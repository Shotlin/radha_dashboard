'use client';

/**
 * features/_shared/product-image/product-image.tsx
 * <ProductImage> — the Product_Image_Service cell (R4.1–R4.9).
 *
 * A fixed-dimension product image cell with **zero layout shift** (R4.7, R4.9):
 * the outer box is sized from a size token (or explicit `width`/`height`) and
 * never changes size before, during, or after the image loads. The skeleton
 * backer and the Placeholder_Image both occupy that same fixed box.
 *
 * Resolution is driven by the pure state machine in `resolve-image.ts`
 * (`chooseImageSource` / `initialImageState` / `imageReducer`):
 *   • A non-empty Backend image URL → render it directly (R4.1).
 *   • No Backend URL but a non-empty EAN → resolve via the `/api/product-image`
 *     proxy (the backend's Open Food Facts integration) bounded to 5 s (R4.2);
 *     on miss/timeout → Placeholder_Image (R4.3, R4.5).
 *   • Neither → Placeholder_Image immediately, with no resolve request (R4.4).
 *   • A rendered `<img>` that fails to load → Placeholder_Image with a non-text
 *     broken-image indicator (R4.6).
 *
 * Tokens-only styling (token-lint applies): colors/radii come from Tailwind
 * token classes; the only raw dimensions are the fixed box width/height, which
 * are intrinsic layout values required to guarantee zero layout shift.
 */
import { useEffect, useState } from 'react';
import { ImageIcon, ImageOff } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';
import {
  chooseImageSource,
  imageReducer,
  initialImageState,
  type ImageEvent,
  type ImageState,
} from './resolve-image';

/** The 5-second budget for the OFF resolve request (R4.2, R4.3). */
const RESOLVE_TIMEOUT_MS = 5_000;

/** Named size tokens for the product cell (square boxes, in px). */
export type ProductImageSize = 'sm' | 'md' | 'lg' | 'xl';

/** Square edge length per size token. Layout dimensions — not color/spacing. */
const SIZE_PX: Record<ProductImageSize, number> = {
  sm: 40,
  md: 56,
  lg: 72,
  xl: 96,
};

export interface ProductImageProps {
  /** Backend-provided image URL, if any (resolution path 1 — R4.1). */
  backendImageUrl?: string | null;
  /** Product EAN used for the OFF lookup when no backend URL exists (R4.2). */
  ean?: string | null;
  /** Accessible name for the cell (product name, or a placeholder label). */
  alt: string;
  /** Size token for the fixed box. Defaults to `md`. Ignored if width/height set. */
  size?: ProductImageSize;
  /** Explicit fixed width in px (overrides `size`). */
  width?: number;
  /** Explicit fixed height in px (overrides `size`). */
  height?: number;
  className?: string;
}

/** The `/api/product-image` proxy response shape. */
interface ResolveResponse {
  url?: unknown;
}

/**
 * <ProductImage> — render a product image with a guaranteed-stable box.
 */
export function ProductImage({
  backendImageUrl = null,
  ean = null,
  alt,
  size = 'md',
  width,
  height,
  className,
}: ProductImageProps) {
  const reduced = useReducedMotion();

  // Fixed box: explicit width/height win; otherwise the square size token. These
  // never change across loading/image/placeholder states → zero layout shift.
  const boxWidth = width ?? SIZE_PX[size];
  const boxHeight = height ?? SIZE_PX[size];

  // Drive the pure state machine via useState so we can re-initialise cleanly
  // when the inputs change while still routing every transition through the
  // pure `imageReducer`.
  const [state, setState] = useState<ImageState>(() =>
    initialImageState({ backendImageUrl, ean }),
  );
  const apply = (event: ImageEvent) => setState((s) => imageReducer(s, event));

  useEffect(() => {
    const inputs = { backendImageUrl, ean };
    const source = chooseImageSource(inputs);

    // Reset to the initial state for the current inputs (image | loading |
    // placeholder('no-source')).
    setState(initialImageState(inputs));

    // Only the OFF path performs I/O; backend/placeholder are terminal already.
    if (source.kind !== 'off') return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS);
    let cancelled = false;

    fetch(`/api/product-image?ean=${encodeURIComponent(source.ean)}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`resolve-failed:${res.status}`);
        return res.json() as Promise<ResolveResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        const url = typeof data.url === 'string' && data.url.trim().length > 0 ? data.url : null;
        apply(url ? { type: 'off-resolved', url } : { type: 'off-miss' });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Abort = the 5 s window elapsed (R4.3); anything else = a miss (R4.5).
        const aborted = err instanceof Error && err.name === 'AbortError';
        apply(aborted ? { type: 'off-timeout' } : { type: 'off-miss' });
      })
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
    // Re-resolve only when the source inputs change.
  }, [backendImageUrl, ean]);

  const showImage = state.kind === 'image';
  const isLoadError = state.kind === 'placeholder' && state.reason === 'load-error';

  // The real <img> carries the accessible name via `alt`; in non-image states
  // the wrapper carries it via role="img" + aria-label so the cell is never
  // an unlabelled blank (R4.6 broken-image conveyed by icon + accessible label).
  const wrapperA11y = showImage
    ? {}
    : {
        role: 'img' as const,
        'aria-label': isLoadError ? `${alt} — image unavailable` : alt,
      };

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-md border border-hairline bg-surface-sunken',
        className,
      )}
      style={{ width: boxWidth, height: boxHeight }}
      {...wrapperA11y}
    >
      {state.kind === 'loading' && (
        <div
          className={cn('absolute inset-0', reduced ? 'bg-surface-sunken' : 'skeleton')}
          aria-hidden={true}
        />
      )}

      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element -- plain <img> keeps
        // the fixed box and avoids next/image loader config for OFF/CDN hosts.
        <img
          src={state.url}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => apply({ type: 'load-error' })}
        />
      )}

      {state.kind === 'placeholder' && (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden={true}>
          {isLoadError ? (
            <ImageOff className="h-1/3 w-1/3 text-ink-soft" />
          ) : (
            <ImageIcon className="h-1/3 w-1/3 text-ink-soft" />
          )}
        </div>
      )}
    </div>
  );
}

export default ProductImage;
