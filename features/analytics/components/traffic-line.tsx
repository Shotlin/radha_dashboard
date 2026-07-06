'use client';
/**
 * features/analytics/components/traffic-line.tsx
 * Area line chart — visitors/signups over time range.
 */
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard, CHART_COLORS } from '@/components/ui/chart-card';
import type { TimeSeriesPoint } from '../analytics.schema';

interface TrafficSeries {
  label: string;
  data: TimeSeriesPoint[];
  color?: string;
}

interface TrafficLineProps {
  series: TrafficSeries[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function TrafficLine({ series, isLoading, isError, onRetry }: TrafficLineProps) {
  // Merge all series onto the same date key
  const allDates = Array.from(
    new Set(series.flatMap((s) => s.data.map((p) => p.date))),
  ).sort();

  const merged = allDates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const s of series) {
      const point = s.data.find((p) => p.date === date);
      row[s.label] = point?.value ?? 0;
    }
    return row;
  });

  const state = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : merged.length === 0
        ? 'empty'
        : 'default';

  const colors = [CHART_COLORS.accent, CHART_COLORS.teal, CHART_COLORS.violet];

  return (
    <ChartCard
      eyebrow="TRAFFIC"
      title="Visitors &amp; Signups"
      state={state}
      onRetry={onRetry}
      className="h-full"
    >
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={merged} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.label} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color ?? colors[i % colors.length]} stopOpacity={0.15} />
                <stop offset="95%" stopColor={s.color ?? colors[i % colors.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.hairline} />
          <XAxis
            dataKey="date"
            tick={{
              fill: CHART_COLORS.inkSoft,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
            }}
            axisLine={{ stroke: CHART_COLORS.hairline }}
            tickLine={false}
            tickFormatter={(v: string) => {
              const d = new Date(v);
              return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            }}
          />
          <YAxis
            tick={{
              fill: CHART_COLORS.inkSoft,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--hairline)',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
            }}
            labelStyle={{ color: 'var(--ink)', fontWeight: 600 }}
          />
          {series.length > 1 && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: CHART_COLORS.inkSoft }}
            />
          )}
          {series.map((s, i) => (
            <Area
              key={s.label}
              type="monotone"
              dataKey={s.label}
              stroke={s.color ?? colors[i % colors.length]}
              strokeWidth={2}
              fill={`url(#grad-${i})`}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
