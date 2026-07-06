/**
 * app/(dash)/billing/page.tsx — Full billing page.
 * Reads session server-side; passes tenantId + role to client component.
 */
import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/page-header';
import { BillingClient } from './billing-client';

export const metadata: Metadata = { title: 'Billing' };

export default async function BillingPage() {
  const session = await getSession();
  const tenantId = session?.user?.tenantId ?? '';
  const role = session?.user?.role ?? 'staff';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="ACCOUNT"
        title="Billing &amp; Plans"
        subtitle="Manage your subscription, usage, and payments."
      />
      <BillingClient tenantId={tenantId} role={role} />
    </div>
  );
}
