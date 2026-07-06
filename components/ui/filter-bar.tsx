'use client';

import { useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Segment {
  value: string;
  label: string;
}

interface FilterBarProps {
  segments?: Segment[];
  activeSegment?: string;
  onSegmentChange?: (v: string) => void;
  searchPlaceholder?: string;
  onSearchChange?: (v: string) => void;
  className?: string;
  children?: React.ReactNode; // extra filter chips
}

/**
 * Filter Bar (Doc 2 §4.4) — segmented control with sliding orange indicator,
 * search input with orange focus ring. Sticky via parent layout.
 */
export function FilterBar({
  segments,
  activeSegment,
  onSegmentChange,
  searchPlaceholder = 'Search…',
  onSearchChange,
  className,
  children,
}: FilterBarProps) {
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = (v: string) => {
    setSearch(v);
    onSearchChange?.(v);
  };

  // Find active segment index for indicator positioning
  const activeIdx = segments?.findIndex((s) => s.value === activeSegment) ?? -1;

  return (
    <div
      className={cn(
        'flex items-center gap-3 flex-wrap py-2',
        className,
      )}
    >
      {/* Segmented control */}
      {segments && segments.length > 1 && (
        <div
          ref={containerRef}
          role="tablist"
          aria-label="Filter segments"
          className="relative flex items-center bg-surface-sunken rounded-full p-0.5 border border-hairline"
        >
          {/* Sliding indicator */}
          {activeIdx >= 0 && (
            <span
              aria-hidden="true"
              className="absolute top-0.5 bottom-0.5 bg-accent rounded-full transition-all duration-[200ms] ease-[var(--motion-enter)]"
              style={{
                left: `calc(${activeIdx} * (100% / ${segments.length}) + 2px)`,
                width: `calc(100% / ${segments.length} - 4px)`,
              }}
            />
          )}
          {segments.map((seg) => (
            <button
              key={seg.value}
              role="tab"
              aria-selected={seg.value === activeSegment}
              onClick={() => onSegmentChange?.(seg.value)}
              className={cn(
                'relative z-10 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors duration-150',
                seg.value === activeSegment ? 'text-white' : 'text-ink-soft hover:text-ink',
              )}
            >
              {seg.label}
            </button>
          ))}
        </div>
      )}

      {/* Extra chips */}
      {children}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      {onSearchChange !== undefined && (
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className={cn(
              'pl-9 pr-4 py-2 rounded-lg text-[14px]',
              'bg-surface-raised border border-hairline text-ink placeholder:text-ink-soft',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
              'transition-shadow duration-150',
            )}
          />
        </div>
      )}
    </div>
  );
}
