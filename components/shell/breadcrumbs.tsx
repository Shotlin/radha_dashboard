'use client';
/**
 * Breadcrumbs — for 3+ level drill-downs.
 */
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
  className?: string;
}

export function Breadcrumbs({ crumbs, className }: BreadcrumbsProps) {
  if (crumbs.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1', className)}>
      <ol className="flex items-center gap-1 flex-wrap">
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1">
              {idx > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-soft)]" aria-hidden="true" />
              )}
              {isLast || !crumb.href ? (
                <span
                  className="text-[13px] text-[var(--ink)] font-medium"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-[13px] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
