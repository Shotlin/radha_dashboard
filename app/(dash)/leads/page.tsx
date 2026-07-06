/**
 * app/(dash)/leads/page.tsx — Leads pipeline. Owner/admin only.
 */
import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/page-header';
import { LockedOverlay } from '@/components/ui/locked-overlay';
import { EmptyState } from '@/components/ui/states';
import { LeadsClient } from './leads-client';

export const metadata: Metadata = { title: 'Leads' };

export default async function LeadsPage() {
  const session = await getSession();
  const role = session?.user?.role ?? 'staff';
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="GROWTH"
        title="Leads"
        subtitle="Manage inbound leads, update statuses, and convert to tenants."
      />
      {isOwnerOrAdmin ? (
        <LeadsClient />
      ) : (
        <LockedOverlay
          title="Leads is owner/admin only"
          description="Contact the account owner to access lead management."
        >
          <EmptyState
            title="Leads"
            description="Lead pipeline and conversion data lives here."
          />
        </LockedOverlay>
      )}
    </div>
  );
}
