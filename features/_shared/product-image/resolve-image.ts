/**
 * features/_shared/product-image/resolve-image.ts — pure image-source state machine.
 *
 * The single source of truth for how the Product_Image_Service decides *which*
 * source to attempt and how a resolution attempt terminates. Every function
 * here is pure (no I/O, no React, no `server-only`) so it can run in the
 * client component (`<ProductImage>`), the server resolve proxy, and tests
 * alike.
 *
 * Resolution order (R4.1, R4.2, R4.4):
 *   1. A non-empty Backend image URL  → render it directly.
 *   2. No Backend URL but a non-empty EAN → look it up via Open Food Facts
 *      (issued by the caller with a 5 s timeout).
 *   3. Neither → the Placeholder_Image immediately, with no OFF request.
 *
 * Whitespace-only strings count as empty throughout.
 *
 * Termination (R4.3, R4.5, R4.6): the machine's only non-terminal state is
 * `loading`. Every OFF outcome (resolved / miss / timeout) and every image
 * load error moves it to a terminal `image` or `placeholder` state, so
 * resolution can never get stuck in `loading`.
 */

/** The visual state of a single product-image cell. */
export type ImageState =
  | { kind: 'loading' }
  | { kind: 'image'; url: string }
  | { kind: 'placeholder'; reason: 'no-source' | 'off-timeout' | 'load-error' | 'exhausted' };

/** The raw inputs a product cell carries before any image request is made. */
export interface ImageInputs {
  backendImageUrl: string | null;
  ean: string | null;
}

/** The initial resolution path chosen from {@link ImageInputs}. */
export type ImageSource =
  | { kind: 'backend'; url: string }
  | { kind: 'off'; ean: string }
  | { kind: 'placeholder' };

/** Events that drive a {@link ImageState} toward termination. */
export type ImageEvent =
  | { type: 'off-resolved'; url: string }
  | { type: 'off-miss' }
  | { type: 'off-timeout' }
  | { type: 'load-error' }
  | { type: 'exhausted' };

/** True iff `value` carries at least one non-whitespace character. */
function isNonEmpty(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Pure decision of the *initial* resolution path (R4.1, R4.2, R4.4).
 *
 * - A non-empty Backend image URL → `backend(url)`.
 * - Otherwise a non-empty EAN → `off(ean)` (the caller then issues the Open
 *   Food Facts lookup; this function performs no I/O).
 * - Otherwise → `placeholder`, and the caller issues **no** OFF request.
 *
 * Whitespace-only `backendImageUrl`/`ean` are treated as empty. The returned
 * `url`/`ean` are trimmed of surrounding whitespace.
 */
export function chooseImageSource(inputs: ImageInputs): ImageSource {
  if (isNonEmpty(inputs.backendImageUrl)) {
    return { kind: 'backend', url: inputs.backendImageUrl.trim() };
  }
  if (isNonEmpty(inputs.ean)) {
    return { kind: 'off', ean: inputs.ean.trim() };
  }
  return { kind: 'placeholder' };
}

/**
 * The starting {@link ImageState} for the given inputs.
 *
 * - `backend` → `image(url)`: the Backend URL is rendered immediately (R4.1);
 *   a later `load-error` falls back to a placeholder (R4.6).
 * - `off` → `loading`: an OFF lookup is in flight (R4.2); a later
 *   `off-resolved` / `off-miss` / `off-timeout` terminates it.
 * - `placeholder` → `placeholder('no-source')`: no source exists, so the
 *   Placeholder_Image shows at once with no OFF request (R4.4).
 */
export function initialImageState(inputs: ImageInputs): ImageState {
  const source = chooseImageSource(inputs);
  switch (source.kind) {
    case 'backend':
      return { kind: 'image', url: source.url };
    case 'off':
      return { kind: 'loading' };
    case 'placeholder':
      return { kind: 'placeholder', reason: 'no-source' };
  }
}

/**
 * Pure transition for the image-resolution state machine.
 *
 * Guarantees (R4.3, R4.5, R4.6):
 * - A `placeholder` is terminal — nothing transitions out of it.
 * - From `loading`: `off-resolved` → `image`; `off-miss` → `placeholder('exhausted')`
 *   (no image found after the OFF path is exhausted, R4.5); `off-timeout` →
 *   `placeholder('off-timeout')` (R4.3).
 * - A `load-error` from any non-placeholder state → `placeholder('load-error')`
 *   (R4.6), covering a Backend image or a resolved OFF image that fails to load.
 * - `exhausted` → `placeholder('exhausted')` (R4.5).
 *
 * The function is total over every (state, event) pair: events that do not
 * apply to the current state leave it unchanged.
 */
export function imageReducer(state: ImageState, event: ImageEvent): ImageState {
  // A placeholder is terminal; nothing transitions out of it.
  if (state.kind === 'placeholder') return state;

  switch (event.type) {
    case 'off-resolved':
      // A usable OFF image arrived — only meaningful while loading.
      return state.kind === 'loading' ? { kind: 'image', url: event.url } : state;
    case 'off-miss':
      // OFF returned no usable image; the resolution path is exhausted (R4.5).
      return state.kind === 'loading' ? { kind: 'placeholder', reason: 'exhausted' } : state;
    case 'off-timeout':
      // OFF did not answer within the 5 s budget (R4.3).
      return state.kind === 'loading' ? { kind: 'placeholder', reason: 'off-timeout' } : state;
    case 'load-error':
      // The rendered <img> failed to load (R4.6).
      return { kind: 'placeholder', reason: 'load-error' };
    case 'exhausted':
      // All resolution paths are exhausted with no image (R4.5).
      return { kind: 'placeholder', reason: 'exhausted' };
    default:
      return state;
  }
}

/** True iff `state` is a terminal resolution (`image` or `placeholder`). */
export function isTerminalImageState(state: ImageState): boolean {
  return state.kind === 'image' || state.kind === 'placeholder';
}
