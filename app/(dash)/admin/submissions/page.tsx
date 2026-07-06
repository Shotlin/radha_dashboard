'use client';
/**
 * app/(dash)/admin/submissions/page.tsx
 * BE-56 v2 — community product submission moderation queue.
 * Admin role enforced in parent layout.tsx.
 */
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SubmissionsPanel } from '@/features/admin/components/submissions';

export default function SubmissionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors w-fit"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Admin Console
      </Link>

      <PageHeader
        eyebrow="ADMIN CONSOLE"
        title="Product Submissions"
        subtitle="Review products the community scanned that weren't in any product database yet. Approved entries become part of RADHA's own catalog for every user."
      />

      <SubmissionsPanel />
    </div>
  );
}
