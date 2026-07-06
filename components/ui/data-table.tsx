'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Download } from 'lucide-react';
import { Button } from './button';
import { Skeleton } from './states';
import { cn } from '@/lib/utils';

export type SortDir = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  key: string;
  header: string;
  /** If true, renders cell in JetBrains Mono with tabular-nums */
  mono?: boolean;
  sortable?: boolean;
  /** Custom cell renderer */
  render?: (row: T) => React.ReactNode;
  /** Tailwind classes for the column */
  className?: string;
  hidden?: boolean;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey: (row: T) => string;
  state?: 'default' | 'loading' | 'empty' | 'error';
  emptyMessage?: string;
  /** Called with CSV blob URL when user clicks export */
  onExport?: () => void;
  /** Cursor pagination */
  hasNextPage?: boolean;
  onNextPage?: () => void;
  hasPrevPage?: boolean;
  onPrevPage?: () => void;
  className?: string;
}

/**
 * Data Table (Doc 2 §4.2) — sticky header, aria-sort, zebra, mono numeric cols,
 * row hover, cursor pagination, CSV export, empty/error/skeleton rows.
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  state = 'default',
  emptyMessage = 'No records found.',
  onExport,
  hasNextPage,
  onNextPage,
  hasPrevPage,
  onPrevPage,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir }>({ key: '', dir: null });
  // Prevent SSR/client hydration mismatch: loading skeleton differs from server-rendered empty state
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Before client mount, use 'default' state to match server render (no loading skeletons)
  const resolvedState = mounted ? state : 'default';

  const visibleCols = columns.filter((c) => !c.hidden);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return { key: '', dir: null };
    });
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sort.key !== colKey) return <ChevronsUpDown className="h-3.5 w-3.5 text-ink-soft" aria-hidden="true" />;
    if (sort.dir === 'asc') return <ChevronUp className="h-3.5 w-3.5 text-accent" aria-hidden="true" />;
    return <ChevronDown className="h-3.5 w-3.5 text-accent" aria-hidden="true" />;
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Export button */}
      {onExport && (
        <div className="flex justify-end mb-2">
          <Button variant="ghost" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-1" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      )}

      <div className="overflow-auto rounded-lg border border-hairline">
        <table className="w-full text-[14px] text-left border-collapse" role="grid" suppressHydrationWarning>
          <thead className="sticky top-0 z-10 bg-surface-sunken border-b border-hairline">
            <tr>
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    col.sortable
                      ? sort.key === col.key
                        ? sort.dir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                  className={cn(
                    'px-4 py-3 font-semibold text-ink-soft text-[11px] uppercase tracking-[0.06em] whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-ink',
                    col.className,
                  )}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody suppressHydrationWarning>
            {resolvedState === 'loading' &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-hairline" aria-hidden="true">
                  {visibleCols.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton className="h-4" />
                    </td>
                  ))}
                </tr>
              ))}

            {resolvedState === 'empty' && (
              <tr>
                <td colSpan={visibleCols.length} className="px-4 py-12 text-center text-ink-soft">
                  {emptyMessage}
                </td>
              </tr>
            )}

            {resolvedState === 'error' && (
              <tr>
                <td colSpan={visibleCols.length} className="px-4 py-8 text-center text-danger text-[13px]">
                  Failed to load data.
                </td>
              </tr>
            )}

            {resolvedState === 'default' &&
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-t border-hairline transition-colors hover:bg-surface-sunken"
                >
                  {visibleCols.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-ink',
                        col.mono && 'font-mono tabular-nums',
                        col.className,
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(hasPrevPage || hasNextPage) && (
        <div className="flex items-center justify-end gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasPrevPage}
            onClick={onPrevPage}
          >
            ← Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasNextPage}
            onClick={onNextPage}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
