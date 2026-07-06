// Feature: dashboard-production-ready, Property 9: Product names are never fabricated

import { describe, it, expect } from 'vitest';
import { assertProperty, fc } from '@/test/property';
import { looksLikeOpaqueToken, resolveProductName } from './scan.logic';

/**
 * Property 9 — Product names are never fabricated.
 *
 * For any product payload whose name is null or a non-human-readable token, the
 * view model (`resolveProductName`) yields a designed placeholder marker and
 * never synthesizes a substitute name string. For a genuine human-readable name,
 * it returns that exact name (the trimmed input) — a value always derived from
 * the input, never invented.
 *
 * Validates: Requirements 3.8
 */

// ---------------------------------------------------------------------------
// Generators for opaque identifiers / tokens (must all resolve to placeholder)
// ---------------------------------------------------------------------------

const hexChar = fc.constantFrom(...'0123456789abcdef'.split(''));
const hexOf = (n: number) =>
  fc.array(hexChar, { minLength: n, maxLength: n }).map((a) => a.join(''));

/** Canonical UUID, e.g. `f47ac10b-58cc-4372-a567-0e02b2c3d479`. */
const uuidToken = fc
  .tuple(hexOf(8), hexOf(4), hexOf(4), hexOf(4), hexOf(12))
  .map((parts) => parts.join('-'));

/** A long (>=16 char) hex string, e.g. `a1b2c3d4e5f60718`. */
const longHexToken = fc.array(hexChar, { minLength: 16, maxLength: 40 }).map((a) => a.join(''));

const lowerAlphaChar = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split(''));
const lowerAlnumChar = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split(''));

/** A prefixed identifier, e.g. `prod_a1b2c3`, `sku:998877`, `id-abc123def`. */
const prefixedIdToken = fc
  .tuple(
    lowerAlphaChar,
    fc.array(lowerAlnumChar, { maxLength: 5 }).map((a) => a.join('')),
    fc.constantFrom('_', ':', '-'),
    fc.array(lowerAlnumChar, { minLength: 6, maxLength: 12 }).map((a) => a.join('')),
  )
  .map(([first, mid, sep, suffix]) => first + mid + sep + suffix);

const opaqueToken = fc.oneof(uuidToken, longHexToken, prefixedIdToken);

// ---------------------------------------------------------------------------
// Generators for genuine, human-readable product names
// ---------------------------------------------------------------------------

// Curated real-world retail words. Each is short (< 12 chars), letters-only, and
// carries natural vowels, so neither it nor any space-joined combination is ever
// misclassified as an opaque token.
const realWord = fc.constantFrom(
  'Amul',
  'Butter',
  'Milk',
  'Maaza',
  'Mango',
  'Drink',
  'Tata',
  'Salt',
  'Parle',
  'Biscuit',
  'Lays',
  'Chips',
  'Bisleri',
  'Water',
  'Dairy',
  'Fresh',
  'Gold',
  'Classic',
  'Masala',
  'Tea',
  'Coffee',
  'Sugar',
  'Organic',
  'Premium',
  'Family',
  'Cookies',
  'Bread',
  'Ghee',
  'Pure',
  'Cow',
);

/** A genuine human-readable name, one to four real words joined by single spaces. */
const realisticName = fc
  .array(realWord, { minLength: 1, maxLength: 4 })
  .map((words) => words.join(' '));

/** Leading/trailing whitespace to exercise trimming without altering the core. */
const surroundingWhitespace = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r'), { maxLength: 4 })
  .map((a) => a.join(''));

