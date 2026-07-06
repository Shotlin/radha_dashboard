'use client';
/**
 * analytics-client.tsx — Client-side tab logic + date range for the Analytics page.
 * Tabs: Website Stats | App Activity.
 */
import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { FilterBar } from '@/components/ui/filter-bar';
import { cn } from '@/lib/utils';
import {
  useWebsiteStats,
  useFunnel,
  useTenantActivity,
} from '@/features/analytics/analytics.queries';
import { ConversionKpis } from '@/features/analytics/components/conversion-kpis';
import { TrafficLine } from '@/features/analytics/components/traffic-line';
import { FunnelChart } from '@/features/analytics/components/funnel-chart';
import { TenantActivityPanel } from '@/features/analytics/components/tenant-activity';

type Tab = 'website' | 'app';

const SEGMENTS = [
  { value: 'website', label: 'Website Stats' },
  { value: 'app', label: 'App Activity' },
];

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 30);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

interface AnalyticsClientProps {
  tenantId: string;
}

export function AnalyticsClient({ tenantId }: AnalyticsClientProps) {
  const [tab, setTab] = useState<Tab>('website');
  const [range, setRange] = useState(defaultRange);

  /* ── Website stats ──────────────────────────────────────────────────── */
  const statsQuery = useWebsiteStats(range.from, range.to);
  const funnelQuery = useFunnel(range.from, range.to);

  /* ── Tenant activity ─────────────────────────────────────────────────── */
  const activityQuery = useTenantActivity(tenantId, range.from, range.to);

  /* ── Build traffic series from stats (visitors + signups) ──────────── */
  const trafficSeries = statsQuery.data
    ? [
        {
          label: 'Visitors',
          data: statsQuery.data.funnel?.length
            ? [{ date: range.from, value: statsQuery.data.visitors }]
            : [],
        },
        {
          label: 'Signups',
          data: statsQuery.data.signups
            ? [{ date: range.from, value: statsQuery.data.signups }]
            : [],
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Tab + date range bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <FilterBar
          segments={SEGMENTS}
          activeSegment={tab}
          onSegmentChange={(v) => setTab(v as Tab)}
          className="flex-1 min-w-0"
        />

        {/* Date range selector */}
        <div className="flex items-center gap-2 text-[13px] text-ink-soft bg-surface-raised border border-hairline rounded-lg px-3 py-2">
          <Calendar className="h-4 w-4 text-accent" aria-hidden="true" />
          <label htmlFor="from-date" className="sr-only">From date</label>
          <input
            id="from-date"
            type="date"
            value={range.from}
            max={range.to}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className={cn(
              'bg-transparent font-mono text-ink text-[13px]',
              'focus:outline-none focus:ring-0',
            )}
            aria-label="From date"
          />
          <span>→</span>
          <label htmlFor="to-date" className="sr-only">To date</label>
          <input
            id="to-date"
            type="date"
            value={range.to}
            min={range.from}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className={cn(
              'bg-transparent font-mono text-ink text-[13px]',
              'focus:outline-none focus:ring-0',
            )}
            aria-label="To date"
          />
        </div>
      </div>

      {/* Tab content */}
      {tab === 'website' && (
        <div className="flex flex-col gap-6">
          {/* Conversion KPIs */}
          <ConversionKpis
            data={statsQuery.data}
            isLoading={statsQuery.isLoading}
            isError={statsQuery.isError}
          />

          {/* Charts: Traffic line + Funnel side by side on wider screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrafficLine
              series={trafficSeries}
              isLoading={statsQuery.isLoading}
              isError={statsQuery.isError}
              onRetry={() => void statsQuery.refetch()}
            />
            <FunnelChart
              data={funnelQuery.data}
              isLoading={funnelQuery.isLoading}
              isError={funnelQuery.isError}
              onRetry={() => void funnelQuery.refetch()}
            />
          </div>
        </div>
      )}

      {tab === 'app' && (
        <TenantActivityPanel
          data={activityQuery.data}
          isLoading={activityQuery.isLoading}
          isError={activityQuery.isError}
          onRetry={() => void activityQuery.refetch()}
        />
      )}
    </div>
  );
}
