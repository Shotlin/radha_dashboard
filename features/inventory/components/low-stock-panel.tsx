'use client';
/**
 * features/inventory/components/low-stock-panel.tsx
 * List of low-stock items with alert indicators.
 */
import { AlertTriangle } from 'lucide-react';
import { Skeleton, ErrorState } from '@/components/ui/states';
import { cn } from '@/lib/utils';
import { useLowStock, type InventoryItem } from '../inventory.queries';

function LowStockRow({ item }: { item: InventoryItem }) {
  const isOut = item.currentStock === 0;
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-hairline last:border-0',
        'hover:bg-surface-sunken/40 transition-colors',
      )}
    >
      {/* Alert indicator */}
      <span
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
          isOut
            ? 'bg-[color:rgb(185_28_28_/_0.1)]'
            : 'bg-[color:rgb(180_83_9_/_0.1)]',
        )}
        aria-hidden="true"
      >
        <AlertTriangle
          className={cn('h-4 w-4', isOut ? 'text-danger' : 'text-warn')}
        />
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-ink truncate">{item.productName}</p>
        <p className="text-[12px] text-ink-soft font-mono">{item.ean}</p>
      </div>

      {/* Stock badges */}
      <div className="flex-shrink-0 text-right">
        <p
          className={cn(
            'text-[15px] font-bold font-mono tabular-nums',
            isOut ? 'text-danger' : 'text-warn',
          )}
        >
          {item.currentStock}
        </p>
        {item.minStock !== undefined && (
          <p className="text-[11px] text-ink-soft">min {item.minStock}</p>
        )}
      </div>
    </div>
  );
}

interface LowStockPanelProps {
  storeId: string | null;
}

export function LowStockPanel({ storeId }: LowStockPanelProps) {
  const { data, isLoading, isError } = useLowStock(storeId);

  if (isLoading) {
    return (
      <div className="card overflow-hidden divide-y divide-hairline">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-8 w-8 flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Could not load low-stock items." />;
  }

  if (!data?.items.length) {
    return (
      <div className="card flex flex-col items-center justify-center gap-2 py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-[color:rgb(21_128_61_/_0.1)] flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-success" aria-hidden="true" />
        </div>
        <p className="text-[14px] font-semibold text-ink">All stock levels are healthy</p>
        <p className="text-[13px] text-ink-soft">No low-stock alerts right now.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {data.items.map((item) => (
        <LowStockRow key={item.id} item={item} />
      ))}
      {data.total > data.items.length && (
        <div className="px-4 py-2 bg-surface-sunken border-t border-hairline">
          <p className="text-[12px] text-ink-soft text-center">
            Showing {data.items.length} of {data.total} low-stock items
          </p>
        </div>
      )}
    </div>
  );
}
