import { cn } from '@/lib/utils';

interface ChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warn' | 'danger' | 'accent';
  className?: string;
  'aria-label'?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-surface-sunken text-ink-soft border-hairline',
  success: 'bg-[color:rgb(21_128_61_/_0.08)] text-success border-[color:rgb(21_128_61_/_0.35)]',
  warn: 'bg-[color:rgb(180_83_9_/_0.08)] text-warn border-[color:rgb(180_83_9_/_0.35)]',
  danger: 'bg-[color:rgb(185_28_28_/_0.08)] text-danger border-[color:rgb(185_28_28_/_0.35)]',
  accent: 'bg-accent-tint text-accent-deep border-accent-tint',
};

/** Small pill chip for statuses, filters, tags. */
export function Chip({ children, variant = 'default', className, 'aria-label': ariaLabel }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium border',
        variantStyles[variant],
        className,
      )}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
}
