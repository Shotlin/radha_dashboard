'use client';
/**
 * app/(dash)/page.tsx — Overview / Command Centre (Phase 06).
 * Morning greeting + KPI bento + OHS + trends + alerts + activity.
 * Owner "All stores" → multi-store grid.
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileBarChart2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Eyebrow } from '@/components/ui/eyebrow';
import { useSession } from '@/lib/auth/use-session';
import { useStoreScope } from '@/lib/hooks/use-store-scope';
import { KpiBento } from '@/features/overview/components/kpi-bento';
import { OhsCard } from '@/features/overview/components/ohs-card';
import { TrendCard } from '@/features/overview/components/trend-card';
import { AlertsPanel } from '@/features/overview/components/alerts-panel';
import { ActivityFeed } from '@/features/overview/components/activity-feed';
import { MultiStoreGrid } from '@/features/overview/components/multi-store-grid';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function OverviewPage() {
  const { user } = useSession();
  const { storeId } = useStoreScope();
  const router = useRouter();
  // Defer greeting to client to avoid SSR/client time mismatch
  const [greet, setGreet] = useState('');
  useEffect(() => { setGreet(greeting()); }, []);

  const isOwner = user?.role === 'owner' || user?.role === 'admin';
  const isAllStores = isOwner && !storeId;
  // Use greeting state as a client-mount indicator to prevent SSR/client mismatch
  // (greet is '' on server, set after mount — so showMultiStore is only true after mount)
  const showMultiStore = !!greet && isAllStores;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header — one orange CTA */}
      <PageHeader
        eyebrow="COMMAND CENTRE"
        title={`${greet || 'Welcome'}, ${user?.name?.split(' ')[0] ?? 'there'}`}
        subtitle="Here's what needs your attention today."
        primaryAction={{
          label: 'Generate report',
          onClick: () => router.push('/reports'),
          icon: FileBarChart2,
        }}
      />

      {/* ── All stores rollup (owner with no specific store selected) ── */}
      {showMultiStore ? (
        <MultiStoreGrid />
      ) : (
        <>
          {/* Z1 — KPI bento */}
          <section aria-label="Store KPIs" className="flex flex-col gap-3 section-enter section-enter-1">
            <Eyebrow>At a glance</Eyebrow>
            <KpiBento storeId={storeId} />
          </section>

          {/* Z2 — OHS + Trends */}
          <section aria-label="Health and trends" className="flex flex-col gap-3 section-enter section-enter-2">
            <Eyebrow>Performance</Eyebrow>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OhsCard storeId={storeId} />
              <TrendCard storeId={storeId} />
            </div>
          </section>

          {/* Z3 — Alerts */}
          <section aria-label="Active alerts" className="flex flex-col gap-3 section-enter section-enter-3">
            <Eyebrow>Alerts</Eyebrow>
            <AlertsPanel storeId={storeId} />
          </section>

          {/* Z4 — Activity feed */}
          <section aria-label="Recent activity" className="flex flex-col gap-3 section-enter section-enter-4">
            <Eyebrow>Activity</Eyebrow>
            <ActivityFeed storeId={storeId} />
          </section>
        </>
      )}
    </div>
  );
}
