'use client';
/**
 * KPI bento — 4 KPI tiles: Expiring next 7d · Expired · Open tasks · Low stock
 * Asymmetric grid: tile 1 (critical) and tile 4 span 2 columns.
 *
 * Per-region lifecycle is driven by the canonical `RegionState` wrapper: while
 * the KPI query loads it shows a kpi-shaped RegionSkeleton; on failure (or a 10s
 * load timeout) it shows a RegionError whose retry re-issues only this region's
 * request (R5.6 / R10.5). A failure here never touches sibling regions — they keep
 * their last-loaded data (R10.1) — and never redirects to login (R10.6).
 */
import { Clock, XCircle, ClipboardList, Package } from 'lucide-react';
import { KpiTile } from '@/components/ui/kpi-tile';
import { RegionState } from '@/components/system/region-state';
import { useOverviewKpis } from '../overview.queries';
import type { OverviewKpi } from '../overview.schema';

interface KpiBentoProps {
  storeId: string | null;
}

export function KpiBento({ storeId }: KpiBentoProps) {
  const query = useOverviewKpis(storeId);

  return (
    <RegionState
      query={query}
      variant="kpi"
      rows={4}
      errorTitle="Could not load KPIs"
      errorMessage="The store KPI tiles could not be loaded. Other sections are unaffected."
    >
      {query.data ? <KpiTiles data={query.data} /> : null}
    </RegionState>
  );
}

function KpiTiles({ data }: { data: OverviewKpi }) {
  return (
    /* Asymmetric bento — expiring (critical) + low-stock span 2 cols to vary emphasis */
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tile 1: Expiring — spans 2 cols on all breakpoints (most urgent) */}
      <div className="col-span-2 lg:col-span-2 animate-fade-up [animation-delay:0ms]">
        <KpiTile
          label="Expiring (7 days)"
          value={data.expiringItems}
          icon={Clock}
          tint="text-warn"
          tintBg="bg-[color:rgb(180_83_9_/_0.08)]"
          href="/expiry"
          actionLabel="Review expiry"
          className="h-full"
        />
      </div>
      {/* Tile 2: Expired */}
      <div className="animate-fade-up [animation-delay:70ms]">
        <KpiTile
          label="Expired items"
          value={data.expiredItems}
          icon={XCircle}
          tint="text-danger"
          tintBg="bg-[color:rgb(185_28_28_/_0.08)]"
          href="/expiry?status=expired"
          actionLabel="Clear expired"
          className="h-full"
        />
      </div>
      {/* Tile 3: Open tasks */}
      <div className="animate-fade-up [animation-delay:140ms]">
        <KpiTile
          label="Open tasks"
          value={data.openTasks}
          icon={ClipboardList}
          tint="text-accent"
          tintBg="bg-accent-tint"
          href="/tasks"
          actionLabel="View tasks"
          className="h-full"
        />
      </div>
      {/* Tile 4: Low stock — spans 2 cols to balance the layout */}
      <div className="col-span-2 lg:col-span-2 animate-fade-up [animation-delay:210ms]">
        <KpiTile
          label="Low stock items"
          value={data.lowStockItems}
          icon={Package}
          tint="text-[#6D5BD0]"
          tintBg="bg-[color:rgb(109_91_208_/_0.08)]"
          href="/inventory"
          actionLabel="View inventory"
          className="h-full"
        />
      </div>
    </div>
  );
}
