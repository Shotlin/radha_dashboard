import 'server-only';

/**
 * lib/api/core/resolve.ts — the single sanctioned way an API_Proxy handler turns
 * a Feature_Area request into renderable data.
 *
 * Server-only: importing this from a client component is a build-time error, so
 * the honest-data + scope rules below only ever run on the server where demo
 * datasets and backend responses are resolved.
 *
 * THE HONEST-DATA RULE (the most important invariant in the dashboard):
 *   A value originating from the Demo_Data_Provider may appear in a resolved
 *   response ONLY when demo mode is active. The legacy "try backend,
 *   `catch { return DEMO_* }`" pattern is removed — with demo mode off a backend
 *   failure yields an `error`/`empty` result so the UI renders its designed
 *   error/empty state, never fabricated data (Requirements 2.4, 2.5).
 *
 * Encoded rules (see design §2 "API_Proxy hardening"):
 *   • Demo on  → never touch the backend. Return the scoped demo region, or
 *     `empty` when the dataset or region is missing, logging the gap (R1.7).
 *   • Demo off → call the backend, assert scope, and map outcomes:
 *       - empty backend result            → `empty`            (R2.6)
 *       - scope mismatch (CrossScopeError) → `error` CROSS_SCOPE (R8.6)
 *       - non-2xx (≠401) / timeout / abort → `error`            (R10.1–R10.3)
 *       - schema-validation failure        → `error`            (R10.4)
 *       - 401                               → propagated (rethrown) so the auth
 *                                              layer can refresh/redirect.
 */

import type { FeatureArea, DemoDataset } from '@/lib/demo';
import { getDemoDataset } from '@/lib/demo';
import type { StoreScope } from '@/lib/api/core/scope-types';
import { CrossScopeError, CROSS_SCOPE } from '@/lib/api/core/scope-guard';
import { ApiRequestError, UnauthorizedError, ResponseValidationError } from './errors';

/** Stable error codes the resolver emits so callers needn't parse messages. */
const SCHEMA_VALIDATION = 'SCHEMA_VALIDATION' as const;
const TIMEOUT = 'TIMEOUT' as const;
const UNKNOWN = 'UNKNOWN' as const;

/**
 * The only shapes a hardened proxy returns.
 *
 * - `ok`    — real (demo-off) or demo (demo-on) data that is present and in scope.
 * - `empty` — no data to show: missing demo dataset/region, or an empty backend
 *   result with demo off (drives a designed empty state, never demo data — R2.6).
 * - `error` — a backend failure, timeout/abort, schema-validation failure, or a
 *   cross-scope rejection; the affected region renders error+retry (R10.1).
 */
export type ResolveResult<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'empty' }
  | { kind: 'error'; status: number; code: string };

export interface ResolveArgs<T> {
  /** The Feature_Area being resolved (selects the demo dataset). */
  area: FeatureArea;
  /** The named region within the page (used for diagnostics on missing data). */
  region: string;
  /** The active tenant/store scope. */
  scope: StoreScope;
  /** `DEMO_MODE` env flag OR a `_demo` session. */
  isDemo: boolean;
  /** Fetch + validate real backend data; throws ApiRequestError on failure. */
  fetchReal: () => Promise<T>;
  /** Pick the demo region from the scoped dataset; `undefined` => no region. */
  selectDemo: (ds: DemoDataset) => T | undefined;
  /** Assert every record matches scope; throws CrossScopeError otherwise. */
  assertScope: (data: T, scope: StoreScope) => void;
}

/**
 * The resolver's notion of "empty" for an arbitrary region payload `T`:
 * `null`/`undefined`, an empty array, or an object with no own enumerable keys.
 * Primitives (numbers, non-empty strings, booleans) are considered present.
 */
function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

/**
 * Module-level dedupe so a missing *region* (the dataset exists but does not
 * define this region) is logged at most once per area+region. Missing *datasets*
 * are already deduped/logged inside `getDemoDataset` (R1.7).
 */
const missingRegionLogged = new Set<string>();

function logMissingRegion(area: FeatureArea, region: string): void {
  const key = `${area}:${region}`;
  if (missingRegionLogged.has(key)) return;
  missingRegionLogged.add(key);
  console.warn(`[demo] no demo region "${region}" defined for feature area "${area}"`);
}

/** True for a request that was aborted or timed out (30s AbortController, R10.2). */
function isAbortError(err: unknown): boolean {
  return (
    err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')
  );
}

/**
 * resolveFeatureData — centralizes the honest-data + scope rules so each API
 * proxy handler is a thin wrapper.
 *
 * @example
 * const result = await resolveFeatureData({
 *   area: 'overview',
 *   region: 'kpis',
 *   scope,
 *   isDemo,
 *   fetchReal: () => apiFetch('/dashboard/kpis', { schema: KpisSchema, query: { storeId } }),
 *   selectDemo: (ds) => ds.regions.kpis as Kpis | undefined,
 *   assertScope: (data, s) => assertRecordsInScope(data.tiles, s),
 * });
 */
export async function resolveFeatureData<T>(args: ResolveArgs<T>): Promise<ResolveResult<T>> {
  const { area, region, scope, isDemo, fetchReal, selectDemo, assertScope } = args;

  // ── Demo on ────────────────────────────────────────────────────────────────
  // NEVER call the backend in demo mode; only ever serve demo-origin data.
  if (isDemo) {
    const dataset = getDemoDataset(area, scope); // logs + returns null when missing (R1.7)
    if (!dataset) {
      return { kind: 'empty' };
    }
    const data = selectDemo(dataset);
    if (data === undefined || isEmptyValue(data)) {
      logMissingRegion(area, region);
      return { kind: 'empty' };
    }
    return { kind: 'ok', data };
  }

  // ── Demo off ─────────────────────────────────────────────────────────────--
  // Only backend-originated data may be returned; demo values are never sourced.
  try {
    const data = await fetchReal();

    // Discard the entire response if any record is outside the active scope (R8.6).
    assertScope(data, scope);

    // Empty backend result drives a designed empty state, never demo data (R2.6).
    if (isEmptyValue(data)) {
      return { kind: 'empty' };
    }

    return { kind: 'ok', data };
  } catch (err) {
    // 401 is not a region error — propagate so the auth layer can refresh/redirect.
    if (err instanceof UnauthorizedError || (err instanceof ApiRequestError && err.status === 401)) {
      throw err;
    }

    // Cross-scope rejection — the whole response is discarded (R8.6).
    if (err instanceof CrossScopeError) {
      return { kind: 'error', status: 502, code: CROSS_SCOPE };
    }

    // Schema-validation failure — no field of the unvalidated body is surfaced (R10.4).
    if (err instanceof ResponseValidationError) {
      return { kind: 'error', status: 502, code: SCHEMA_VALIDATION };
    }

    // Any other backend non-2xx status maps to a region error (R10.1).
    if (err instanceof ApiRequestError) {
      return { kind: 'error', status: err.status, code: err.code };
    }

    // Timeout / abort (30s AbortController) surfaces as a region error (R10.2, R10.3).
    if (isAbortError(err)) {
      return { kind: 'error', status: 504, code: TIMEOUT };
    }

    // Unknown transport/runtime failure — still a region error, never demo data.
    return { kind: 'error', status: 500, code: UNKNOWN };
  }
}
