'use client';
/**
 * features/settings/components/tenant-info.tsx
 * Read-only tenant info card (name, plan, created date).
 */
import { Building2, CreditCard, Calendar } from 'lucide-react';
import { useTenantInfo } from '../settings.queries';

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[var(--hairline)] last:border-0">
      <dt className="flex items-center gap-2 text-[13px] text-[var(--ink-soft)]">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd
        className={
          mono
            ? 'font-mono text-[13px] text-[var(--ink)]'
            : 'text-[13px] font-medium text-[var(--ink)]'
        }
      >
        {value}
      </dd>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const planColors: Record<string, string> = {
    trial: 'bg-[var(--accent-tint)] text-[var(--accent-deep)]',
    starter: 'bg-[color:rgb(21_128_61_/_0.1)] text-[var(--success)]',
    pro: 'bg-[color:rgb(109_91_208_/_0.1)] text-[var(--cat-violet)]',
    enterprise: 'bg-[color:rgb(180_83_9_/_0.1)] text-[var(--cat-amber)]',
  };
  const key = plan.toLowerCase();
  const colorClass = planColors[key] ?? 'bg-[var(--surface-sunken)] text-[var(--ink-soft)]';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${colorClass}`}
    >
      <CreditCard className="h-3 w-3" aria-hidden="true" />
      {plan}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function TenantInfo() {
  const { data: tenant, isLoading, isError } = useTenantInfo();

  if (isLoading) {
    return (
      <div className="card p-6 flex flex-col gap-4" aria-busy="true">
        <div className="skeleton h-5 w-48" />
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-4 w-40" />
      </div>
    );
  }

  if (isError || !tenant) {
    return (
      <div className="card p-6">
        <p className="text-[13px] text-[var(--ink-soft)]">
          Tenant information is not available. The{' '}
          <code className="font-mono text-[12px]">/tenants/:id</code> endpoint may not be
          accessible with your current permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-[var(--accent-deep)]" aria-hidden="true" />
        <h2 className="text-[16px] font-bold text-[var(--ink)]">{tenant.name}</h2>
      </div>

      {tenant.plan && (
        <div>
          <PlanBadge plan={tenant.plan} />
        </div>
      )}

      <dl className="flex flex-col">
        <InfoRow icon={Building2} label="Organisation" value={tenant.name} />
        {tenant.ownerName && (
          <InfoRow icon={Building2} label="Owner" value={tenant.ownerName} />
        )}
        {tenant.plan && (
          <InfoRow icon={CreditCard} label="Plan" value={tenant.plan} />
        )}
        <InfoRow
          icon={Calendar}
          label="Member since"
          value={formatDate(tenant.createdAt)}
          mono
        />
        <InfoRow
          icon={Building2}
          label="Tenant ID"
          value={tenant.id}
          mono
        />
        <InfoRow
          icon={Building2}
          label="Status"
          value={tenant.isActive ? 'Active' : 'Inactive'}
        />
      </dl>
    </div>
  );
}
