import 'server-only';

/**
 * lib/demo/index.ts — the Demo_Data_Provider registry.
 *
 * Server-only: importing this from a client component is a build-time error,
 * guaranteeing demo data never bundles to the browser (Requirement 2.7).
 *
 * This module is the single registry mapping a {@link FeatureArea} to its demo
 * dataset (Requirement 1.3). The per-Feature_Area dataset modules under
 * `lib/demo/data/*` are created and wired in by a separate task; each one calls
 * {@link registerDemoDataset} (directly or via a side-effect import added here)
 * so this registry tolerates datasets that do not yet exist. Until a dataset is
 * registered, {@link getDemoDataset} returns `null` and logs the gap exactly
 * once per area without throwing (Requirement 1.7).
 */

import type { StoreScope } from '@/lib/api/core/scope-types';

export type { Scoped, StoreScope } from '@/lib/api/core/scope-types';

/**
 * The set of dashboard Feature_Areas that may have a demo dataset. There is at
 * most one dataset per Feature_Area (Requirement 1.3).
 */
export type FeatureArea =
  | 'overview'
  | 'analytics'
  | 'audit'
  | 'expiry'
  | 'grn'
  | 'inventory'
  | 'tasks'
  | 'billing'
  | 'suppliers'
  | 'reports'
  | 'notifications'
  | 'settings'
  | 'admin';

/**
 * A demo dataset for one Feature_Area. `regions` holds the named primary regions
 * the page renders (KPIs, lists, tables, charts), each already filtered to the
 * active scope by the dataset module that produced it.
 */
export interface DemoDataset {
  /** Named primary regions the page renders (KPIs, lists, tables, charts). */
  regions: Record<string, unknown>;
}

/**
 * Builds the scoped {@link DemoDataset} for a Feature_Area. Implemented by each
 * `lib/demo/data/*` module, which applies `filterByScope` to its tagged records
 * so only in-scope data is returned (Requirements 1.4, 8.4).
 */
export type DemoDatasetBuilder = (scope: StoreScope) => DemoDataset;

/** Registry of Feature_Area -> dataset builder. Populated by the data modules. */
const registry = new Map<FeatureArea, DemoDatasetBuilder>();

/**
 * Module-level dedupe set so a missing dataset is logged exactly once per area
 * (Requirement 1.7), regardless of how many times `getDemoDataset` is called.
 */
const missingLogged = new Set<FeatureArea>();

/**
 * Register the demo dataset builder for a Feature_Area. Called by the
 * per-Feature_Area modules under `lib/demo/data/*`. Registering an area more
 * than once replaces the previous builder, preserving the "exactly one dataset
 * per Feature_Area" invariant (Requirement 1.3).
 */
export function registerDemoDataset(area: FeatureArea, builder: DemoDatasetBuilder): void {
  registry.set(area, builder);
}

/**
 * Returns the demo dataset for a Feature_Area scoped to the active tenant/store,
 * or `null` when no dataset is registered for that area (Requirement 1.7).
 *
 * When no dataset exists the gap is logged exactly once per area (via a
 * module-level Set) and `null` is returned — never thrown — so a missing dataset
 * degrades to an empty state rather than a crash.
 */
export function getDemoDataset(area: FeatureArea, scope: StoreScope): DemoDataset | null {
  const builder = registry.get(area);
  if (!builder) {
    if (!missingLogged.has(area)) {
      missingLogged.add(area);
      console.warn(`[demo] no demo dataset registered for feature area "${area}"`);
    }
    return null;
  }
  return builder(scope);
}

/**
 * Dataset registration (Requirement 1.3 — exactly one dataset per Feature_Area).
 *
 * Each `lib/demo/data/*` module exports a pure builder and type-only-imports this
 * module, so there is no runtime import cycle. The registry (`registry`) and
 * `registerDemoDataset` are fully defined above before these imports execute, so
 * registration happens safely when this module loads (no temporal-dead-zone or
 * circular-import hazard). Importing this registry therefore populates all 13
 * Feature_Area datasets, and `getDemoDataset` resolves them for any scope.
 */
import { buildOverviewDataset } from './data/overview';
import { buildAnalyticsDataset } from './data/analytics';
import { buildAuditDataset } from './data/audit';
import { buildExpiryDataset } from './data/expiry';
import { buildGrnDataset } from './data/grn';
import { buildInventoryDataset } from './data/inventory';
import { buildTasksDataset } from './data/tasks';
import { buildBillingDataset } from './data/billing';
import { buildSuppliersDataset } from './data/suppliers';
import { buildReportsDataset } from './data/reports';
import { buildNotificationsDataset } from './data/notifications';
import { buildSettingsDataset } from './data/settings';
import { buildAdminDataset } from './data/admin';

registerDemoDataset('overview', buildOverviewDataset);
registerDemoDataset('analytics', buildAnalyticsDataset);
registerDemoDataset('audit', buildAuditDataset);
registerDemoDataset('expiry', buildExpiryDataset);
registerDemoDataset('grn', buildGrnDataset);
registerDemoDataset('inventory', buildInventoryDataset);
registerDemoDataset('tasks', buildTasksDataset);
registerDemoDataset('billing', buildBillingDataset);
registerDemoDataset('suppliers', buildSuppliersDataset);
registerDemoDataset('reports', buildReportsDataset);
registerDemoDataset('notifications', buildNotificationsDataset);
registerDemoDataset('settings', buildSettingsDataset);
registerDemoDataset('admin', buildAdminDataset);
