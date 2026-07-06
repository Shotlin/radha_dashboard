'use client';
/**
 * features/analytics/components/tenant-activity.tsx
 * KPI tiles + line chart: active users, scans, tasks completed.
 */
import { Users, ScanLine, CheckSquare } from 'lucide-react';
import { KpiTile } from '@/components/ui/kpi-tile';
import { ChartCard, LineTrend, CHART_COLORS } from '@/components/ui/chart-card';
import type { TenantActivity } from '../analytics.schema';

interface TenantActivityProps {
  data: TenantActivity | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function TenantActivityPanel({ data, isLoading, isError, onRetry }: TenantActivityProps) {
  const kpiState = isLoading ? 'loading' : isError ? 'error' : 'default';
  const chartState = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : !data?.series || data.series.length === 0
        ? 'empty'
        : 'default';

  return (
    <div className="flex flex-col gap-4">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <KpiTile
          label="Active Users"
          value={data?.activeUsers ?? 0}
          icon={Users}
          tint="text-accent"
          tintBg="bg-accent-tint"
          state={kpiState}
          format={(n) => n.toLocaleString()}
        />
        <KpiTile
          label="Scans"
          value={data?.scans ?? 0}
          icon={ScanLine}
          tint="text-teal"
          tintBg="bg-[color:rgb(15_118_110_/_0.1)]"
          state={kpiState}
          format={(n) => n.toLocaleString()}
        />
        <KpiTile
          label="Tasks Completed"
          value={data?.tasksCompleted ?? 0}
          icon={CheckSquare}
          tint="text-success"
          tintBg="bg-[color:rgb(21_128_61_/_0.1)]"
          state={kpiState}
          format={(n) => n.toLocaleString()}
        />
      </div>

      {/* Activity line chart */}
      <ChartCard
        eyebrow="APP ACTIVITY"
        title="Daily Activity"
        state={chartState}
        onRetry={onRetry}
      >
        {data?.series && data.series.length > 0 && (
          <LineTrend
            data={data.series}
            xKey="date"
            yKey="value"
            color={CHART_COLORS.teal}
            height={200}
            aria-label="Daily tenant activity trend"
          />
        )}
      </ChartCard>
    </div>
  );
}