describe('Property 9: Product names are never fabricated', () => {
  it('resolves a null name to a placeholder (never a fabricated string)', () => {
    expect(resolveProductName(null)).toEqual({ kind: 'placeholder' });
  });

  it('resolves blank / whitespace-only names to a placeholder', () => {
    assertProperty(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v'), { maxLength: 8 }),
        (chars) => {
          const blank = chars.join('');
          expect(resolveProductName(blank)).toEqual({ kind: 'placeholder' });
        },
      ),
    );
  });

  it('resolves any opaque token (UUID, long hex, prefixed id) to a placeholder', () => {
    assertProperty(
      fc.property(opaqueToken, surroundingWhitespace, surroundingWhitespace, (token, lead, tail) => {
        // The token itself is recognised as opaque ...
        expect(looksLikeOpaqueToken(token)).toBe(true);
        // ... and resolves to a placeholder even with surrounding whitespace,
        // never returning the raw token dressed up as a name.
        const result = resolveProductName(lead + token + tail);
        expect(result).toEqual({ kind: 'placeholder' });
      }),
    );
  });

  it('returns the exact trimmed name for a genuine human-readable value', () => {
    assertProperty(
      fc.property(realisticName, surroundingWhitespace, surroundingWhitespace, (name, lead, tail) => {
        const result = resolveProductName(lead + name + tail);
        // It is recognised as a real name (not an opaque token) ...
        expect(looksLikeOpaqueToken(name)).toBe(false);
        // ... and the returned value is exactly the trimmed input — a substring
        // of the original, never an invented substitute.
        expect(result).toEqual({ kind: 'name', value: name });
      }),
    );
  });

  it('never invents a name: any kind:"name" value equals the trimmed input', () => {
    assertProperty(
      fc.property(
        fc.oneof(fc.string(), realisticName, opaqueToken, fc.constant('')),
        (raw) => {
          const result = resolveProductName(raw);
          if (result.kind === 'name') {
            // The value must be derived from the input (its trim), not fabricated.
            expect(result.value).toBe(raw.trim());
            expect(raw.includes(result.value)).toBe(true);
            expect(result.value.length).toBeGreaterThan(0);
          }
        },
      ),
    );
  });
});

// Feature: dashboard-production-ready, Property 8: Scan result preserves the exact scanned barcode
import { buildScanResult } from './scan.logic';
import type { ScanBackendOutcome } from './scan.types';

/**
 * Arbitrary scanned barcode value. Includes empty, whitespace, unicode, and long
 * strings so the "exact retention" guarantee is exercised across the full input
 * space — buildScanResult must never trim, normalize, or drop the value.
 */
const p8BarcodeArb = fc.string();

/**
 * Arbitrary scannedAt instant. Mixes real ISO timestamps with arbitrary strings,
 * because buildScanResult must retain `scannedAt` verbatim regardless of whether
 * it parses as a date.
 */
const p8ScannedAtArb = fc.oneof(
  fc
    .date({ min: new Date('2000-01-01T00:00:00.000Z'), max: new Date('2100-01-01T00:00:00.000Z') })
    .map((d) => d.toISOString()),
  fc.string(),
);

/** Arbitrary ScanBackendOutcome with random found/valid/name/ean/imageUrl. */
const p8OutcomeArb: fc.Arbitrary<ScanBackendOutcome> = fc.record({
  found: fc.boolean(),
  valid: fc.boolean(),
  name: fc.option(fc.string(), { nil: null }),
  ean: fc.string(),
  imageUrl: fc.option(fc.webUrl(), { nil: null }),
});

/** Outcome generator covering the no-match (null) case alongside real outcomes. */
const p8OutcomeOrNullArb = fc.oneof(fc.constant(null), p8OutcomeArb);

/**
 * Property 8: Scan result preserves the exact scanned barcode
 *
 * For any scanned barcode value and any backend outcome (match, no match = null,
 * or error), `buildScanResult(...).barcode` equals the input barcode exactly and
 * `scannedAt` is retained verbatim. A no-match outcome (outcome === null) yields
 * `status === 'not in list'` with `product === null`, while still retaining the
 * barcode and the scan timestamp.
 *
 * Validates: Requirements 3.4, 3.5
 */
