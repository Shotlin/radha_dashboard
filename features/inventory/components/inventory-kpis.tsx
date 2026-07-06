'use client';
/**
 * features/inventory/components/inventory-kpis.tsx
 * KPI strip: total SKUs, low-stock count, out-of-stock count.
 */
import { Package, AlertTriangle, XCircle } from 'lucide-react';
import { KpiTile } from '@/components/ui/kpi-tile';
import { useInventoryKpis } from '../inventory.queries';

interface InventoryKpisProps {
  storeId: string | null;
}

export function InventoryKpis({ storeId }: InventoryKpisProps) {
  const { data, isLoading, isError } = useInventoryKpis(storeId);

  const state = isLoading ? 'loading' : isError ? 'error' : 'default';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KpiTile
        label="Total SKUs"
        value={data?.totalSkus ?? 0}
        icon={Package}
        tint="text-accent"
        tintBg="bg-accent-tint"
        state={state}
      />
      <KpiTile
        label="Low Stock"
        value={data?.lowStockCount ?? 0}
        icon={AlertTriangle}
        tint="text-warn"
        tintBg="bg-[color:rgb(180_83_9_/_0.1)]"
        state={state}
        href={storeId ? `?storeId=${storeId}&filter=low-stock` : undefined}
        actionLabel={data?.lowStockCount ? 'View items →' : undefined}
      />
      <KpiTile
        label="Out of Stock"
        value={data?.outOfStockCount ?? 0}
        icon={XCircle}
        tint="text-danger"
        tintBg="bg-[color:rgb(185_28_28_/_0.08)]"
        state={state}
      />
    </div>
  );
}
