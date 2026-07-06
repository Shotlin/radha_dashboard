'use client';
/**
 * StoreSwitcher — Radix Popover-based store selector.
 * Replaces the raw <select> with a pill chip trigger + branded dropdown.
 * Populates from GET /api/stores, scoped to user's accessible store IDs.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Popover from '@radix-ui/react-popover';
import { Store, ChevronDown, Check } from 'lucide-react';
import { useSession } from '@/lib/auth/use-session';
import { useStoreScope } from '@/lib/hooks/use-store-scope';
import { cn } from '@/lib/utils';

interface StoreItem {
  id: string;
  name: string;
}

async function fetchStores(): Promise<StoreItem[]> {
  const res = await fetch('/api/stores', { credentials: 'include' });
  if (!res.ok) return [];
  const data = (await res.json()) as { stores?: StoreItem[] };
  return data.stores ?? [];
}

export function StoreSwitcher() {
  const { user } = useSession();
  const { storeId, setStoreId } = useStoreScope();
  const [open, setOpen] = useState(false);

  const { data: stores = [] } = useQuery<StoreItem[]>({
    queryKey: ['stores'],
    queryFn: fetchStores,
    staleTime: 5 * 60 * 1000,
  });

  // Filter to user's accessible stores
  const accessible =
    user?.role === 'owner' || user?.role === 'admin'
      ? stores
      : stores.filter((s) => user?.storeIds?.includes(s.id));

  const showAllStores = user?.role === 'owner' || user?.role === 'admin';
  const current = accessible.find((s) => s.id === storeId);
  const label = current?.name ?? (showAllStores ? 'All stores' : 'Select store');

  const handleSelect = (id: string | null) => {
    setStoreId(id);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Store: ${label}`}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            'inline-flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-full',
            'bg-[var(--surface-sunken)] border border-[var(--hairline)]',
            'text-[13px] font-medium text-[var(--ink)]',
            'transition-colors duration-150',
            'hover:border-[var(--accent)]/40 hover:bg-[var(--surface-sunken)]',
            'focus-visible:outline-2 focus-visible:outline-[var(--accent)]',
            open && 'border-[var(--accent)]/40',
          )}
        >
          <Store className="w-3.5 h-3.5 text-[var(--ink-soft)]" aria-hidden="true" />
          <span className="max-w-[140px] truncate">{label}</span>
          <ChevronDown
            className={cn(
              'w-3 h-3 text-[var(--ink-soft)] transition-transform duration-150',
              open && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          role="listbox"
          aria-label="Select store"
          className={cn(
            'z-50 min-w-[200px] max-w-[280px]',
            'bg-[var(--surface-raised)] border border-[var(--hairline)]',
            'rounded-xl shadow-[var(--shadow-card-md)]',
            'py-1.5 overflow-hidden',
            'data-[state=open]:animate-fade-up',
          )}
        >
          {/* All stores option (owner/admin only) */}
          {showAllStores && (
            <button
              type="button"
              role="option"
              aria-selected={storeId === null}
              onClick={() => handleSelect(null)}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3 py-2.5',
                'text-[13px] transition-colors',
                storeId === null
                  ? 'font-semibold text-[var(--accent)]'
                  : 'text-[var(--ink)] hover:bg-[var(--surface-sunken)]',
              )}
            >
              <span>All stores</span>
              {storeId === null && (
                <Check className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
              )}
            </button>
          )}

          {accessible.length > 0 && showAllStores && (
            <hr className="border-[var(--hairline)] my-1" />
          )}

          {/* Individual stores */}
          {accessible.map((store) => (
            <button
              key={store.id}
              type="button"
              role="option"
              aria-selected={storeId === store.id}
              onClick={() => handleSelect(store.id)}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3 py-2.5',
                'text-[13px] transition-colors',
                storeId === store.id
                  ? 'font-semibold text-[var(--accent)]'
                  : 'text-[var(--ink)] hover:bg-[var(--surface-sunken)]',
              )}
            >
              <span className="truncate">{store.name}</span>
              {storeId === store.id && (
                <Check className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" aria-hidden="true" />
              )}
            </button>
          ))}

          {accessible.length === 0 && (
            <p className="px-3 py-2.5 text-[13px] text-[var(--ink-soft)]">No stores found</p>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