describe('buildScanResult — Property 8: scan result preserves the exact scanned barcode', () => {
  it('retains the exact barcode and scannedAt for any outcome (match, no match, or error)', () => {
    assertProperty(
      fc.property(p8BarcodeArb, p8ScannedAtArb, p8OutcomeOrNullArb, (barcode, scannedAt, outcome) => {
        const result = buildScanResult({ barcode, scannedAt, outcome });
        expect(result.barcode).toBe(barcode);
        expect(result.scannedAt).toBe(scannedAt);
      }),
    );
  });

  it('maps a no-match outcome (null) to a "not in list" result that retains barcode + timestamp', () => {
    assertProperty(
      fc.property(p8BarcodeArb, p8ScannedAtArb, (barcode, scannedAt) => {
        const result = buildScanResult({ barcode, scannedAt, outcome: null });
        expect(result.status).toBe('not in list');
        expect(result.product).toBeNull();
        expect(result.barcode).toBe(barcode);
        expect(result.scannedAt).toBe(scannedAt);
      }),
    );
  });

  it('always produces exactly one of the three verification statuses', () => {
    assertProperty(
      fc.property(p8BarcodeArb, p8ScannedAtArb, p8OutcomeOrNullArb, (barcode, scannedAt, outcome) => {
        const result = buildScanResult({ barcode, scannedAt, outcome });
        expect(['matched', 'not in list', 'invalid']).toContain(result.status);
      }),
    );
  });

  it('a "not in list" status always carries a null product (product === null ⇔ not in list)', () => {
    assertProperty(
      fc.property(p8BarcodeArb, p8ScannedAtArb, p8OutcomeOrNullArb, (barcode, scannedAt, outcome) => {
        const result = buildScanResult({ barcode, scannedAt, outcome });
        if (result.status === 'not in list') {
          expect(result.product).toBeNull();
        }
      }),
    );
  });
});

// Feature: dashboard-production-ready, Property 7: Verification status is total and single-valued
import { mapVerification } from './scan.logic';
import type { VerificationStatus } from './scan.types';

/**
 * Property 7 — Verification status is total and single-valued.
 *
 * For any backend product outcome `{ found, valid }`, `mapVerification` returns
 * exactly one value from `{ 'matched', 'not in list', 'invalid' }`. Specifically:
 *   - `!valid`          => 'invalid'
 *   - `valid && found`  => 'matched'
 *   - `valid && !found` => 'not in list'
 *
 * Validates: Requirements 3.3
 */

/** The complete, closed set of values `mapVerification` may ever return (R3.3). */
const ALLOWED_STATUSES: readonly VerificationStatus[] = ['matched', 'not in list', 'invalid'];

/** Independent reference mapping derived directly from the design spec. */
function expectedVerification(found: boolean, valid: boolean): VerificationStatus {
  if (!valid) return 'invalid';
  return found ? 'matched' : 'not in list';
}

describe('Property 7: Verification status is total and single-valued', () => {
  // Validates: Requirements 3.3
  it('always returns exactly one value from the allowed set for every {found, valid} pair', () => {
    assertProperty(
      fc.property(fc.boolean(), fc.boolean(), (found, valid) => {
        const status = mapVerification({ found, valid });
        expect(ALLOWED_STATUSES).toContain(status);
      }),
    );
  });

  // Validates: Requirements 3.3
  it('matches the specified mapping (!valid→invalid; valid&&found→matched; valid&&!found→not in list)', () => {
    assertProperty(
      fc.property(fc.boolean(), fc.boolean(), (found, valid) => {
        expect(mapVerification({ found, valid })).toBe(expectedVerification(found, valid));
      }),
    );
  });

  // Validates: Requirements 3.3 — all four boolean combinations explicitly covered.
  it('covers all four {found, valid} combinations with the expected status', () => {
    expect(mapVerification({ found: true, valid: true })).toBe('matched');
    expect(mapVerification({ found: false, valid: true })).toBe('not in list');
    expect(mapVerification({ found: true, valid: false })).toBe('invalid');
    expect(mapVerification({ found: false, valid: false })).toBe('invalid');
  });

  // Validates: Requirements 3.3 — totality: a value is always produced, never undefined/throw.
  it('is total — produces a defined status string for any boolean input without throwing', () => {
    assertProperty(
      fc.property(fc.boolean(), fc.boolean(), (found, valid) => {
        const status = mapVerification({ found, valid });
        expect(typeof status).toBe('string');
        expect(status).toBeDefined();
      }),
    );
  });
});
