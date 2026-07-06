'use client';
/**
 * ThemeToggle — dark/light mode toggle.
 *
 * Reads/writes `data-theme="dark"` on <html>.
 * Persists preference in localStorage under "radha-theme".
 * Falls back to `prefers-color-scheme` when no persisted preference exists.
 *
 * Mount next to the notifications bell in <TopBar>.
 */
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('radha-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return null;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // On mount: resolve initial theme (stored → system)
  useEffect(() => {
    const initial = getStoredTheme() ?? getSystemTheme();
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);

    // Also listen for OS-level preference changes (only when no manual override)
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!getStoredTheme()) {
        const next: Theme = e.matches ? 'dark' : 'light';
        setTheme(next);
        applyTheme(next);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem('radha-theme', next);
  }

  // Avoid hydration mismatch — render a placeholder until mounted
  if (!mounted) {
    return (
      <div
        className="w-9 h-9 rounded-lg"
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-lg',
        'text-[var(--ink-soft)] hover:bg-[var(--surface-sunken)]',
        'transition-colors duration-[var(--duration-micro)]',
        'focus-visible:outline-2 focus-visible:outline-[var(--accent)]',
      )}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  );
}
