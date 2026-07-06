'use client';

/**
 * /styleguide — Dev-only design-system reference.
 * Renders every Phase 02 component × all states.
 * NOT linked in the production nav (no data leakage).
 */

import { useState } from 'react';
import {
  Package, ClipboardList, Truck, ShieldCheck, ScanLine, Clock,
  Plus, AlertTriangle,
} from 'lucide-react';

import { Eyebrow } from '@/components/ui/eyebrow';
import { MonoNumber } from '@/components/ui/mono-number';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { StatusChip } from '@/components/ui/status-chip';
import { KpiTile } from '@/components/ui/kpi-tile';
import { PageHeader } from '@/components/ui/page-header';
import { FilterBar } from '@/components/ui/filter-bar';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { ChartCard, LineTrend, BarCompare, Donut } from '@/components/ui/chart-card';
import { OhsGauge } from '@/components/ui/ohs-gauge';
import { SidePanel } from '@/components/ui/side-panel';
import { Modal } from '@/components/ui/modal';
import { FormField, Input } from '@/components/ui/form-field';
import { EmptyState, ErrorState, Skeleton, CardSkeleton } from '@/components/ui/states';
import { LockedOverlay } from '@/components/ui/locked-overlay';
import { ActivityItem } from '@/components/ui/activity-item';
import { CommandPalette } from '@/components/ui/command-palette';
import { ToasterProvider, useToast, OfflineBanner } from '@/components/ui/toast';

/* ── Section wrapper ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <Eyebrow className="mb-3">{title}</Eyebrow>
      <div className="flex flex-wrap gap-4 items-start">{children}</div>
    </section>
  );
}

/* ── Trend data fixtures ── */
const lineData = [
  { day: 'Mon', scans: 120 }, { day: 'Tue', scans: 95 }, { day: 'Wed', scans: 140 },
  { day: 'Thu', scans: 88 }, { day: 'Fri', scans: 162 }, { day: 'Sat', scans: 110 },
];
const barData = [
  { cat: 'Dairy', in: 40, out: 20 }, { cat: 'Snacks', in: 60, out: 35 },
  { cat: 'Beverages', in: 30, out: 28 }, { cat: 'Staples', in: 80, out: 50 },
];
const donutData = [
  { name: 'Biscuits', value: 35 }, { name: 'Dairy', value: 25 },
  { name: 'Beverages', value: 20 }, { name: 'Staples', value: 20 },
];

/* ── Table fixtures ── */
interface Row { id: string; ean: string; name: string; qty: number; status: string }
const tableRows: Row[] = [
  { id: '1', ean: '8901030864450', name: 'Amul Butter 100g', qty: 24, status: 'matched' },
  { id: '2', ean: '8906002490012', name: 'Parle-G Biscuits', qty: 12, status: 'expiring' },
  { id: '3', ean: '8901063023468', name: 'Tata Salt 1kg', qty: 48, status: 'matched' },
  { id: '4', ean: '8901719110047', name: 'Maggi Noodles', qty: 0, status: 'expired' },
];
const tableCols: ColumnDef<Row>[] = [
  { key: 'ean', header: 'EAN', mono: true, sortable: true },
  { key: 'name', header: 'Product', sortable: true },
  { key: 'qty', header: 'Qty', mono: true, sortable: true },
  { key: 'status', header: 'Status', render: (r) => <StatusChip variant={r.status as 'matched' | 'expiring' | 'expired'} /> },
];

