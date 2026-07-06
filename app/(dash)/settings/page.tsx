'use client';
/**
 * app/(dash)/settings/page.tsx — Phase 17
 * Tabbed settings screen:
 *   Profile | Language | Security | Tenant Info | Team (locked)
 */
import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import { ProfileCard } from '@/features/settings/components/profile-card';
import { LanguageSelect } from '@/features/settings/components/language-select';
import { SecurityCard } from '@/features/settings/components/security-card';
import { TenantInfo } from '@/features/settings/components/tenant-info';
import { TeamTabLocked } from '@/features/settings/components/team-tab-locked';

type Tab = 'profile' | 'language' | 'security' | 'tenant' | 'team';

const TABS: { key: Tab; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'language', label: 'Language' },
  { key: 'security', label: 'Security' },
  { key: 'tenant', label: 'Tenant Info' },
  { key: 'team', label: 'Team 🔒' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Settings"
        subtitle="Manage your profile, preferences, security, and team."
        tabs={
          <div
            role="tablist"
            aria-label="Settings sections"
            className="flex items-center gap-1 p-1 bg-[var(--surface-sunken)] rounded-lg w-fit flex-wrap"
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
      <div
        role="tabpanel"
        aria-label={TABS.find((t) => t.key === activeTab)?.label ?? activeTab}
        className="max-w-2xl"
      >
        {activeTab === 'profile' && <ProfileCard />}
        {activeTab === 'language' && <LanguageSelect />}
        {activeTab === 'security' && <SecurityCard />}
        {activeTab === 'tenant' && <TenantInfo />}
        {activeTab === 'team' && <TeamTabLocked />}
      </div>
    </div>
  );
}
