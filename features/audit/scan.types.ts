/**
 * features/audit/scan.types.ts — Scan_Result_View domain types.
 *
 * Pure type declarations for the scan flow (no React, no server-only). These
 * are the only shapes the Scan_Result_View renders and the scan proxy returns.
 *
 * Honest-data discipline (Requirement 3.8): `product.name` may be `null`, which
 * signals the view should render a designed placeholder rather than fabricate a
 * substitute value. See `scan.logic.ts` for the pure helpers that build and
 * format these shapes.
 */

/**
 * Verification outcome for a Scan_Event. Exactly one of these three values is
 * ever produced by `mapVerification` (Requirement 3.3).
 */
export type VerificationStatus = 'matched' | 'not in list' | 'invalid';

/**
 * A product associated with a Scan_Event.
 *
 * `name === null` => render the designed placeholder, never fabricate a name
 * (Requirement 3.8). `imageUrl === null` => the Product_Image_Service falls back
 * to its own resolution order.
 */
export interface ScanProduct {
  name: string | null;
  ean: string;
  imageUrl: string | null;
}

/**
 * The result of a single Scan_Event.
 *
 * - `barcode` is always the exact scanned value, retained for every outcome —
 *   match, no match, or error (Requirements 3.4, 3.5, 3.7).
 * - `scannedAt` is the ISO instant the scan was recorded; the view formats it in
 *   the active Store_Scope local time zone for display (Requirements 3.4, 3.5).
 * - `product` is `null` when the status is `'not in list'`.
 */
export interface ScanResult {
  barcode: string;
  scannedAt: string;
  product: ScanProduct | null;
  status: VerificationStatus;
}

/**
 * Raw verification signal returned by the Backend for a scanned barcode.
 * `valid` indicates the barcode/product is well-formed; `found` indicates it is
 * present on the active approved EAN list.
 */
export interface ScanBackendOutcome {
  found: boolean;
  valid: boolean;
  name: string | null;
  ean: string;
  imageUrl: string | null;
}

/**
 * Designed marker for a product name. `kind: 'placeholder'` instructs the view to
 * render the placeholder treatment; the helper never invents a substitute string
 * (Requirement 3.8).
 */
export type ResolvedProductName =
  | { kind: 'name'; value: string }
  | { kind: 'placeholder' };
