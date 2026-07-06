/**
 * features/audit/scan.logic.ts — pure logic + view model for the Scan_Result_View.
 *
 * Every function here is pure (no React, no server-only, no I/O) so it is trivially
 * testable and reusable on both the client and the scan proxy. Three concerns:
 *
 *  1. `mapVerification`      — total, single-valued status mapping (Requirement 3.3).
 *  2. `buildScanResult`      — builds a ScanResult that always retains the exact
 *                              scanned barcode + timestamp (Requirements 3.4, 3.5).
 *  3. `resolveProductName`   — honest-data name resolution: null/opaque tokens yield
 *                              a designed placeholder, never a fabricated name (R3.8).
 *  4. `formatScanTimestamp`  — formats an ISO instant in the active Store_Scope local
 *                              time zone for display (Requirements 3.4, 3.5).
 */

import type {
  ResolvedProductName,
  ScanBackendOutcome,
  ScanProduct,
  ScanResult,
  VerificationStatus,
} from './scan.types';

/**
 * Pure: map a Backend verification signal to exactly one VerificationStatus
 * (Requirement 3.3 — total and single-valued).
 *
 * - `!valid`            => `'invalid'`
 * - `valid && found`    => `'matched'`
 * - `valid && !found`   => `'not in list'`
 */
export function mapVerification(backend: { found: boolean; valid: boolean }): VerificationStatus {
  if (!backend.valid) return 'invalid';
  return backend.found ? 'matched' : 'not in list';
}

/**
 * Pure: build a ScanResult for a Scan_Event.
 *
 * The constructed result always carries the exact scanned `barcode` and the exact
 * `scannedAt` instant, regardless of outcome (Requirements 3.4, 3.5, 3.7):
 *
 * - `outcome === null` (no match within the response window) => `'not in list'`
 *   with a `null` product, still retaining barcode + timestamp (Requirement 3.5).
 * - Otherwise the status is derived from `mapVerification`. A `'not in list'`
 *   status carries a `null` product (the design invariant `product === null
 *   ⇔ 'not in list'`); `'matched'` and `'invalid'` retain the scanned product so
 *   the view can show the returned fields.
 */
export function buildScanResult(args: {
  barcode: string;
  scannedAt: string;
  outcome: ScanBackendOutcome | null;
}): ScanResult {
  const { barcode, scannedAt, outcome } = args;

  if (outcome === null) {
    return { barcode, scannedAt, product: null, status: 'not in list' };
  }

  const status = mapVerification(outcome);
  const product: ScanProduct | null =
    status === 'not in list'
      ? null
      : { name: outcome.name, ean: outcome.ean, imageUrl: outcome.imageUrl };

  return { barcode, scannedAt, product, status };
}

/**
 * Patterns that identify an opaque identifier/token rather than a human-readable
 * product name. Matching any of these means the view must show a placeholder
 * (never the raw token dressed up as a name) — see `resolveProductName`.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PREFIXED_ID_RE = /^[a-z][a-z0-9]*[_:-][a-z0-9]{6,}$/i;
const LONG_HEX_RE = /^[0-9a-f]{16,}$/i;

/**
 * Pure: decide whether a single whitespace-free word looks like an opaque token.
 *
 * Conservative by design — it must not misclassify real single-word names (e.g.
 * `Maaza`, `7UP`, `Bisleri`). A bare word is treated as a token only when it is
 * long, mixes letters and digits, and has no natural vowel rhythm.
 */
function looksLikeRandomWord(word: string): boolean {
  if (word.length < 12) return false;
  if (/\s/.test(word)) return false;
  if (!/^[A-Za-z0-9_-]+$/.test(word)) return false;
  const hasLetter = /[A-Za-z]/.test(word);
  const hasDigit = /[0-9]/.test(word);
  if (!(hasLetter && hasDigit)) return false;
  // Real words carry vowels; random ids rarely keep a steady vowel ratio.
  const vowels = (word.match(/[aeiou]/gi) ?? []).length;
  const letters = (word.match(/[a-z]/gi) ?? []).length;
  return letters === 0 || vowels / letters < 0.2;
}

/**
 * Pure: returns true when a product name is an opaque identifier/token rather
 * than a human-readable value (Requirement 3.8).
 */
export function looksLikeOpaqueToken(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length === 0) return false;
  if (UUID_RE.test(trimmed)) return true;
  if (LONG_HEX_RE.test(trimmed)) return true;
  if (PREFIXED_ID_RE.test(trimmed)) return true;
  return looksLikeRandomWord(trimmed);
}

/**
 * Pure: resolve a raw Backend product name into a view model that never
 * fabricates a substitute name (Requirement 3.8).
 *
 * Yields `{ kind: 'placeholder' }` when the name is `null`, blank, or an opaque
 * token; otherwise `{ kind: 'name', value }` with the trimmed real name.
 */
export function resolveProductName(rawName: string | null): ResolvedProductName {
  if (rawName === null) return { kind: 'placeholder' };
  const trimmed = rawName.trim();
  if (trimmed.length === 0) return { kind: 'placeholder' };
  if (looksLikeOpaqueToken(trimmed)) return { kind: 'placeholder' };
  return { kind: 'name', value: trimmed };
}

/**
 * Pure: format an ISO instant in the active Store_Scope local time zone for
 * display (Requirements 3.4, 3.5).
 *
 * `timeZone` is an IANA zone (e.g. `'Asia/Kolkata'`); `locale` defaults to
 * `'en-IN'`. An unparseable instant is returned verbatim rather than being
 * coerced into a misleading date.
 */
export function formatScanTimestamp(
  iso: string,
  opts: { timeZone: string; locale?: string },
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return new Intl.DateTimeFormat(opts.locale ?? 'en-IN', {
    timeZone: opts.timeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}
