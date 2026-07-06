/**
 * app/(dash)/notifications/broadcast/page.tsx — Phase 18 gated shell
 * Broadcast communications: segment picker + message composer for mass outreach.
 * Admin/owner only. Requires: POST /api/v1/notifications/broadcast (🆕 proposed)
 */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/page-header';
import { NeedsBackend } from '@/components/system/needs-backend';
import { Users, Bell, Send, Filter, Radio } from 'lucide-react';

export const metadata: Metadata = { title: 'Broadcast' };

/* ── Layout preview ──────────────────────────────────────────────────────── */
function BroadcastPreview() {
  const segments = [
    { id: 'all', label: 'All tenants', count: 52 },
    { id: 'trial', label: 'On trial', count: 14 },
    { id: 'pro', label: 'Pro plan', count: 23 },
    { id: 'past_due', label: 'Past due', count: 6 },
    { id: 'inactive', label: 'Inactive 30d', count: 9 },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: segment picker */}
        <div className="card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-[var(--accent-deep)]" />
            <h3 className="text-[14px] font-bold text-[var(--ink)]">Target segment</h3>
          </div>
          <div className="flex flex-col gap-2">
            {segments.map((seg) => (
              <label
                key={seg.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[var(--hairline)] cursor-pointer hover:border-[var(--accent)]"
              >
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-[var(--hairline)] bg-[var(--surface-raised)]" />
                  <span className="text-[13px] font-medium text-[var(--ink)]">{seg.label}</span>
                </div>
                <span className="font-mono text-[12px] text-[var(--ink-soft)]">{seg.count}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-[var(--ink-soft)]">
            <Users className="h-4 w-4" />
            <span>0 tenants selected</span>
          </div>
        </div>

        {/* Right: message composer */}
        <div className="card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[var(--accent-deep)]" />
            <h3 className="text-[14px] font-bold text-[var(--ink)]">Message</h3>
          </div>

          {/* Channel */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[var(--ink)]">Channel</label>
            <div className="flex items-center gap-2">
              {['In-app', 'Email', 'Push'].map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-[var(--hairline)] text-[12px] font-medium text-[var(--ink-soft)] hover:border-[var(--accent)]"
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[var(--ink)]">Title</label>
            <div className="px-3 py-2.5 rounded-lg border border-[var(--hairline)] bg-[var(--surface)]">
              <span className="text-[14px] text-[var(--ink-soft)]">Notification title…</span>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[var(--ink)]">Body</label>
            <div className="px-3 py-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] h-24">
              <span className="text-[14px] text-[var(--ink-soft)]">Write your message here…</span>
            </div>
          </div>

          <button type="button" className="flex items-center gap-1.5 self-start px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-[13px] font-semibold">
            <Send className="h-4 w-4" />
            Send broadcast
          </button>
        </div>
      </div>

      {/* Broadcast history */}
      <div className="card p-5 flex flex-col gap-3">
        <h3 className="text-[14px] font-bold text-[var(--ink)]">Broadcast history</h3>
        <div className="flex flex-col gap-2">
          {[
            { title: 'New expiry feature update', sent: '2 days ago', recipients: 52, channel: 'In-app' },
            { title: 'Scheduled maintenance', sent: '5 days ago', recipients: 52, channel: 'Email' },
          ].map((h) => (
            <div key={h.title} className="flex items-center justify-between py-2 border-b border-[var(--hairline)] last:border-0">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-[var(--accent)]" />
                <div>
                  <p className="text-[13px] font-medium text-[var(--ink)]">{h.title}</p>
                  <p className="text-[11px] text-[var(--ink-soft)]">{h.sent} · {h.channel} · {h.recipients} recipients</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function BroadcastPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const isAdmin = session.user.role === 'admin' || session.user.role === 'owner';
  if (!isAdmin) redirect('/');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="NOTIFICATIONS"
        title="Broadcast"
        subtitle="Send mass communications to tenant segments via in-app, email, or push."
      />

      <NeedsBackend
        route="POST /api/v1/notifications/broadcast"
        description="Platform broadcast endpoint to send notifications to segmented tenant groups. Supports in-app, email, and push channels with segment targeting (all, trial, pro, past_due, inactive)."
      >
        <BroadcastPreview />
      </NeedsBackend>
    </div>
  );
}
