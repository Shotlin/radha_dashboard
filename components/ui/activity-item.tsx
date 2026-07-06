import { cn } from '@/lib/utils';

interface ActivityItemProps {
  actor: string;
  action: string;
  target?: string;
  timestamp: string | Date;
  /** Color for the icon tint well */
  tintClass?: string;
  icon?: React.ElementType;
  className?: string;
}

function Monogram({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div
      className="w-8 h-8 rounded-full bg-accent-tint text-accent-deep flex items-center justify-center text-[12px] font-bold flex-shrink-0"
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

/**
 * Activity Feed Item (Doc 2 §4.14) — monogram + actor + action + target + mono timestamp.
 */
export function ActivityItem({
  actor,
  action,
  target,
  timestamp,
  tintClass = 'text-accent',
  icon: Icon,
  className,
}: ActivityItemProps) {
  const ts = typeof timestamp === 'string' ? timestamp : timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={cn('flex items-start gap-3 py-2', className)}>
      {Icon ? (
        <div className={cn('w-8 h-8 rounded-full bg-accent-tint flex items-center justify-center flex-shrink-0', tintClass)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      ) : (
        <Monogram name={actor} />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-ink leading-snug">
          <span className="font-semibold">{actor}</span>
          {' '}{action}
          {target && (
            <>
              {' '}<span className="font-medium text-accent">{target}</span>
            </>
          )}
        </p>
      </div>
      <time
        dateTime={typeof timestamp === 'string' ? timestamp : timestamp.toISOString()}
        className="font-mono text-[11px] text-ink-soft tabular-nums flex-shrink-0 mt-0.5"
      >
        {ts}
      </time>
    </div>
  );
}
