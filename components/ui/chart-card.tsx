'use client';

import React from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Eyebrow } from './eyebrow';
import { ErrorState, Skeleton } from './states';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

/* ── Token colors ── */
export const CHART_COLORS = {
  accent:   '#ea580c',
  teal:     '#0f766e',
  success:  '#15803d',
  warn:     '#b45309',
  danger:   '#b91c1c',
  violet:   '#6d5bd0',
  hairline: '#e7e1d4',
  inkSoft:  '#57534e',
} as const;

/* ── Shared axis / grid style ── */
const AXIS_PROPS = {
  tick:     { fill: CHART_COLORS.inkSoft, fontSize: 12, fontFamily: 'var(--font-mono)' },
  axisLine: { stroke: CHART_COLORS.hairline },
  tickLine: false as unknown as boolean,
} as const;

/* ── Shared hook: measure container width via ResizeObserver ── */
function useContainerWidth() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

/* ── Chart Card wrapper ── */
interface ChartCardProps {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  state?: 'default' | 'loading' | 'empty' | 'error';
  onRetry?: () => void;
  className?: string;
}

export function ChartCard({
  eyebrow, title, children, state = 'default', onRetry, className,
}: ChartCardProps) {
  if (state === 'loading') {
    return (
      <div className={cn('card p-4 flex flex-col gap-3', className)} aria-busy="true">
        {eyebrow && <Skeleton className="h-3 w-24" />}
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-40 w-full mt-2" />
      </div>
    );
  }

  return (
    <div className={cn('card p-4 flex flex-col gap-3', className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h3 className="text-[16px] font-bold text-ink">{title}</h3>
      {state === 'error' ? (
        <ErrorState
          title="Chart unavailable"
          description="Could not load chart data."
          onRetry={onRetry}
          className="border-0 bg-transparent py-6"
        />
      ) : state === 'empty' ? (
        <div className="flex items-center justify-center h-32 text-ink-soft text-[13px]">
          No data for this period
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/* ── LineTrend (AreaChart) ── */
interface LineTrendProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  'aria-label'?: string;
}

export function LineTrend({
  data, xKey, yKey,
  color = CHART_COLORS.accent,
  height = 180,
  'aria-label': ariaLabel,
}: LineTrendProps) {
  const reduced = useReducedMotion();
  const { ref, width } = useContainerWidth();
  const idRef = React.useRef(`lt-${Math.random().toString(36).slice(2, 8)}`);

  // Convert hex color to rgba for fill — Recharts defs injection is unreliable in v2
  // We use a semi-transparent solid fill instead of a gradient
  const fillColor = `${color}22`; // 13% opacity hex appended

  return (
    <div ref={ref} role="img" aria-label={ariaLabel ?? 'Area trend chart'} style={{ width: '100%', height }}>
      {width > 0 && (
        <AreaChart
          width={width}
          height={height}
          data={data}
          margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke={CHART_COLORS.hairline} />
          <XAxis dataKey={xKey} {...AXIS_PROPS} interval="preserveStartEnd" />
          <YAxis {...AXIS_PROPS} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              background:   'var(--surface-raised)',
              border:       '1px solid var(--hairline)',
              borderRadius: 8,
              fontSize:     13,
              fontFamily:   'var(--font-mono)',
            }}
            labelStyle={{ color: 'var(--ink)', fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            fill={fillColor}
            dot={false}
            isAnimationActive={!reduced}
          />
        </AreaChart>
      )}
    </div>
  );
}

/* ── BarCompare ── */
interface BarCompareProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: { key: string; color?: string; label?: string }[];
  height?: number;
  'aria-label'?: string;
}

export function BarCompare({
  data, xKey, bars,
  height = 180,
  'aria-label': ariaLabel,
}: BarCompareProps) {
  const reduced = useReducedMotion();
  const { ref, width } = useContainerWidth();

  return (
    <div ref={ref} role="img" aria-label={ariaLabel ?? 'Bar comparison chart'} style={{ width: '100%', height }}>
      {width > 0 && (
        <BarChart
          width={width}
          height={height}
          data={data}
          margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.hairline} />
          <XAxis dataKey={xKey} {...AXIS_PROPS} />
          <YAxis {...AXIS_PROPS} />
          <Tooltip
            contentStyle={{
              background:   'var(--surface-raised)',
              border:       '1px solid var(--hairline)',
              borderRadius: 8,
              fontSize:     13,
            }}
          />
          {bars.length > 1 && (
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: CHART_COLORS.inkSoft }} />
          )}
          {bars.map((b) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.label ?? b.key}
              fill={b.color ?? CHART_COLORS.accent}
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reduced}
            />
          ))}
        </BarChart>
      )}
    </div>
  );
}

/* ── Donut ── */
interface DonutProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  'aria-label'?: string;
}

const DONUT_DEFAULTS = [
  CHART_COLORS.accent, CHART_COLORS.teal, CHART_COLORS.violet,
  CHART_COLORS.success, CHART_COLORS.warn,
];

export function Donut({ data, height = 180, 'aria-label': ariaLabel }: DonutProps) {
  const reduced = useReducedMotion();
  const { ref, width } = useContainerWidth();

  return (
    <div ref={ref} role="img" aria-label={ariaLabel ?? 'Donut chart'} style={{ width: '100%', height }}>
      {width > 0 && (
        <PieChart width={width} height={height}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            isAnimationActive={!reduced}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={entry.color ?? DONUT_DEFAULTS[i % DONUT_DEFAULTS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background:   'var(--surface-raised)',
              border:       '1px solid var(--hairline)',
              borderRadius: 8,
              fontSize:     13,
            }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: CHART_COLORS.inkSoft }} />
        </PieChart>
      )}
    </div>
  );
}
