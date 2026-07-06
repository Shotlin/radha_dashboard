'use client';
/**
 * features/grn/components/grn-stats.tsx
 * KPI strip: pending GRNs, received this month.
 */
import { Clock, CheckCircle } from 'lucide-react';
import { KpiTile } from '@/components/ui/kpi-tile';
import { useGrnKpis } from '../grn.queries';

interface GrnStatsProps {
  storeId: string | null;
}

export function GrnStats({ storeId }: GrnStatsProps) {
  const { data, isLoading, isError } = useGrnKpis(storeId);
  const state = isLoading ? 'loading' : isError ? 'error' : 'default';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <KpiTile
        label="Pending GRNs"
        value={data?.pendingCount ?? 0}
        icon={Clock}
        tint="text-warn"
        tintBg="bg-[color:rgb(180_83_9_/_0.1)]"
        state={state}
      />
      <KpiTile
        label="Received This Month"
        value={data?.receivedThisMonth ?? 0}
        icon={CheckCircle}
        tint="text-success"
        tintBg="bg-[color:rgb(21_128_61_/_0.08)]"
        state={state}
      />
    </div>
  );
}
