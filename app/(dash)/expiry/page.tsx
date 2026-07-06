'use client';
/**
 * app/(dash)/expiry/page.tsx — Full Expiry module page.
 * FilterBar (status, date range) → KPI row → calendar + table grid.
 * One orange "Add expiry record" CTA.
 */
import React, { useState } from 'react';
import { Plus, Settings2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { FilterBar } from '@/components/ui/filter-bar';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { useStoreScope } from '@/lib/hooks/use-store-scope';
import { usePermission } from '@/lib/auth/use-session';
import { ExpiryKpis } from '@/features/expiry/components/expiry-kpis';
import { ExpiryCalendar } from '@/features/expiry/components/expiry-calendar';
import { ExpiryTable } from '@/features/expiry/components/expiry-table';
import { AddRecordPanel } from '@/features/expiry/components/add-record-panel';
import { ThresholdsEditor } from '@/features/expiry/components/thresholds-editor';
import type { ExpiryFilters } from '@/features/expiry/expiry.schema';
import type { ExpiryStatus } from '@/features/expiry/expiry.schema';

const STATUS_SEGMENTS = [
  { value: 'all', label: 'All' },
  { value: 'fresh', label: 'Fresh' },
  { value: 'expiring_soon', label: 'Expiring soon' },
  { value: 'expired', label: 'Expired' },
];

export default function ExpiryPage() {
  const { storeId } = useStoreScope();
  const canEditThresholds = usePermission('expiry:edit');
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const [addOpen, setAddOpen] = useState(false);
  const [thresholdsOpen, setThresholdsOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState('all');
  const [selectedDay, setSelectedDay] = useState<string | undefined>(undefined);

  // Build filters for the table
  const filters: ExpiryFilters = {
    status: activeStatus !== 'all' ? (activeStatus as ExpiryStatus) : undefined,
    from: selectedDay ?? undefined,
    to: selectedDay ?? undefined,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page header — one orange CTA only */}
      <PageHeader
        eyebrow="INVENTORY"
        title="Expiry"
        subtitle="Monitor and manage product expiry dates across your store."
        primaryAction={{
          label: 'Add expiry record',
          onClick: () => setAddOpen(true),
          icon: Plus,
        }}
        secondaryActions={
          mounted && canEditThresholds
            ? [
                {
                  label: 'Thresholds',
                  onClick: () => setThresholdsOpen(true),
                  icon: Settings2,
                },
              ]
            : undefined
        }
      />

      {/* KPI tiles */}
      <section aria-label="Expiry KPIs">
        <Eyebrow className="mb-3">At a glance</Eyebrow>
        <ExpiryKpis storeId={storeId} />
      </section>

      {/* Filter bar */}
      <FilterBar
        segments={STATUS_SEGMENTS}
        activeSegment={activeStatus}
        onSegmentChange={(v) => {
          setActiveStatus(v);
          setSelectedDay(undefined); // reset day filter on status change
        }}
        searchPlaceholder="Search by EAN or product…"
      >
        {/* Date filter indicator */}
        {selectedDay && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-accent-tint text-accent-deep border border-accent/20">
            {selectedDay}
            <button
              onClick={() => setSelectedDay(undefined)}
              className="ml-1 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
              aria-label="Clear day filter"
            >
              ×
            </button>
          </span>
        )}
      </FilterBar>

      {/* Main grid: calendar + table */}
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Calendar heat grid */}
        <section aria-label="Expiry calendar">
          <Eyebrow className="mb-3">Calendar</Eyebrow>
          <ExpiryCalendar
            storeId={storeId}
            onDaySelect={(date) => setSelectedDay((prev) => (prev === date ? undefined : date))}
          />
        </section>

        {/* Records table */}
        <section aria-label="Expiry records">
          <Eyebrow className="mb-3">
            {selectedDay ? `Records for ${selectedDay}` : 'All records'}
          </Eyebrow>
          <ExpiryTable storeId={storeId} filters={filters} />
        </section>
      </div>

      {/* Side panels */}
      <AddRecordPanel
        open={addOpen}
        onOpenChange={setAddOpen}
        storeId={storeId}
      />
      <ThresholdsEditor
        open={thresholdsOpen}
        onOpenChange={setThresholdsOpen}
        storeId={storeId}
      />
    </div>
  );
}
