'use client';

import { useIntersectionObserver } from '@/lib/hooks/use-intersection-observer';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

interface OhsComponent {
  label: string;
  value: number; // 0–100
}

interface OhsGaugeProps {
  /** Overall score 0–100, or undefined if pending */
  score?: number;
  components?: OhsComponent[];
  size?: number;
  className?: string;
}

/**
 * OHS Gauge (Doc 2 §4.6) — circular arc sweep + mono center + 6-component bars.
 * Dashed ring + "–" for pending. Reduced-motion: no sweep animation.
 */
export function OhsGauge({ score, components = [], size = 140, className }: OhsGaugeProps) {
  const reduced = useReducedMotion();
  const pending = score === undefined;
  const { ref, isVisible } = useIntersectionObserver(0.3);

  const r = (size - 12) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  // Only animate arc when in viewport
  const sweep = pending ? 0 : isVisible ? (score / 100) * circumference : 0;

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={cn('flex flex-col items-center gap-4', className)}>
      {/* Circular gauge */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          aria-label={pending ? 'OHS score pending' : `OHS score: ${score} out of 100`}
          role="img"
        >
          {/* Background ring */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--surface-sunken)"
            strokeWidth={10}
            strokeDasharray={pending ? '4 6' : undefined}
          />
          {/* Score arc */}
          {!pending && (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${sweep} ${circumference}`}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={
                reduced
                  ? undefined
                  : { transition: 'stroke-dasharray 800ms cubic-bezier(.23,1,.32,1)' }
              }
            />
          )}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-bold text-[28px] text-ink leading-none tabular-nums">
            {pending ? '–' : score}
          </span>
          <span className="text-[11px] text-ink-soft font-semibold uppercase tracking-wide">
            {pending ? 'Pending' : '/100'}
          </span>
        </div>
      </div>

      {/* Component bars */}
      {components.length > 0 && (
        <div className="w-full flex flex-col gap-2">
          {components.map((comp) => (
            <div key={comp.label} className="flex items-center gap-2">
              <span className="text-[12px] text-ink-soft w-32 flex-shrink-0 truncate">{comp.label}</span>
              <div className="flex-1 bg-surface-sunken rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${comp.value}%` }}
                  aria-label={`${comp.label}: ${comp.value}%`}
                />
              </div>
              <span className="font-mono text-[12px] text-ink-soft w-8 text-right tabular-nums">
                {comp.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
