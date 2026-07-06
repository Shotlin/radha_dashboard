/**
 * app/(dash)/analytics/page.tsx — Analytics: Website Stats | App Activity.
 * Owner/admin only — others see a locked state.
 */
import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/page-header';
import { LockedOverlay } from '@/components/ui/locked-overlay';
import { EmptyState } from '@/components/ui/states';
import { AnalyticsClient } from './analytics-client';

export const metadata: Metadata = { title: 'Analytics' };

export default async function AnalyticsPage() {
  const session = await getSession();
  const role = session?.user?.role ?? 'staff';
  const tenantId = session?.user?.tenantId ?? '';
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="INSIGHTS"
        title="Analytics"
        subtitle="Website performance, funnel, and app activity metrics."
      />
      {isOwnerOrAdmin ? (
        <AnalyticsClient tenantId={tenantId} />
      ) : (
        <LockedOverlay
          title="Analytics is owner/admin only"
          description="Contact the account owner to access analytics and lead data."
        >
          <EmptyState
            title="Analytics"
            description="Funnel, traffic, and conversion data lives here."
          />
        </LockedOverlay>
      )}
    </div>
  );
}
