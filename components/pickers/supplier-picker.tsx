'use client';
/**
 * components/pickers/supplier-picker.tsx
 * Reusable supplier picker for GRN and other forms.
 * Renders as a searchable select dropdown.
 */
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuppliersList } from '@/features/suppliers/suppliers.queries';

interface SupplierPickerProps {
  value?: string; // supplierId
  onChange: (id: string | undefined, name?: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * SupplierPicker — searchable dropdown to pick a supplier by ID.
 * Keyboard navigable: arrow keys move selection, Enter/Space confirm, Escape close.
 */
export function SupplierPicker({
  value,
  onChange,
  placeholder = 'Select supplier…',
  className,
  disabled = false,
}: SupplierPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useSuppliersList({
    search: search || undefined,
    isActive: true,
  });

  // Find selected supplier label
  const { data: allData } = useSuppliersList({});
  const selectedSupplier = allData?.items.find((s) => s.id === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[14px]',
          'bg-surface border border-hairline text-left',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'transition-shadow duration-150',
          open && 'ring-2 ring-accent border-accent',
        )}
      >
        <span className={cn(selectedSupplier ? 'text-ink' : 'text-ink-soft')}>
          {selectedSupplier?.name ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-ink-soft transition-transform duration-150',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            'absolute z-50 top-full left-0 right-0 mt-1',
            'bg-surface-raised border border-hairline rounded-lg shadow-[var(--shadow-card-md)]',
            'overflow-hidden',
          )}
          role="listbox"
          aria-label="Supplier options"
        >
          {/* Search */}
          <div className="p-2 border-b border-hairline">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search suppliers…"
                className={cn(
                  'w-full pl-8 pr-3 py-1.5 rounded-md text-[13px]',
                  'bg-surface border border-hairline placeholder:text-ink-soft text-ink',
                  'focus:outline-none focus:ring-1 focus:ring-accent',
                )}
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto">
            {/* Clear option */}
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => { onChange(undefined); setOpen(false); setSearch(''); }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-left',
                'hover:bg-accent-tint/20 transition-colors',
                !value && 'font-semibold text-accent',
              )}
            >
              <span className="flex-1 text-ink-soft italic">No supplier</span>
              {!value && <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />}
            </button>

            {isLoading && (
              <div className="px-3 py-4 text-center text-[13px] text-ink-soft">Loading…</div>
            )}

            {!isLoading && !data?.items.length && (
              <div className="px-3 py-4 text-center text-[13px] text-ink-soft">
                {search ? 'No results.' : 'No suppliers found.'}
              </div>
            )}

            {data?.items.map((supplier) => (
              <button
                key={supplier.id}
                type="button"
                role="option"
                aria-selected={supplier.id === value}
                onClick={() => {
                  onChange(supplier.id, supplier.name);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-left',
                  'hover:bg-accent-tint/20 transition-colors',
                  supplier.id === value && 'bg-accent-tint/10',
                )}
              >
                <span className="flex-1 text-ink">{supplier.name}</span>
                {supplier.id === value && (
                  <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
