'use client';
/**
 * leads-client.tsx — Client logic for the Leads page.
 * Table view with status filter + search + detail panel.
 */
import { useState } from 'react';
import { FilterBar } from '@/components/ui/filter-bar';
import { LeadsTable } from '@/features/analytics/components/leads-table';
import { LeadDetailPanel } from '@/features/analytics/components/lead-detail-panel';
import { useLeads } from '@/features/analytics/analytics.queries';
import { LEAD_STATUSES, type Lead, type LeadStatus } from '@/features/analytics/analytics.schema';

const STATUS_SEGMENTS = [
  { value: 'all', label: 'All' },
  ...LEAD_STATUSES.map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  })),
];

export function LeadsClient() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();

  const leadsQuery = useLeads({
    status: statusFilter === 'all' ? undefined : (statusFilter as LeadStatus),
    search: search || undefined,
    limit: 20,
    cursor,
  });

  const leads = leadsQuery.data?.items ?? [];

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setPanelOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <FilterBar
        segments={STATUS_SEGMENTS}
        activeSegment={statusFilter}
        onSegmentChange={setStatusFilter}
        searchPlaceholder="Search leads…"
        onSearchChange={setSearch}
      />

      {/* Table */}
      <LeadsTable
        leads={leads}
        isLoading={leadsQuery.isLoading}
        isError={leadsQuery.isError}
        onRowClick={handleRowClick}
        hasNextPage={Boolean(leadsQuery.data?.nextCursor)}
        onNextPage={() => {
          if (leadsQuery.data?.nextCursor) {
            setCursor(leadsQuery.data.nextCursor);
          }
        }}
        hasPrevPage={Boolean(cursor)}
        onPrevPage={() => setCursor(undefined)}
      />

      {/* Detail panel */}
      <LeadDetailPanel
        leadId={selectedLead?.id ?? null}
        open={panelOpen}
        onOpenChange={(open) => {
          setPanelOpen(open);
          if (!open) setSelectedLead(null);
        }}
      />
    </div>
  );
}
