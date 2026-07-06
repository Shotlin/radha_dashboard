/**
 * app/(dash)/reports/schedule/page.tsx — Phase 18 gated shell
 * Scheduled reports: configure recurring report generation and delivery.
 * Requires: POST /api/v1/reports/schedule (🆕 proposed)
 */
import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { NeedsBackend } from '@/components/system/needs-backend';
import { Calendar, Clock, Mail, FileText, Plus, Repeat } from 'lucide-react';

export const metadata: Metadata = { title: 'Scheduled Reports' };

/* ── Layout preview ──────────────────────────────────────────────────────── */
function ScheduledReportsPreview() {
  const mockSchedules = [
    {
      name: 'Weekly Expiry Summary',
      type: 'Expiry',
      frequency: 'Every Monday 8:00 AM',
      recipients: ['owner@example.com'],
      format: 'PDF',
      status: 'Active',
    },
    {
      name: 'Monthly Stock Report',
      type: 'Inventory',
      frequency: 'First day of month',
      recipients: ['manager@example.com', 'owner@example.com'],
      format: 'Excel',
      status: 'Active',
    },
    {
      name: 'Daily Task Digest',
      type: 'Tasks',
      frequency: 'Daily 9:00 PM',
      recipients: ['manager@example.com'],
      format: 'PDF',
      status: 'Paused',
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* New schedule button */}
      <div className="flex justify-end">
        <button type="button" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-[13px] font-semibold">
          <Plus className="h-4 w-4" />
          New scheduled report
        </button>
      </div>

      {/* Schedule form (create new) */}
      <div className="card p-5 flex flex-col gap-4">
        <h3 className="text-[14px] font-bold text-[var(--ink)]">New schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Report type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[var(--ink)]">Report type</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--hairline)] bg-[var(--surface)]">
              <FileText className="h-4 w-4 text-[var(--ink-soft)]" />
              <span className="text-[14px] text-[var(--ink-soft)]">Expiry Report</span>
            </div>
          </div>
          {/* Format */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[var(--ink)]">Format</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--hairline)] bg-[var(--surface)]">
              <span className="text-[14px] text-[var(--ink-soft)]">PDF</span>
            </div>
          </div>
          {/* Frequency */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[var(--ink)]">Frequency</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--hairline)] bg-[var(--surface)]">
              <Repeat className="h-4 w-4 text-[var(--ink-soft)]" />
              <span className="text-[14px] text-[var(--ink-soft)]">Weekly</span>
            </div>
          </div>
          {/* Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[var(--ink)]">Time</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--hairline)] bg-[var(--surface)]">
              <Clock className="h-4 w-4 text-[var(--ink-soft)]" />
              <span className="text-[14px] font-mono text-[var(--ink-soft)]">08:00 AM</span>
            </div>
          </div>
        </div>
        {/* Recipients */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[var(--ink)]">Recipients</label>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--hairline)] bg-[var(--surface)]">
            <Mail className="h-4 w-4 text-[var(--ink-soft)]" />
            <span className="text-[14px] text-[var(--ink-soft)]">Add email addresses…</span>
          </div>
        </div>
        <button type="button" className="self-start px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-[13px] font-semibold">
          Create schedule
        </button>
      </div>

      {/* Existing schedules */}
      <div className="flex flex-col gap-2">
        <h3 className="text-[14px] font-bold text-[var(--ink)]">Active schedules ({mockSchedules.length})</h3>
        {mockSchedules.map((s) => (
          <div key={s.name} className="card p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[var(--accent-tint)] flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[var(--accent-deep)]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[var(--ink)]">{s.name}</p>
                <p className="text-[12px] text-[var(--ink-soft)]">{s.frequency} · {s.format} · {s.recipients.length} recipient{s.recipients.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <span className={`text-[12px] font-medium ${s.status === 'Active' ? 'text-[var(--success)]' : 'text-[var(--ink-soft)]'}`}>
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScheduledReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="REPORTS"
        title="Scheduled Reports"
        subtitle="Configure recurring report generation and automatic email delivery."
      />

      <NeedsBackend
        route="POST /api/v1/reports/schedule"
        description="Schedule recurring report generation and delivery via email. Supports expiry, inventory, task, and GRN reports in PDF or Excel format on a configurable cadence."
      >
        <ScheduledReportsPreview />
      </NeedsBackend>
    </div>
  );
}
