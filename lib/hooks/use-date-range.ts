'use client';
/**
 * use-date-range — global date range, URL-synced.
 * Defaults to last 30 days when not set.
 */
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { subDays, format, parseISO, isValid } from 'date-fns';

const DATE_FMT = 'yyyy-MM-dd';

function today(): string {
  return format(new Date(), DATE_FMT);
}

function defaultFrom(): string {
  return format(subDays(new Date(), 30), DATE_FMT);
}

export interface DateRange {
  from: string; // 'yyyy-MM-dd'
  to: string;
}

export interface UseDateRangeResult {
  range: DateRange;
  setRange: (r: DateRange) => void;
}

export function useDateRange(): UseDateRangeResult {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const fromParam = params.get('from');
  const toParam = params.get('to');

  const from =
    fromParam && isValid(parseISO(fromParam)) ? fromParam : defaultFrom();
  const to = toParam && isValid(parseISO(toParam)) ? toParam : today();

  const setRange = useCallback(
    (r: DateRange) => {
      const sp = new URLSearchParams(params.toString());
      sp.set('from', r.from);
      sp.set('to', r.to);
      router.push(`${pathname}?${sp.toString()}`);
    },
    [params, pathname, router],
  );

  return { range: { from, to }, setRange };
}
