import { CheckCircle, XCircle, Clock, AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusChipVariant = 'matched' | 'expired' | 'expiring' | 'pending' | 'neutral' | 'info';

const CONFIG: Record<
  StatusChipVariant,
  { icon: React.ElementType; bg: string; border: string; text: string; label: string }
> = {
  matched: {
    icon: CheckCircle,
    bg: 'bg-[color:rgb(21_128_61_/_0.08)]',
    border: 'border-[color:rgb(21_128_61_/_0.35)]',
    text: 'text-success',
    label: 'Matched',
  },
  expired: {
    icon: XCircle,
    bg: 'bg-[color:rgb(185_28_28_/_0.08)]',
    border: 'border-[color:rgb(185_28_28_/_0.35)]',
    text: 'text-danger',
    label: 'Expired',
  },
  expiring: {
    icon: Clock,
    bg: 'bg-[color:rgb(180_83_9_/_0.08)]',
    border: 'border-[color:rgb(180_83_9_/_0.35)]',
    text: 'text-warn',
    label: 'Expiring soon',
  },
  pending: {
    icon: AlertCircle,
    bg: 'bg-surface-sunken',
    border: 'border-hairline',
    text: 'text-ink-soft',
    label: 'Pending',
  },
  neutral: {
    icon: HelpCircle,
    bg: 'bg-surface-sunken',
    border: 'border-hairline',
    text: 'text-ink-soft',
    label: 'Unknown',
  },
  info: {
    icon: AlertCircle,
    bg: 'bg-[color:rgb(15_118_110_/_0.08)]',
    border: 'border-[color:rgb(15_118_110_/_0.35)]',
    text: 'text-teal',
    label: 'Info',
  },
};

interface StatusChipProps {
  variant: StatusChipVariant;
  label?: string;
  className?: string;
}

/**
 * StatusChip (Doc 2 §4.5) — icon + label, tint bg 8% + border 35%.
 * Always carries aria-label for accessibility.
 */
export function StatusChip({ variant, label, className }: StatusChipProps) {
  const cfg = CONFIG[variant];
  const Icon = cfg.icon;
  const displayLabel = label ?? cfg.label;

  return (
    <span
      role="status"
      aria-label={displayLabel}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-medium border',
        cfg.bg,
        cfg.border,
        cfg.text,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {displayLabel}
    </span>
  );
}
