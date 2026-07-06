import { Eyebrow } from './eyebrow';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface PageAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ElementType;
}

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** One orange CTA — enforced by single prop API */
  primaryAction?: PageAction;
  /** Secondary ghost actions */
  secondaryActions?: PageAction[];
  /** Tab bar below the header */
  tabs?: React.ReactNode;
  className?: string;
}

/**
 * Page Header (Doc 2 §4.10) — eyebrow + w800 title + subtitle + ONE orange CTA.
 * Single `primaryAction` prop enforces the "one CTA per region" rule.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  primaryAction,
  secondaryActions,
  tabs,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-1 pb-5 mb-2 border-b border-hairline/60 animate-fade-up', className)}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-0.5">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className="text-[24px] font-extrabold text-ink leading-tight" suppressHydrationWarning>{title}</h1>
          {subtitle && <p className="text-[14px] text-ink-soft">{subtitle}</p>}
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 flex-shrink-0 mt-1" suppressHydrationWarning>
          {secondaryActions?.map((a) => {
            const Icon = a.icon;
            return (
              <Button key={a.label} variant="secondary" size="sm" onClick={a.onClick}>
                {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                {a.label}
              </Button>
            );
          })}
          {primaryAction && (
            <Button variant="primary" size="sm" onClick={primaryAction.onClick}>
              {(() => {
                const Icon = primaryAction.icon;
                return Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null;
              })()}
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>

      {tabs && <div className="mt-2">{tabs}</div>}
    </header>
  );
}
