/**
 * app/(dash)/billing/invoices/page.tsx — Phase 18 gated shell
 * Invoice history table with download links and status.
 * Requires: GET /api/v1/billing/invoices (🆕 proposed)
 */
import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { NeedsBackend } from '@/components/system/needs-backend';
import { Receipt, Download, Search, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const metadata: Metadata = { title: 'Invoices' };

/* ── Layout preview ──────────────────────────────────────────────────────── */
function InvoicesPreview() {
  const mockInvoices = [
    { id: 'INV-2024-006', period: 'Jun 2024', plan: 'Pro', amount: '₹199', status: 'Paid', date: '01 Jun 2024' },
    { id: 'INV-2024-005', period: 'May 2024', plan: 'Pro', amount: '₹199', status: 'Paid', date: '01 May 2024' },
    { id: 'INV-2024-004', period: 'Apr 2024', plan: 'Pro', amount: '₹199', status: 'Paid', date: '01 Apr 2024' },
    { id: 'INV-2024-003', period: 'Mar 2024', plan: 'Starter', amount: '₹99', status: 'Paid', date: '01 Mar 2024' },
    { id: 'INV-2024-002', period: 'Feb 2024', plan: 'Starter', amount: '₹99', status: 'Paid', date: '01 Feb 2024' },
    { id: 'INV-2024-001', period: 'Jan 2024', plan: 'Trial', amount: '₹0', status: 'Paid', date: '01 Jan 2024' },
  ];

  const statusIcon = {
    Paid: <CheckCircle className="h-3.5 w-3.5 text-[var(--success)]" />,
    Pending: <Clock className="h-3.5 w-3.5 text-[var(--warn)]" />,
    Overdue: <AlertCircle className="h-3.5 w-3.5 text-[var(--danger)]" />,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total billed (YTD)', value: '₹794', icon: Receipt },
          { label: 'Invoices this year', value: '6', icon: Calendar },
          { label: 'Outstanding', value: '₹0', icon: CheckCircle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[var(--ink-soft)]">
              <Icon className="h-4 w-4" />
              <span className="text-[12px]">{label}</span>
            </div>
            <p className="text-[20px] font-bold font-mono text-[var(--ink)]">{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface-raised)] max-w-sm">
        <Search className="h-4 w-4 text-[var(--ink-soft)]" />
        <span className="text-[13px] text-[var(--ink-soft)]">Search invoices…</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--hairline)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-[var(--surface-sunken)]">
            <tr>
              {['Invoice', 'Period', 'Plan', 'Amount', 'Status', 'Date', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-[var(--ink-soft)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockInvoices.map((inv) => (
              <tr key={inv.id} className="border-t border-[var(--hairline)]">
                <td className="px-4 py-3 font-mono text-[12px] text-[var(--accent-deep)]">
                  {inv.id}
                </td>
                <td className="px-4 py-3 text-[var(--ink-soft)]">{inv.period}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-tint)] text-[var(--accent-deep)]">
                    {inv.plan}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-medium text-[var(--ink)]">{inv.amount}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1">
                    {statusIcon[inv.status as keyof typeof statusIcon]}
                    <span
                      className={
                        inv.status === 'Paid'
                          ? 'text-[var(--success)] font-medium'
                          : inv.status === 'Pending'
                          ? 'text-[var(--warn)] font-medium'
                          : 'text-[var(--danger)] font-medium'
                      }
                    >
                      {inv.status}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-[var(--ink-soft)]">{inv.date}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[var(--ink-soft)] hover:text-[var(--accent)]"
                    aria-label={`Download ${inv.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="BILLING"
        title="Invoice History"
        subtitle="View and download all past invoices for your subscription."
      />

      <NeedsBackend
        route="GET /api/v1/billing/invoices"
        description="Billing invoices endpoint returning paginated invoice history with plan, amount, status, and presigned download URLs for each PDF. Also see: GET /api/v1/billing/transactions."
      >
        <InvoicesPreview />
      </NeedsBackend>
    </div>
  );
}
