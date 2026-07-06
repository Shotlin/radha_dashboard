'use client';
/**
 * features/analytics/components/funnel-chart.tsx
 * Vertical funnel using Recharts BarChart — stage labels + counts, mono numbers.
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard, CHART_COLORS } from '@/components/ui/chart-card';
import type { FunnelStage } from '../analytics.schema';

const STAGE_COLORS = [
  CHART_COLORS.accent,
  '#c2410c',
  '#9a3412',
  '#7c2d12',
  '#6b2307',
];

interface FunnelChartProps {
  data: FunnelStage[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function FunnelChart({ data, isLoading, isError, onRetry }: FunnelChartProps) {
  const state = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : !data || data.length === 0
        ? 'empty'
        : 'default';

  return (
    <ChartCard
      eyebrow="CONVERSION"
      title="Signup Funnel"
      state={state}
      onRetry={onRetry}
      className="h-full"
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_COLORS.hairline}
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{
              fill: CHART_COLORS.inkSoft,
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}
            axisLine={{ stroke: CHART_COLORS.hairline }}
            tickLine={false}
          />
          <YAxis
            dataKey="stage"
            type="category"
            width={100}
            tick={{
              fill: CHART_COLORS.inkSoft,
              fontSize: 12,
              fontFamily: 'var(--font-sans)',
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
            formatter={(value: number) => [value.toLocaleString(), 'Count']}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={32}>
            {data?.map((entry, index) => (
              <Cell
                key={`cell-${entry.stage}`}
                fill={STAGE_COLORS[index % STAGE_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
