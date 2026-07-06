'use client';
/**
 * features/expiry/components/expiry-kpis.tsx
 * Three KPI tiles: near-expiry count, expired count, forecast loss (expiring 30d).
 */
import { Clock, XCircle, AlertTriangle } from 'lucide-react';
import { KpiTile } from '@/components/ui/kpi-tile';
import { useExpiryKpis } from '../expiry.queries';
import { cn } from '@/lib/utils';

interface ExpiryKpisProps {
  storeId: string | null;
  className?: string;
}

export function ExpiryKpis({ storeId, className }: ExpiryKpisProps) {
  const { data, isLoading, isError } = useExpiryKpis(storeId);

  const tileState = isLoading ? 'loading' : isError ? 'error' : 'default';

  return (
    <div
      className={cn('grid grid-cols-1 sm:grid-cols-3 gap-4', className)}
      aria-label="Expiry KPIs"
    >
      <KpiTile
        label="Expiring within 7 days"
        value={data?.expiring7d ?? 0}
        icon={Clock}
        tint="text-warn"
        tintBg="bg-[color:rgb(180_83_9_/_0.08)]"
        state={tileState}
      />
      <KpiTile
        label="Already expired"
        value={data?.expired ?? 0}
        icon={XCircle}
        tint="text-danger"
        tintBg="bg-[color:rgb(185_28_28_/_0.08)]"
        state={tileState}
      />
      <KpiTile
        label="Expiring within 30 days"
        value={data?.expiring30d ?? 0}
        icon={AlertTriangle}
        tint="text-accent"
        tintBg="bg-accent-tint"
        state={tileState}
      />
    </div>
  );
}
