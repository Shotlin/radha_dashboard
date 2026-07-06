'use client';
/**
 * CommandPaletteProvider — ⌘K / Ctrl-K global command palette.
 * Fuzzy navigation to all pages + quick actions.
 */
import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface CommandPaletteContextValue {
  open: () => void;
  close: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  open: () => {},
  close: () => {},
});

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

const QUICK_LINKS = [
  { label: 'Overview', href: '/' },
  { label: 'Expiry tracker', href: '/expiry' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'GRN', href: '/grn' },
  { label: 'Suppliers', href: '/suppliers' },
  { label: 'Audit / EAN lists', href: '/audit' },
  { label: 'Reports', href: '/reports' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Billing', href: '/billing' },
  { label: 'Notifications', href: '/notifications' },
  { label: 'Settings', href: '/settings' },
  { label: 'Admin console', href: '/admin' },
];

/* ── Inner input + results ────────────────────────────────────────────────── */
function CmdInput({
  links,
  onNavigate,
  onClose,
}: {
  links: typeof QUICK_LINKS;
  onNavigate: (href: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  const filtered = q.trim()
    ? links.filter((l) => l.label.toLowerCase().includes(q.toLowerCase()))
    : links;

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIdx]) {
      onNavigate(filtered[activeIdx].href);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <input
        autoFocus
        type="text"
        placeholder="Search pages and actions…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActiveIdx(0);
        }}
        onKeyDown={handleKey}
        className="w-full bg-transparent text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none"
        aria-label="Search"
        aria-autocomplete="list"
        aria-activedescendant={filtered[activeIdx] ? `cmd-item-${activeIdx}` : undefined}
      />
      {filtered.length > 0 && (
        <ul
          role="listbox"
          className="mt-2 -mx-4 border-t border-[var(--hairline)] max-h-72 overflow-y-auto"
          aria-label="Results"
        >
          {filtered.slice(0, 12).map((item, idx) => (
            <li
              key={item.href}
              id={`cmd-item-${idx}`}
              role="option"
              aria-selected={idx === activeIdx}
              onClick={() => onNavigate(item.href)}
              className={`flex items-center gap-3 px-4 py-2.5 text-[14px] cursor-pointer transition-colors ${
                idx === activeIdx
                  ? 'bg-[var(--accent-tint)] text-[var(--accent-deep)]'
                  : 'text-[var(--ink)] hover:bg-[var(--surface-sunken)]'
              }`}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
      {filtered.length === 0 && q && (
        <p className="mt-3 mb-1 text-[13px] text-[var(--ink-soft)]">
          No results for &ldquo;{q}&rdquo;
        </p>
      )}
    </div>
  );
}

/* ── Provider ─────────────────────────────────────────────────────────────── */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const openPalette = useCallback(() => setIsOpen(true), []);
  const closePalette = useCallback(() => setIsOpen(false), []);

  // ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === 'Escape') setIsOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open: openPalette, close: closePalette }}>
      {children}

      {isOpen && (
        <>
          {/* Scrim */}
          <div
            className="fixed inset-0 z-[90] bg-[var(--ink)]/30 backdrop-blur-[2px]"
            aria-hidden="true"
            onClick={closePalette}
          />

          {/* Palette dialog */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="fixed inset-x-4 top-[15vh] z-[100] max-w-lg mx-auto"
          >
            <div className="bg-[var(--surface-raised)] rounded-2xl border border-[var(--hairline)] shadow-[0_20px_60px_rgba(28,25,23,0.15)] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--ink-soft)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="flex-shrink-0"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <CmdInput
                  links={QUICK_LINKS}
                  onNavigate={(href) => {
                    router.push(href);
                    closePalette();
                  }}
                  onClose={closePalette}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </CommandPaletteContext.Provider>
  );
}
