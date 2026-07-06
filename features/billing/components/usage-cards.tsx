'use client';
/**
 * features/billing/components/usage-cards.tsx
 * Usage KPI tiles: stores used/limit, users, scans.
 */
import { Store, Users, ScanLine } from 'lucide-react';
import { KpiTile } from '@/components/ui/kpi-tile';
import { CardSkeleton } from '@/components/ui/states';
import type { Usage } from '../billing.schema';

interface UsageCardsProps {
  usage: Usage | undefined;
  isLoading?: boolean;
  isError?: boolean;
}

export function UsageCards({ usage, isLoading, isError }: UsageCardsProps) {
  const state = isLoading ? 'loading' : isError ? 'error' : 'default';

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const formatWithLimit = (value: number, limit?: number) =>
    limit !== undefined ? `${value} / ${limit}` : String(value);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <KpiTile
        label="Stores"
        value={usage?.stores ?? 0}
        icon={Store}
        tint="text-accent"
        tintBg="bg-accent-tint"
        state={state}
        format={(n) => formatWithLimit(n, usage?.storesLimit)}
      />
      <KpiTile
        label="Users"
        value={usage?.users ?? 0}
        icon={Users}
        tint="text-teal"
        tintBg="bg-[color:rgb(15_118_110_/_0.1)]"
        state={state}
        format={(n) => formatWithLimit(n, usage?.usersLimit)}
      />
      <KpiTile
        label="Scans"
        value={usage?.scans ?? 0}
        icon={ScanLine}
        tint="text-[#6d5bd0]"
        tintBg="bg-[color:rgb(109_91_208_/_0.1)]"
        state={state}
        format={(n) => formatWithLimit(n, usage?.scansLimit)}
      />
    </div>
  );
}
