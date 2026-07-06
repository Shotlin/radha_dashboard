'use client';
/**
 * features/analytics/components/conversion-kpis.tsx
 * KPI tiles: visitors, signups, conversion rate.
 */
import { Users, UserPlus, TrendingUp } from 'lucide-react';
import { KpiTile } from '@/components/ui/kpi-tile';
import type { WebsiteStats } from '../analytics.schema';

interface ConversionKpisProps {
  data: WebsiteStats | undefined;
  isLoading?: boolean;
  isError?: boolean;
}

export function ConversionKpis({ data, isLoading, isError }: ConversionKpisProps) {
  const state = isLoading ? 'loading' : isError ? 'error' : 'default';

  const convRate =
    data?.conversionRate ??
    (data?.visitors && data.visitors > 0
      ? Math.round((data.signups / data.visitors) * 1000) / 10
      : 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <KpiTile
        label="Visitors"
        value={data?.visitors ?? 0}
        icon={Users}
        tint="text-accent"
        tintBg="bg-accent-tint"
        state={state}
        format={(n) => n.toLocaleString()}
      />
      <KpiTile
        label="Signups"
        value={data?.signups ?? 0}
        icon={UserPlus}
        tint="text-teal"
        tintBg="bg-[color:rgb(15_118_110_/_0.1)]"
        state={state}
        format={(n) => n.toLocaleString()}
      />
      <KpiTile
        label="Conversion Rate"
        value={convRate}
        icon={TrendingUp}
        tint="text-success"
        tintBg="bg-[color:rgb(21_128_61_/_0.1)]"
        state={state}
        format={(n) => `${n}%`}
      />
    </div>
  );
}
