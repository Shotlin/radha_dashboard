'use client';
/**
 * features/audit/components/match-rate-kpi.tsx
 * KPI tiles showing EAN match rate %, active lists count, and total scans.
 */
import { ScanLine, ListChecks, Activity } from 'lucide-react';
import { KpiTile } from '@/components/ui/kpi-tile';
import { useEanAuditKpis } from '../audit.queries';
import { useStoreScope } from '@/lib/hooks/use-store-scope';

export function MatchRateKpi() {
  const { storeId } = useStoreScope();
  const { data, isLoading, isError } = useEanAuditKpis(storeId);

  const state = isLoading ? 'loading' : isError ? 'error' : 'default';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KpiTile
        label="EAN Match Rate"
        value={data?.matchRate ?? 0}
        format={(n) => `${n.toFixed(1)}%`}
        icon={ScanLine}
        tint="text-accent"
        tintBg="bg-accent-tint"
        state={state}
        aria-label={`EAN match rate: ${data?.matchRate ?? 0}%`}
      />
      <KpiTile
        label="Active Lists"
        value={data?.activeLists ?? 0}
        icon={ListChecks}
        tint="text-success"
        tintBg="bg-[color:rgb(21_128_61_/_0.1)]"
        state={state}
      />
      <KpiTile
        label="Total Scans"
        value={data?.totalScans ?? 0}
        icon={Activity}
        tint="text-ink-soft"
        tintBg="bg-surface-sunken"
        state={state}
      />
    </div>
  );
}
