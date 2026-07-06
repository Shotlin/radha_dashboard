'use client';
/**
 * Trend card — 30-day scan/expiry/task trend area chart.
 * Uses LineTrend (AreaChart with gradient fill) directly.
 *
 * Wrapped in `RegionState`: loading → chart-shaped skeleton, failure/timeout →
 * RegionError with a region-only retry (R10.5), data → the chart (or a designed
 * "no data" message when the loaded series is empty — an empty result is not an
 * error). Failures stay isolated to this region and never redirect (R10.1 / R10.6).
 */
import { LineTrend, CHART_COLORS } from '@/components/ui/chart-card';
import { RegionState } from '@/components/system/region-state';
import { Eyebrow } from '@/components/ui/eyebrow';
import { useOverviewTrends } from '../overview.queries';
import type { TrendPoint } from '../overview.schema';
import { subDays, format } from 'date-fns';

interface TrendCardProps {
  storeId: string | null;
}

export function TrendCard({ storeId }: TrendCardProps) {
  const to = format(new Date(), 'yyyy-MM-dd');
  const from = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const query = useOverviewTrends(storeId, from, to);

  return (
    <RegionState
      query={query}
      variant="chart"
      errorTitle="Could not load trend"
      errorMessage="The 30-day trend could not be loaded. Other sections are unaffected."
    >
      {query.data ? <TrendContent series={query.data.series} /> : null}
    </RegionState>
  );
}

function TrendContent({ series }: { series: TrendPoint[] }) {
  const chartData = series.map((pt) => ({ date: pt.date, value: pt.value }));

  return (
    <div className="card p-5 flex flex-col gap-3">
      <Eyebrow>30-Day Trend</Eyebrow>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[160px] text-[13px] text-[var(--ink-soft)]">
          No trend data available yet.
        </div>
      ) : (
        <LineTrend
          data={chartData}
          xKey="date"
          yKey="value"
          color={CHART_COLORS.accent}
          height={160}
          aria-label="30-day activity trend"
        />
      )}
    </div>
  );
}
