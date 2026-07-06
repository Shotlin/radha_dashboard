/**
 * app/(dash)/admin/page.tsx — Admin Console overview
 * Server Component — role gate is enforced in app/(dash)/admin/layout.tsx.
 */
import Link from 'next/link';
import { UserCheck, Flag, Webhook, PackageSearch, ChevronRight, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin Console — RADHA' };

const SECTIONS = [
  {
    href: '/admin/impersonation',
    icon: UserCheck,
    title: 'Impersonation',
    description:
      'Start a time-boxed admin impersonation session for a user/tenant. View the full audit log of past sessions.',
    badge: 'Audited',
    badgeColor: 'text-[var(--warn)] bg-[color:rgb(180_83_9_/_0.10)] border-[color:rgb(180_83_9_/_0.25)]',
  },
  {
    href: '/admin/flags',
    icon: Flag,
    title: 'Feature Flags',
    description:
      'View the current enabled/disabled state of all feature flags. Management requires backend configuration.',
    badge: 'Read-only',
    badgeColor: 'text-[var(--teal)] bg-[color:rgb(15_118_110_/_0.08)] border-[color:rgb(15_118_110_/_0.25)]',
  },
  {
    href: '/admin/webhooks',
    icon: Webhook,
    title: 'Webhooks',
    description:
      'Manage webhook endpoints per tenant: add/remove/activate endpoints, browse delivery history, and replay failed deliveries.',
    badge: 'CRUD',
    badgeColor: 'text-[var(--accent)] bg-[var(--accent-tint)] border-[color:rgb(234_88_12_/_0.25)]',
  },
  {
    href: '/admin/submissions',
    icon: PackageSearch,
    title: 'Product Submissions',
    description:
      'Review community-scanned products missing from third-party databases. Approve to add them to RADHA\'s own catalog for every user.',
    badge: 'Moderation',
    badgeColor: 'text-[var(--success)] bg-[color:rgb(21_128_61_/_0.08)] border-[color:rgb(21_128_61_/_0.25)]',
  },
] as const;

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Admin Console"
        subtitle="Elevated tools for the RADHA platform team. All actions are audited."
      />

      {/* Security notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[color:rgb(185_28_28_/_0.05)] border border-[color:rgb(185_28_28_/_0.18)]">
        <ShieldAlert className="h-5 w-5 text-[var(--danger)] flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-[14px] font-semibold text-[var(--ink)]">Admin access — role verified</p>
          <p className="text-[13px] text-[var(--ink-soft)] mt-0.5">
            This section is server-side role-gated. Access is restricted to admin and owner roles.
            All impersonation and webhook changes are permanently logged.
          </p>
        </div>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="card group flex flex-col gap-3 p-5 hover:shadow-[var(--shadow-card-md)] transition-shadow duration-150 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-tint)] flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-[var(--accent-deep)]" aria-hidden="true" />
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${section.badgeColor}`}
                >
                  {section.badge}
                </span>
              </div>

              <div>
                <h3 className="text-[15px] font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                  {section.title}
                </h3>
                <p className="text-[13px] text-[var(--ink-soft)] mt-1 leading-relaxed">
                  {section.description}
                </p>
              </div>

              <div className="flex items-center gap-1 mt-auto text-[12px] font-semibold text-[var(--accent)]">
                Open
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
