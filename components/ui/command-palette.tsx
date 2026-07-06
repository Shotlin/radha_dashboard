'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ElementType;
  onSelect: () => void;
  group?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
}

/**
 * Command Palette (Doc 2 §4.15) — ⌘K fuzzy nav + actions.
 * Keyboard-first; wired to global shortcut in Phase 04.
 */
export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = 'Search pages and actions…',
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = query.trim()
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  // Group items
  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    const g = item.group ?? 'Actions';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            'fixed z-50 top-[20%] left-1/2 -translate-x-1/2',
            'w-full max-w-[560px] bg-surface-raised rounded-xl shadow-[var(--shadow-card-md)]',
            'border border-hairline overflow-hidden',
            'data-[state=open]:animate-fade-up',
          )}
          aria-label="Command palette"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-hairline">
            <Search className="h-5 w-5 text-ink-soft flex-shrink-0" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className="flex-1 bg-transparent text-[15px] text-ink placeholder:text-ink-soft focus:outline-none"
            />
            <kbd className="text-[11px] text-ink-soft border border-hairline rounded px-1.5 py-0.5 font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div
            className="max-h-[360px] overflow-y-auto py-2"
            role="listbox"
            aria-label="Command results"
          >
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-center text-[13px] text-ink-soft">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}
            {Object.entries(groups).map(([group, groupItems]) => (
              <div key={group}>
                <p className="px-4 py-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-soft">
                  {group}
                </p>
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        item.onSelect();
                        onOpenChange(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left',
                        'hover:bg-accent-tint/30 focus:bg-accent-tint/30 focus:outline-none',
                        'transition-colors duration-100',
                      )}
                    >
                      {Icon && (
                        <div className="w-7 h-7 rounded-md bg-surface-sunken flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-ink-soft" aria-hidden="true" />
                        </div>
                      )}
                      <div>
                        <p className="text-[14px] font-medium text-ink">{item.label}</p>
                        {item.description && (
                          <p className="text-[12px] text-ink-soft">{item.description}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
