// Feature: dashboard-production-ready, Property 10: Image source selection follows the resolution order
//
// Validates: Requirements 4.1, 4.2, 4.4
//
// Property 10 (design.md): For any image inputs, `chooseImageSource` returns
// `backend(url)` when the backend image URL is non-empty; otherwise `off(ean)`
// when the backend URL is empty and the EAN is non-empty; otherwise `placeholder`
// (and issues no Open Food Facts request) when both are empty. Whitespace-only
// strings count as empty.

import { describe, it, expect } from 'vitest';
import { assertProperty, fc } from '@/test/property';
import {
  chooseImageSource,
  initialImageState,
  imageReducer,
  isTerminalImageState,
  type ImageInputs,
  type ImageEvent,
  type ImageState,
} from '@/features/_shared/product-image/resolve-image';

// Independent reference notion of "empty" derived directly from the Property 10
// statement (whitespace-only and null both count as empty), NOT from the
// implementation under test.
function isEmpty(value: string | null): boolean {
  return value === null || value.trim().length === 0;
}

// Generators spanning the full input space the property cares about:
//   - non-empty strings (may carry surrounding whitespace),
//   - empty strings,
//   - whitespace-only strings,
//   - null.
const nonEmptyArb = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);
const emptyStringArb = fc.constant('');
const whitespaceArb = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v'), { minLength: 1, maxLength: 6 })
  .map((cs) => cs.join(''));

// A field is any of: non-empty string, empty string, whitespace-only string, or null.
const fieldArb: fc.Arbitrary<string | null> = fc.oneof(
  nonEmptyArb,
  emptyStringArb,
  whitespaceArb,
  fc.constant<string | null>(null),
);

const inputsArb: fc.Arbitrary<ImageInputs> = fc.record({
  backendImageUrl: fieldArb,
  ean: fieldArb,
});

describe('chooseImageSource — Property 10: image source selection follows the resolution order', () => {
  it('selects backend → off → placeholder in exact resolution order', () => {
    assertProperty(
      fc.property(inputsArb, (inputs) => {
        const result = chooseImageSource(inputs);

        if (!isEmpty(inputs.backendImageUrl)) {
          // 1. Non-empty backend URL wins regardless of the EAN (R4.1).
          expect(result.kind).toBe('backend');
          if (result.kind === 'backend') {
            expect(result.url).toBe((inputs.backendImageUrl as string).trim());
          }
        } else if (!isEmpty(inputs.ean)) {
          // 2. Empty backend URL + non-empty EAN → OFF lookup (R4.2).
          expect(result.kind).toBe('off');
          if (result.kind === 'off') {
            expect(result.ean).toBe((inputs.ean as string).trim());
          }
        } else {
          // 3. Both empty → placeholder, no OFF request (R4.4).
          expect(result.kind).toBe('placeholder');
        }
      }),
    );
  });

  it('chooses backend whenever the backend URL is non-empty, independent of the EAN (R4.1)', () => {
    assertProperty(
      fc.property(nonEmptyArb, fieldArb, (url, ean) => {
        const result = chooseImageSource({ backendImageUrl: url, ean });
        expect(result.kind).toBe('backend');
        if (result.kind === 'backend') {
          expect(result.url).toBe(url.trim());
        }
      }),
    );
  });

  it('chooses off only when the backend URL is empty and the EAN is non-empty (R4.2)', () => {
    const emptyOrWhitespaceOrNull = fc.oneof(emptyStringArb, whitespaceArb, fc.constant<string | null>(null));
    assertProperty(
      fc.property(emptyOrWhitespaceOrNull, nonEmptyArb, (url, ean) => {
        const result = chooseImageSource({ backendImageUrl: url, ean });
        expect(result.kind).toBe('off');
        if (result.kind === 'off') {
          expect(result.ean).toBe(ean.trim());
        }
      }),
    );
  });

  it('chooses placeholder (no OFF request) when both inputs are empty (R4.4)', () => {
    const emptyOrWhitespaceOrNull = fc.oneof(emptyStringArb, whitespaceArb, fc.constant<string | null>(null));
    assertProperty(
      fc.property(emptyOrWhitespaceOrNull, emptyOrWhitespaceOrNull, (url, ean) => {
        const result = chooseImageSource({ backendImageUrl: url, ean });
        // placeholder carries no `ean`, so the caller cannot issue an OFF request.
        expect(result.kind).toBe('placeholder');
      }),
    );
  });
});

// Feature: dashboard-production-ready, Property 11: Image resolution always terminates in image or placeholder
//
// Validates: Requirements 4.3, 4.5, 4.6
//
// Property 11 (design.md): For any input and any outcome sequence (success,
// Open Food Facts miss/timeout, or load error), the terminal `ImageState` is
// either `image` or `placeholder` — never stuck in `loading` — and a miss,
// timeout, or load error always resolves to a `placeholder`.

// A URL-ish generator for the resolved-image payload (surrounding whitespace
// allowed — the reducer carries it through verbatim, termination is what matters).
const urlArb = fc.string({ minLength: 1 });

// The full ImageEvent space the property cares about (R4.3/R4.5/R4.6):
// off-resolved → image, off-miss/off-timeout/exhausted → placeholder, and
// load-error → placeholder from any non-placeholder state.
const eventArb: fc.Arbitrary<ImageEvent> = fc.oneof(
  urlArb.map((url) => ({ type: 'off-resolved', url }) as ImageEvent),
  fc.constant<ImageEvent>({ type: 'off-miss' }),
  fc.constant<ImageEvent>({ type: 'off-timeout' }),
  fc.constant<ImageEvent>({ type: 'load-error' }),
  fc.constant<ImageEvent>({ type: 'exhausted' }),
);