/* ── Inner page (needs toast context) ── */
function StyleguideInner() {
  const { addToast } = useToast();
  const [panelOpen, setPanelOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [activeSegment, setActiveSegment] = useState('all');

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <OfflineBanner />

      <PageHeader
        eyebrow="Phase 02 · Design System"
        title="Component Styleguide"
        subtitle="Every Phase 02 component rendered in all states."
        primaryAction={{ label: 'Open ⌘K', icon: Plus, onClick: () => setCmdOpen(true) }}
      />

      <div className="mt-10 space-y-0">

        {/* ── Primitives ── */}
        <Section title="Primitives — Eyebrow, Chip, Button">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex gap-3 flex-wrap items-center">
              <Eyebrow>Section Label</Eyebrow>
              <Eyebrow variant="accent">Accent Eyebrow</Eyebrow>
            </div>
            <div className="flex gap-3 flex-wrap items-center">
              <Chip>Default</Chip>
              <Chip variant="success">Matched</Chip>
              <Chip variant="warn">Expiring</Chip>
              <Chip variant="danger">Expired</Chip>
              <Chip variant="accent">Accent</Chip>
            </div>
            <div className="flex gap-3 flex-wrap items-center">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" loading>Loading…</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </div>
        </Section>

        {/* ── Mono Number ── */}
        <Section title="MonoNumber — count-up, tabular">
          <MonoNumber value={124560} format={(n) => `₹${n.toLocaleString('en-IN')}`} className="text-3xl font-bold text-accent" />
          <MonoNumber value={98} className="text-3xl font-bold text-success" />
          <MonoNumber value={0} className="text-3xl font-bold text-ink-soft" />
        </Section>

        {/* ── Status Chips ── */}
        <Section title="Status Chips (4.5)">
          <StatusChip variant="matched" />
          <StatusChip variant="expired" />
          <StatusChip variant="expiring" />
          <StatusChip variant="pending" />
          <StatusChip variant="info" />
          <StatusChip variant="neutral" label="Custom label" />
        </Section>

        {/* ── KPI Tiles ── */}
        <Section title="KPI Tiles (4.1) — default · loading · error">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <KpiTile label="Scans today" value={324} trend={12} icon={ScanLine} tint="text-accent" tintBg="bg-accent-tint" href="/audit" actionLabel="View audit" />
            <KpiTile label="Expiring (7d)" value={18} trend={-5} icon={Clock} tint="text-warn" tintBg="bg-[color:rgb(180_83_9_/_0.1)]" />
            <KpiTile label="Pending tasks" value={7} icon={ClipboardList} tint="text-[#6d5bd0]" tintBg="bg-[color:rgb(109_91_208_/_0.1)]" />
            <KpiTile label="GRN pending" value={3} icon={Truck} tint="text-success" tintBg="bg-[color:rgb(21_128_61_/_0.1)]" />
          </div>
          <div className="grid grid-cols-2 gap-4 w-full mt-0">
            <KpiTile label="Loading state" value={0} state="loading" />
            <KpiTile label="Error state" value={0} state="error" />
          </div>
        </Section>

        {/* ── Filter Bar ── */}
        <Section title="Filter Bar (4.4) — sliding segment indicator">
          <div className="w-full">
            <FilterBar
              segments={[
                { value: 'all', label: 'All' },
                { value: 'near', label: 'Near expiry' },
                { value: 'expired', label: 'Expired' },
              ]}
              activeSegment={activeSegment}
              onSegmentChange={setActiveSegment}
              onSearchChange={() => {}}
              searchPlaceholder="Search products…"
            />
          </div>
        </Section>

        {/* ── Data Table ── */}
        <Section title="Data Table (4.2) — sortable, mono EAN, status chip">
          <div className="w-full">
            <DataTable
              columns={tableCols}
              data={tableRows}
              rowKey={(r) => r.id}
              onExport={() => addToast({ message: 'CSV export started', variant: 'success' })}
            />
          </div>
        </Section>

        {/* ── Data Table states ── */}
        <Section title="Data Table — loading · empty · error">
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DataTable columns={tableCols} data={[]} rowKey={(r) => r.id} state="loading" />
            <DataTable columns={tableCols} data={[]} rowKey={(r) => r.id} state="empty" emptyMessage="No products found." />
            <DataTable columns={tableCols} data={[]} rowKey={(r) => r.id} state="error" />
          </div>
        </Section>

        {/* ── Charts ── */}
        <Section title="Charts (4.3) — Line · Bar · Donut">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <ChartCard eyebrow="Scans" title="Daily scan trend">
              <LineTrend data={lineData} xKey="day" yKey="scans" aria-label="Daily scans line chart" />
            </ChartCard>
            <ChartCard eyebrow="Inventory" title="Stock in / out">
              <BarCompare data={barData} xKey="cat" bars={[{ key: 'in', label: 'In' }, { key: 'out', label: 'Out', color: '#b45309' }]} aria-label="Inventory movements bar chart" />
            </ChartCard>
            <ChartCard eyebrow="Categories" title="Stock mix">
              <Donut data={donutData} aria-label="Category stock mix donut chart" />
            </ChartCard>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-0">
            <ChartCard title="Loading chart" state="loading" />
            <ChartCard title="Error chart" state="error" onRetry={() => {}} />
          </div>
        </Section>

        {/* ── OHS Gauge ── */}
        <Section title="OHS Gauge (4.6)">
          <OhsGauge
            score={74}
            components={[
              { label: 'Compliance', value: 82 },
              { label: 'Expiry mgmt', value: 68 },
              { label: 'Inv accuracy', value: 91 },
              { label: 'Task completion', value: 76 },
              { label: 'Team activity', value: 55 },
              { label: 'Vendor quality', value: 72 },
            ]}
          />
          <OhsGauge score={undefined} />
        </Section>

        {/* ── Empty / Error / Skeleton ── */}
        <Section title="States (4.11) — Empty · Error · Skeleton">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <EmptyState
              title="No expiry records"
              description="Add your first expiry record to start tracking."
              action={{ label: 'Add record', onClick: () => {} }}
              icon={Package}
            />
            <ErrorState onRetry={() => {}} />
            <div className="card p-4 flex flex-col gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full mt-0">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </Section>

        {/* ── Locked Overlay ── */}
        <Section title="Locked Overlay (4.12)">
          <div className="w-72">
            <LockedOverlay
              title="Reports"
              description="Upgrade to Pro to generate reports."
              onUpgrade={() => addToast({ message: 'Redirecting to billing…', variant: 'info' })}
            >
              <div className="card p-4">
                <p className="text-ink font-bold">Revenue report</p>
                <p className="text-3xl font-mono text-accent mt-2">₹4,24,000</p>
              </div>
            </LockedOverlay>
          </div>
        </Section>

        {/* ── Activity Feed ── */}
        <Section title="Activity Feed (4.14)">
          <div className="card p-4 w-full max-w-md flex flex-col divide-y divide-hairline">
            <ActivityItem actor="Ramesh Patel" action="added expiry record for" target="Amul Butter 100g" timestamp="09:42 AM" />
            <ActivityItem actor="Sonal Mehta" action="completed task" target="Aisle 3 audit" timestamp="08:15 AM" icon={ShieldCheck} tintClass="text-success" />
            <ActivityItem actor="Admin" action="posted GRN" target="GRN #1042" timestamp="07:30 AM" icon={Truck} tintClass="text-success" />
          </div>
        </Section>

        {/* ── Form Field ── */}
        <Section title="Form Field (4.9) — label · error · hint · required">
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <FormField label="Product name" htmlFor="name-ok" required>
              <Input id="name-ok" placeholder="e.g. Amul Butter 100g" />
            </FormField>
            <FormField label="EAN code" htmlFor="ean" hint="Scan or type the 13-digit barcode" required>
              <Input id="ean" placeholder="8901030864450" mono />
            </FormField>
            <FormField label="Batch number" htmlFor="batch" error="Batch number is required">
              <Input id="batch" placeholder="BATCH-001" aria-invalid="true" />
            </FormField>
          </div>
        </Section>

        {/* ── Sheets / Modals / Toasts ── */}
        <Section title="Side Panel (4.7) · Modal (4.8) · Toast (4.13)">
          <Button variant="secondary" onClick={() => setPanelOpen(true)}>Open Side Panel</Button>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button variant="danger" onClick={() => setModalOpen(true)}>Destructive Modal</Button>
          <Button variant="primary" onClick={() => addToast({ message: 'GRN #1042 posted successfully', variant: 'success', actionLabel: 'View', onAction: () => {} })}>
            Success Toast
          </Button>
          <Button variant="ghost" onClick={() => addToast({ message: 'Expiry alert resolved', variant: 'info' })}>
            Info Toast
          </Button>
          <Button variant="ghost" onClick={() => addToast({ message: 'Export failed — try again', variant: 'error' })}>
            Error Toast
          </Button>
          <Button variant="ghost" onClick={() => addToast({ message: '3 items expiring this week', variant: 'warn' })}>
            Warn Toast
          </Button>
        </Section>

        {/* ── Command Palette ── */}
        <Section title="Command Palette (4.15)">
          <Button variant="secondary" onClick={() => setCmdOpen(true)}>
            Open ⌘K palette
          </Button>
        </Section>

        {/* ── Contrast / focus sanity ── */}
        <Section title="Accessibility sanity — contrast · focus ring">
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <p className="text-[13px] text-ink-soft">Tab through these buttons to verify orange focus ring (2px):</p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="primary" size="sm">Primary</Button>
              <Button variant="secondary" size="sm">Secondary</Button>
              <Button variant="ghost" size="sm">Ghost</Button>
            </div>
            <StatusChip variant="matched" />
            <StatusChip variant="expiring" />
          </div>
        </Section>

      </div>

      {/* Panels / Modals */}
      <SidePanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        title="GRN #1042 Details"
        description="Supplier: Amul · 14 Jun 2026"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setPanelOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm">Post GRN</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Invoice number" htmlFor="inv">
            <Input id="inv" placeholder="INV-2026-042" mono />
          </FormField>
          <FormField label="Total amount" htmlFor="amt">
            <Input id="amt" placeholder="₹12,400" mono />
          </FormField>
        </div>
      </SidePanel>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Delete product"
        description="This will permanently remove Amul Butter 100g from your catalog. This action cannot be undone."
        destructive
        primaryAction={{
          label: 'Delete product',
          onClick: () => {
            setModalOpen(false);
            addToast({ message: 'Product deleted', variant: 'success' });
          },
        }}
      />

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        items={[
          { id: 'overview', label: 'Overview', description: 'Command centre', icon: ShieldCheck, onSelect: () => {}, group: 'Navigate' },
          { id: 'expiry', label: 'Expiry', description: 'Track expiry records', icon: Clock, onSelect: () => {}, group: 'Navigate' },
          { id: 'tasks', label: 'Tasks', description: 'Team tasks', icon: ClipboardList, onSelect: () => {}, group: 'Navigate' },
          { id: 'new-task', label: 'New task', icon: Plus, onSelect: () => {}, group: 'Actions' },
          { id: 'new-grn', label: 'New GRN', icon: Truck, onSelect: () => {}, group: 'Actions' },
          { id: 'export', label: 'Export report', icon: AlertTriangle, onSelect: () => addToast({ message: 'Export queued', variant: 'info' }), group: 'Actions' },
        ]}
      />
    </div>
  );
}

export default function StyleguidePage() {
  return (
    <ToasterProvider>
      <StyleguideInner />
    </ToasterProvider>
  );
}
