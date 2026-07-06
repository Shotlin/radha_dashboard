/**
 * app/(dash)/analytics/compare/page.tsx — Phase 18 gated shell
 * Cross-store analytics comparison: grouped bar charts across multiple stores.
 * Requires: GET /api/v1/analytics/compare (🆕 proposed)
 */
import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { NeedsBackend } from '@/components/system/needs-backend';
import { BarChart2, Store, TrendingUp, Calendar } from 'lucide-react';

export const metadata: Metadata = { title: 'Cross-Store Compare' };

/* ── Layout preview ──────────────────────────────────────────────────────── */
function ComparePreview() {
  const stores = ['Main Store', 'Warehouse', 'Branch B'];
  const metrics = [
    { label: 'Expiry items cleared', values: [24, 18, 31] },
    { label: 'Tasks completed', values: [12, 8, 15] },
    { label: 'GRN received', values: [5, 9, 3] },
    { label: 'Store health score', values: [82, 74, 91] },
  ];

  // Simple CSS bar chart representation
  const barColors = [
    'bg-[var(--accent)]',
    'bg-[var(--cat-violet)]',
    'bg-[var(--cat-teal)]',
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface-raised)]">
          <Store className="h-4 w-4 text-[var(--ink-soft)]" />
          <span className="text-[13px] text-[var(--ink-soft)]">Select stores to compare…</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface-raised)]">
          <Calendar className="h-4 w-4 text-[var(--ink-soft)]" />
          <span className="text-[13px] text-[var(--ink-soft)]">Last 30 days</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface-raised)]">
          <TrendingUp className="h-4 w-4 text-[var(--ink-soft)]" />
          <span className="text-[13px] text-[var(--ink-soft)]">Select metric</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        {stores.map((store, i) => (
          <div key={store} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded-sm ${barColors[i]}`} />
            <span className="text-[12px] text-[var(--ink-soft)]">{store}</span>
          </div>
        ))}
      </div>

      {/* Grouped bar charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const maxVal = Math.max(...metric.values);
          return (
            <div key={metric.label} className="card p-4 flex flex-col gap-3">
              <p className="text-[13px] font-semibold text-[var(--ink)]">{metric.label}</p>
              <div className="flex items-end gap-4 h-24">
                {metric.values.map((val, i) => (
                  <div key={stores[i]} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[11px] font-mono text-[var(--ink-soft)]">{val}</span>
                    <div
                      className={`w-full rounded-t-sm ${barColors[i]}`}
                      style={{ height: `${(val / maxVal) * 80}%`, minHeight: '4px' }}
                    />
                    <span className="text-[10px] text-[var(--ink-soft)] truncate w-full text-center">
                      {stores[i]?.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CrossStoreComparePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="ANALYTICS"
        title="Cross-Store Compare"
        subtitle="Compare performance metrics across all your stores side by side."
      />

      <NeedsBackend
        route="GET /api/v1/analytics/compare"
        description="Cross-store analytics comparison endpoint. Returns aggregated metrics (expiry, tasks, GRN, health score) for multiple stores in a single query, supporting grouped bar chart visualisation."
      >
        <ComparePreview />
      </NeedsBackend>
    </div>
  );
}
