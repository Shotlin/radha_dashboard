'use client';
/**
 * app/(dash)/admin/webhooks/page.tsx
 * Webhooks CRUD + deliveries + replay. Admin role enforced in parent layout.tsx.
 */
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { FormField, Input } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { WebhooksPanel } from '@/features/admin/components/webhooks';

export default function WebhooksPage() {
  const [tenantId, setTenantId] = useState('');
  const [activeTenantId, setActiveTenantId] = useState('');

  function handleLoad() {
    setActiveTenantId(tenantId.trim());
  }

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
        title="Webhooks"
        subtitle="Manage webhook endpoints per tenant. Browse delivery history and replay failed events."
      />

      {/* Tenant selector */}
      <div className="card p-5 max-w-xl">
        <p className="text-[14px] font-semibold text-[var(--ink)] mb-3">Select Tenant</p>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <FormField label="Tenant ID" htmlFor="tenantId">
              <Input
                id="tenantId"
                mono
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
              />
            </FormField>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleLoad}
            disabled={!tenantId.trim()}
            className="flex-shrink-0 mb-0.5"
          >
            Load
          </Button>
        </div>
      </div>

      {/* Webhooks panel */}
      {activeTenantId ? (
        <WebhooksPanel tenantId={activeTenantId} />
      ) : (
        <div className="card p-8 text-center text-[var(--ink-soft)] text-[13px]">
          Enter a Tenant ID above to manage their webhook endpoints.
        </div>
      )}
    </div>
  );
}
