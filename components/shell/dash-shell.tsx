'use client';
/**
 * DashShell — client shell component.
 * Handles responsive sidebar, mobile drawer, ⌘K wiring, top bar,
 * and the global impersonation banner (Phase 16).
 */
import { useState } from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { CommandPaletteProvider, useCommandPalette } from './command-palette-provider';
import { ImpersonationBanner } from '@/features/admin/components/impersonation-banner';
import { DemoIndicator } from '@/components/system/demo-indicator';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { cn } from '@/lib/utils';

function ShellInner({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { open: openCmdK } = useCommandPalette();

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');

  return (
    <div className="flex min-h-[100dvh] bg-[var(--surface)]">
      {/* ── Desktop / tablet sidebar ─────────────────────── */}
      {isTablet && !drawerOpen && (
        <div className="hidden md:flex flex-shrink-0">
          <Sidebar collapsed={!isDesktop} />
        </div>
      )}

      {/* ── Mobile drawer ────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-[var(--ink)]/40"
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <div
            className={cn(
              'fixed left-0 top-0 bottom-0 z-50 w-[240px]',
              'shadow-drawer',
              'transition-transform duration-300',
              'translate-x-0',
              'drawer-enter',
            )}
            role="navigation"
            aria-label="Mobile navigation"
          >
            <Sidebar onNavClick={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      {/* ── Main area ────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          onMenuClick={() => setDrawerOpen((v) => !v)}
          onCmdK={openCmdK}
        />
        {/* Global impersonation banner — only renders when a session is active */}
        <ImpersonationBanner />
        {/* Persistent Demo_Indicator — only renders on a demo session (R2.1–R2.3).
            Sibling of the scroll region below, so it stays visible across scroll
            and across client navigations (the shell never unmounts). */}
        <DemoIndicator />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-7"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashShell({ children }: { children: React.ReactNode }) {
  return (
    <CommandPaletteProvider>
      <ShellInner>{children}</ShellInner>
    </CommandPaletteProvider>
  );
}
