'use client';
/**
 * TopBar — sticky top bar with store switcher, ⌘K trigger, bell, avatar menu.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, LogOut, User, Settings } from 'lucide-react';
import { StoreSwitcher } from './store-switcher';
import { NotificationsBell } from './notifications-bell';
import { ThemeToggle } from './theme-toggle';
import { useSession } from '@/lib/auth/use-session';
import { cn } from '@/lib/utils';

interface TopBarProps {
  onMenuClick?: () => void;
  onCmdK?: () => void;
}

function AvatarMenu() {
  const { user } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.replace('/login');
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'R';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-9 h-9 rounded-full bg-[var(--accent-tint)] text-[var(--accent-deep)]',
          'flex items-center justify-center font-bold text-[13px]',
          'hover:opacity-80 transition-opacity',
          'focus-visible:outline-2 focus-visible:outline-[var(--accent)]',
        )}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {initials}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div
            role="menu"
            className={cn(
              'absolute right-0 top-full mt-2 w-52 z-50',
              'bg-[var(--surface-raised)] border border-[var(--hairline)]',
              'rounded-xl shadow-[var(--shadow-card)]',
              'py-1 overflow-hidden',
            )}
          >
            {/* User info */}
            <div className="px-4 py-2.5 border-b border-[var(--hairline)]">
              <p className="text-[13px] font-semibold text-[var(--ink)] truncate">
                {user?.name ?? 'Admin'}
              </p>
              <p className="text-[11px] text-[var(--ink-soft)] capitalize">{user?.role}</p>
            </div>

            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[var(--ink)] hover:bg-[var(--surface-sunken)] transition-colors"
            >
              <User className="w-4 h-4 text-[var(--ink-soft)]" aria-hidden="true" />
              Profile
            </Link>
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[var(--ink)] hover:bg-[var(--surface-sunken)] transition-colors"
            >
              <Settings className="w-4 h-4 text-[var(--ink-soft)]" aria-hidden="true" />
              Settings
            </Link>

            <hr className="border-[var(--hairline)] my-1" />

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-danger hover:bg-[color:rgb(185_28_28_/_0.06)] transition-colors"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function TopBar({ onMenuClick, onCmdK }: TopBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center gap-3 h-14 px-4',
        'bg-[var(--surface-raised)]/95 backdrop-blur-sm border-b border-[var(--hairline)]',
      )}
    >
      {/* Mobile menu button */}
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-[var(--ink-soft)] hover:bg-[var(--surface-sunken)]"
          aria-label="Open navigation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
      )}

      {/* Store switcher */}
      <StoreSwitcher />

      {/* Spacer */}
      <div className="flex-1" />

      {/* ⌘K search trigger */}
      <button
        type="button"
        onClick={onCmdK}
        className={cn(
          'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'bg-[var(--surface-sunken)] border border-[var(--hairline)]',
          'text-[13px] text-[var(--ink-soft)]',
          'hover:border-[var(--accent)] hover:text-[var(--ink)] transition-colors',
          'focus-visible:outline-2 focus-visible:outline-[var(--accent)]',
        )}
        aria-label="Open command palette (⌘K)"
      >
        <Search className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Search&hellip;</span>
        <kbd className="ml-2 text-[10px] font-mono border border-[var(--hairline)] rounded px-1 py-0.5 opacity-60">
          ⌘K
        </kbd>
      </button>

      {/* Right group */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <div className="w-px h-5 bg-[var(--hairline)] mx-1" aria-hidden="true" />
        <NotificationsBell />
        <AvatarMenu />
      </div>
    </header>
  );
}
