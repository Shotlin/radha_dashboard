/**
 * app/(dash)/admin/flags/page.tsx
 * Feature Flags — read-only view. Admin role enforced in parent layout.tsx.
 */
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { FeatureFlagsList } from '@/features/admin/components/feature-flags';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Feature Flags — Admin Console — RADHA' };

export default function FeatureFlagsPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Back nav */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors w-fit"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Admin Console
      </Link>

      <PageHeader
        eyebrow="ADMIN CONSOLE"
        title="Feature Flags"
        subtitle="Read-only view of all feature flags. Management requires backend configuration."
      />

      <FeatureFlagsList />
    </div>
  );
}
