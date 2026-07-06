'use client';
/**
 * Sidebar — full navigation shell with groups, role/permission gating, active state.
 * Responsive: full (≥1024), icon-rail (768–1024), hidden (drawer handles <768).
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/auth/use-session';
import { NAV_ITEMS, GROUP_LABELS, GROUP_ORDER, type NavGroup } from '@/lib/nav-config';

interface SidebarProps {
  collapsed?: boolean; // icon-rail mode
  onNavClick?: () => void; // mobile drawer: close on nav
}

function NavIcon({ name, className }: { name: string; className?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] as React.ElementType | undefined;
  if (!Icon) return null;
  return <Icon className={cn('w-5 h-5 flex-shrink-0', className)} aria-hidden="true" />;
}

function NavGroup({
  group,
  collapsed,
  activeHref,
  userPermissions,
  userRole,
  onNavClick,
}: {
  group: NavGroup;
  collapsed: boolean;
  activeHref: string;
  userPermissions: string[];
  userRole: string;
  onNavClick?: () => void;
}) {
  const items = NAV_ITEMS.filter((item) => {
    if (item.group !== group) return false;
    if (item.role && item.role !== userRole) return false;
    return true;
  });

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5">
      {!collapsed && (
        <p className="eyebrow px-3 mb-1">{GROUP_LABELS[group]}</p>
      )}
      {items.map((item) => {
        const isActive =
          item.href === '/' ? activeHref === '/' : activeHref.startsWith(item.href);
        const hasAccess = item.permission ? userPermissions.includes(item.permission) : true;

        return (
          <Link
            key={item.href}
            href={hasAccess ? item.href : '#'}
            aria-disabled={!hasAccess}
            aria-current={isActive ? 'page' : undefined}
            title={collapsed ? item.label : undefined}
            onClick={onNavClick}
            className={cn(
              'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium',
              'transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1',
              isActive
                ? 'text-[var(--ink)] font-semibold'
                : 'text-[var(--ink-soft)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)]',
              !hasAccess && 'opacity-40 cursor-not-allowed',
            )}
          >
            {/* Active indicator */}
            {isActive && (
              <span
                className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full bg-[var(--accent)]"
                aria-hidden="true"
              />
            )}
            <NavIcon
              name={item.icon}
              className={isActive ? 'text-[var(--accent)]' : 'text-[var(--ink-soft)]'}
            />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar({ collapsed = false, onNavClick }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useSession();

  const userPermissions = user?.permissions ?? [];
  const userRole = user?.role ?? '';

  return (
    <nav
      className={cn(
        'flex flex-col h-full bg-[var(--surface-raised)] border-r border-[var(--hairline)]',
        'transition-[width] duration-[280ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
        collapsed ? 'w-[60px]' : 'w-[240px]',
      )}
      aria-label="Main navigation"
    >
      {/* Brand mark */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-5 border-b border-[var(--hairline)]',
          collapsed && 'justify-center px-2',
        )}
      >
        <div
          className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center font-extrabold text-[15px] flex-shrink-0"
          aria-hidden="true"
        >
          R
        </div>
        {!collapsed && (
          <span
            className="font-extrabold text-[15px] text-[var(--ink)]"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            RADHA
          </span>
        )}
      </div>

      {/* Nav groups */}
      <div className="flex flex-col gap-5 flex-1 overflow-y-auto px-3 py-4">
        {GROUP_ORDER.map((group) => (
          <NavGroup
            key={group}
            group={group}
            collapsed={collapsed}
            activeHref={pathname}
            userPermissions={userPermissions}
            userRole={userRole}
            onNavClick={onNavClick}
          />
        ))}
      </div>
    </nav>
  );
}
