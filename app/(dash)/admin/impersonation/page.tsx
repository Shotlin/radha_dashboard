'use client';
/**
 * app/(dash)/admin/impersonation/page.tsx
 * Impersonation start + audit log. Admin role enforced in parent layout.tsx.
 */
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Eyebrow } from '@/components/ui/eyebrow';
import { ImpersonationStart } from '@/features/admin/components/impersonation-start';
import { ImpersonationAuditTable } from '@/features/admin/components/impersonation-audit';

export default function ImpersonationPage() {
  const [auditKey, setAuditKey] = useState(0);

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
        title="Impersonation"
        subtitle="Start time-boxed impersonation sessions for support purposes. All sessions are audited."
      />

      {/* Start impersonation */}
      <div className="max-w-2xl">
        <ImpersonationStart onSuccess={() => setAuditKey((k) => k + 1)} />
      </div>

      {/* Audit log */}
      <div>
        <Eyebrow className="mb-3">AUDIT LOG</Eyebrow>
        <ImpersonationAuditTable key={auditKey} />
      </div>
    </div>
  );
}
