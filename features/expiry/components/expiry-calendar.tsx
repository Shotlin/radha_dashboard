'use client';
/**
 * features/expiry/components/expiry-calendar.tsx
 * Month-view calendar heat grid. Day cells show dot density by expiry count.
 * Click on a day to select it (surfaced via onDaySelect).
 */
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/states';
import { cn } from '@/lib/utils';
import { useExpiryCalendar } from '../expiry.queries';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

interface DayDotProps {
  count: number;
  severity: string;
}

function DayDots({ count, severity }: DayDotProps) {
  const dots = Math.min(count, 5);
  if (dots === 0) return null;
  const color =
    severity === 'expired'
      ? 'bg-danger'
      : severity === 'expiring_soon' || severity === 'warning'
        ? 'bg-warn'
        : 'bg-accent';
  return (
    <div className="flex items-center justify-center gap-[2px] mt-1" aria-hidden="true">
      {Array.from({ length: dots }).map((_, i) => (
        <span key={i} className={cn('w-1 h-1 rounded-full', color)} />
      ))}
    </div>
  );
}

interface ExpiryCalendarProps {
  storeId: string | null;
  onDaySelect?: (date: string) => void;
  className?: string;
}

export function ExpiryCalendar({ storeId, onDaySelect, className }: ExpiryCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const month = formatMonth(currentDate);
  const { data, isLoading, isError } = useExpiryCalendar(storeId, month);

  // Build a map from date string → day data
  const dayMap = useMemo(() => {
    const m: Record<string, { count: number; severity: string }> = {};
    data?.days.forEach((d) => {
      m[d.date] = { count: d.count, severity: d.severity };
    });
    return m;
  }, [data]);

  // Build calendar grid
  const { firstDayOffset, daysInMonth } = useMemo(() => {
    const y = currentDate.getFullYear();
    const mo = currentDate.getMonth();
    const first = new Date(y, mo, 1);
    return {
      firstDayOffset: first.getDay(), // 0=Sun
      daysInMonth: new Date(y, mo + 1, 0).getDate(),
    };
  }, [currentDate]);

  const prevMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const handleDayClick = (day: number) => {
    const dateStr = `${month}-${String(day).padStart(2, '0')}`;
    setSelectedDay(dateStr);
    onDaySelect?.(dateStr);
  };

  if (isLoading) {
    return (
      <div className={cn('card p-4', className)} aria-busy="true">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn('card p-4 flex items-center justify-center min-h-[180px]', className)}>
        <p className="text-danger text-[13px]">Failed to load calendar.</p>
      </div>
    );
  }

  return (
    <section className={cn('card p-4', className)} aria-label="Expiry calendar">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" aria-hidden="true" />
          <span className="text-[15px] font-bold text-ink">{formatMonthLabel(currentDate)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMonth}
            aria-label="Previous month"
            className="p-1.5"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            aria-label="Next month"
            className="p-1.5"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1" role="row">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            role="columnheader"
            aria-label={d}
            className="text-center text-[11px] font-semibold text-ink-soft py-1 uppercase tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`${formatMonthLabel(currentDate)} expiry calendar`}>
        {/* Empty cells before first day */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} role="gridcell" aria-hidden="true" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const dateStr = `${month}-${String(day).padStart(2, '0')}`;
          const info = dayMap[dateStr];
          const isSelected = selectedDay === dateStr;
          const hasItems = !!info && info.count > 0;

          return (
            <button
              key={day}
              role="gridcell"
              aria-label={`${dateStr}${info ? `, ${info.count} items` : ''}`}
              aria-pressed={isSelected}
              onClick={() => handleDayClick(day)}
              className={cn(
                'relative flex flex-col items-center justify-start py-1.5 rounded-md min-h-[44px]',
                'text-[13px] font-medium transition-colors',
                'focus-visible:outline-2 focus-visible:outline-accent',
                isSelected
                  ? 'bg-accent text-white'
                  : hasItems
                    ? 'hover:bg-accent-tint text-ink'
                    : 'hover:bg-surface-sunken text-ink-soft',
              )}
            >
              <span>{day}</span>
              {!isSelected && info && (
                <DayDots count={info.count} severity={info.severity} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-hairline flex-wrap">
        <span className="text-[11px] text-ink-soft font-medium uppercase tracking-wide">Legend:</span>
        {[
          { color: 'bg-danger', label: 'Expired' },
          { color: 'bg-warn', label: 'Expiring soon' },
          { color: 'bg-accent', label: 'Upcoming' },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-[12px] text-ink-soft">
            <span className={cn('w-2 h-2 rounded-full', item.color)} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}
