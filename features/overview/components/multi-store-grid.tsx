'use client';
/**
 * Multi-store grid — owner "All stores" view: store cards with mini-KPIs
 */
import { useRouter } from 'next/navigation';
import { EmptyState, CardSkeleton } from '@/components/ui/states';
import { Eyebrow } from '@/components/ui/eyebrow';
import { useMultiStoreRollup } from '../overview.queries';
import type { MultiStoreItem } from '../overview.schema';

function StoreCard({ store }: { store: MultiStoreItem }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/?storeId=${store.storeId}`)}
      className="card p-5 text-left flex flex-col gap-3 hover:shadow-[var(--shadow-card-md)] transition-shadow duration-150 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-bold text-[var(--ink)]">{store.name}</h3>
        {store.healthScore !== undefined && (
          <span
            className="font-mono tabular-nums text-[13px] font-bold"
            style={{
              color: store.healthScore >= 70 ? 'var(--success)' : store.healthScore >= 40 ? 'var(--warn)' : 'var(--danger)',
            }}
          >
            {store.healthScore}%
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {[
          { label: 'Expiring', value: store.kpis.expiringItems },
          { label: 'Expired', value: store.kpis.expiredItems },
          { label: 'Tasks', value: store.kpis.openTasks },
          { label: 'Low stock', value: store.kpis.lowStockItems },
        ].map(({ label, value }) =>
          value !== undefined ? (
            <div key={label} className="flex items-baseline gap-1.5">
              <span className="font-mono tabular-nums font-bold text-[16px] text-[var(--ink)]">
                {value}
              </span>
              <span className="text-[11px] text-[var(--ink-soft)]">{label}</span>
            </div>
          ) : null,
        )}
      </div>
    </button>
  );
}

export function MultiStoreGrid() {
  const { data, isLoading } = useMultiStoreRollup(true);
  const stores = data?.stores ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Eyebrow>All Stores</Eyebrow>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <EmptyState
        title="No stores yet"
        description="Add your first store to see cross-store analytics here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Eyebrow>All Stores ({stores.length})</Eyebrow>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => (
          <StoreCard key={store.storeId} store={store} />
        ))}
      </div>
    </div>
  );
}