// An arbitrary (possibly empty) sequence of events folded through the reducer.
const eventSeqArb: fc.Arbitrary<ImageEvent[]> = fc.array(eventArb, { maxLength: 12 });

// Reuse the same exhaustive input space as Property 10 (non-empty / empty /
// whitespace-only / null for each field) so we exercise every initial state:
// `image` (backend), `loading` (off), and `placeholder('no-source')`.
const property11InputsArb: fc.Arbitrary<ImageInputs> = fc.record({
  backendImageUrl: fieldArb,
  ean: fieldArb,
});

// Fold a sequence of events through the reducer starting from `start`.
function fold(start: ImageState, events: ImageEvent[]): ImageState {
  return events.reduce((state, event) => imageReducer(state, event), start);
}

describe('imageReducer — Property 11: image resolution always terminates in image or placeholder', () => {
  it('never gets stuck in loading: after any non-empty event sequence the state is terminal', () => {
    assertProperty(
      fc.property(property11InputsArb, eventSeqArb, (inputs, events) => {
        const start = initialImageState(inputs);
        const final = fold(start, events);

        // The only non-terminal state is `loading`, and every event transitions
        // out of `loading`. So the final state is non-terminal *only* in the one
        // benign case: we began loading and no event was ever applied.
        if (start.kind === 'loading' && events.length === 0) {
          expect(isTerminalImageState(final)).toBe(false);
          expect(final.kind).toBe('loading');
        } else {
          expect(isTerminalImageState(final)).toBe(true);
          expect(final.kind === 'image' || final.kind === 'placeholder').toBe(true);
        }
      }),
    );
  });

  it('applying any single event to a loading state terminates it (image or placeholder)', () => {
    assertProperty(
      fc.property(eventArb, (event) => {
        const next = imageReducer({ kind: 'loading' }, event);
        expect(isTerminalImageState(next)).toBe(true);
      }),
    );
  });

  it('off-miss / off-timeout / load-error / exhausted from loading always resolve to a placeholder', () => {
    const placeholderEventArb: fc.Arbitrary<ImageEvent> = fc.constantFrom<ImageEvent>(
      { type: 'off-miss' },
      { type: 'off-timeout' },
      { type: 'load-error' },
      { type: 'exhausted' },
    );
    assertProperty(
      fc.property(placeholderEventArb, (event) => {
        const next = imageReducer({ kind: 'loading' }, event);
        expect(next.kind).toBe('placeholder');
      }),
    );
  });

  it('a load-error from any non-placeholder state always resolves to a placeholder (R4.6)', () => {
    const nonPlaceholderStateArb: fc.Arbitrary<ImageState> = fc.oneof(
      fc.constant<ImageState>({ kind: 'loading' }),
      urlArb.map((url) => ({ kind: 'image', url }) as ImageState),
    );
    assertProperty(
      fc.property(nonPlaceholderStateArb, (state) => {
        const next = imageReducer(state, { type: 'load-error' });
        expect(next.kind).toBe('placeholder');
        if (next.kind === 'placeholder') {
          expect(next.reason).toBe('load-error');
        }
      }),
    );
  });

  it('placeholder is absorbing: no event transitions out of any placeholder state', () => {
    const placeholderStateArb: fc.Arbitrary<ImageState> = fc
      .constantFrom('no-source', 'off-timeout', 'load-error', 'exhausted')
      .map((reason) => ({ kind: 'placeholder', reason }) as ImageState);
    assertProperty(
      fc.property(placeholderStateArb, eventSeqArb, (placeholder, events) => {
        const final = fold(placeholder, events);
        // Unchanged identity and still the same terminal placeholder.
        expect(final).toEqual(placeholder);
        expect(isTerminalImageState(final)).toBe(true);
      }),
    );
  });

  it('for an off input, off-resolved → image and off-miss / off-timeout → placeholder, both terminal', () => {
    // An `off` input is any empty/whitespace/null backend URL paired with a
    // non-empty EAN, which starts the machine in `loading`.
    const emptyOrWhitespaceOrNull = fc.oneof(
      emptyStringArb,
      whitespaceArb,
      fc.constant<string | null>(null),
    );
    const offInputsArb: fc.Arbitrary<ImageInputs> = fc.record({
      backendImageUrl: emptyOrWhitespaceOrNull,
      ean: nonEmptyArb,
    });

    assertProperty(
      fc.property(offInputsArb, urlArb, (inputs, url) => {
        const start = initialImageState(inputs);
        expect(start.kind).toBe('loading');

        const resolved = imageReducer(start, { type: 'off-resolved', url });
        expect(resolved.kind).toBe('image');
        expect(isTerminalImageState(resolved)).toBe(true);

        const missed = imageReducer(start, { type: 'off-miss' });
        expect(missed.kind).toBe('placeholder');
        expect(isTerminalImageState(missed)).toBe(true);

        const timedOut = imageReducer(start, { type: 'off-timeout' });
        expect(timedOut.kind).toBe('placeholder');
        expect(isTerminalImageState(timedOut)).toBe(true);
      }),
    );
  });
});
