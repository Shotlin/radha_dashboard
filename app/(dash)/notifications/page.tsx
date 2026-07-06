'use client';
/**
 * app/(dash)/notifications/page.tsx
 * Notifications screen — Inbox | Preferences tabs.
 * "Send test" panel is shown only for admin/owner roles.
 */
import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { RoleGate } from '@/components/auth/role-gate';
import { cn } from '@/lib/utils';
import { InboxList } from '@/features/notifications/components/inbox-list';
import { NotificationPreferences } from '@/features/notifications/components/preferences';
import { TestSendPanel } from '@/features/notifications/components/test-send';

type Tab = 'inbox' | 'preferences';

const TABS: { key: Tab; label: string }[] = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'preferences', label: 'Preferences' },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('inbox');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="OPERATIONS"
        title="Notifications"
        subtitle="Manage your alerts, inbox, and delivery preferences."
        tabs={
          <div
            role="tablist"
            aria-label="Notifications sections"
            className="flex items-center gap-1 p-1 bg-[var(--surface-sunken)] rounded-lg w-fit"
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors duration-150',
                  activeTab === tab.key
                    ? 'bg-[var(--surface-raised)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)]',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Tab panels */}
      <div role="tabpanel" aria-label={activeTab === 'inbox' ? 'Inbox' : 'Preferences'}>
        {activeTab === 'inbox' && (
          <div className="flex flex-col gap-4">
            {/* Send test — admin/owner only */}
            <RoleGate roles={['admin', 'owner']}>
              <TestSendPanel />
            </RoleGate>

            {/* Inbox */}
            <div className="card overflow-hidden">
              <InboxList />
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="flex flex-col gap-4 max-w-2xl">
            <NotificationPreferences />
          </div>
        )}
      </div>
    </div>
  );
}
