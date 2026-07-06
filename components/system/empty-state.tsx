'use client';

/**
 * components/system/empty-state.tsx
 * EmptyState — the canonical designed empty state for a page region (R9.4).
 *
 * Anatomy (Visual Bible §3.14): a tonal icon badge, a w700 title, exactly one
 * supporting line of text, and exactly one orange call-to-action.
 *
 * Tokens-only: every color/spacing/radius is read from design tokens via Tailwind
 * classes (no hard-coded color/spacing/radius/duration literals — R9.1).
 */
import Link from 'next/link';
import type { ComponentType } from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** A lucide-react (or compatible) icon component. */
type IconComponent = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

/** The single orange call-to-action. Provide either `onClick` or `href`. */
export interface EmptyStateCta {
  label: string;
  onClick?: () => void;
  /** Same-origin route. When present, the CTA renders as a link. */
  href?: string;
}

export interface EmptyStateProps {
  /** Tonal badge icon (lucide-react). Defaults to an inbox. */
  icon?: IconComponent;
  /** Headline — rendered at w700. */
  title: string;
  /** Exactly one supporting line of text. */
  supportLine: string;
  /** The single orange CTA for this region. */
  cta?: EmptyStateCta;
  className?: string;
}

/**
 * EmptyState — render when a region has no data to show.
 * Exactly one orange CTA is rendered (R9.3 / R9.4): never two competing actions.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  supportLine,
  cta,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        'rounded-lg border border-hairline bg-surface-sunken',
        className,
      )}
    >
      {/* Tonal icon badge */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-tint">
        <Icon className="h-6 w-6 text-accent-deep" aria-hidden={true} />
      </div>

      <h3 className="text-[17px] font-bold text-ink">{title}</h3>
      <p className="max-w-xs text-[14px] text-ink-soft">{supportLine}</p>

      {cta &&
        (cta.href ? (
          <Button asChild variant="primary" size="sm" className="mt-1">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={cta.onClick} className="mt-1">
            {cta.label}
          </Button>
        ))}
    </div>
  );
}
