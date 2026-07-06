'use client';
/**
 * app/(dash)/inventory/page.tsx — Inventory page (Phase 09).
 * Shows KPIs, low-stock alerts, movements table, and stock-op side panel.
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Eyebrow } from '@/components/ui/eyebrow';
import { useStoreScope } from '@/lib/hooks/use-store-scope';
import { InventoryKpis } from '@/features/inventory/components/inventory-kpis';
import { MovementsTable } from '@/features/inventory/components/movements-table';
import { LowStockPanel } from '@/features/inventory/components/low-stock-panel';
import { StockOpPanel } from '@/features/inventory/components/stock-op-panel';

export default function InventoryPage() {
  const { storeId } = useStoreScope();
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="INVENTORY"
        title="Stock Management"
        subtitle="Track stock levels, movements, and low-stock alerts."
        primaryAction={{
          label: 'Stock Operation',
          icon: Plus,
          onClick: () => setPanelOpen(true),
        }}
      />

      {/* KPI Strip */}
      <InventoryKpis storeId={storeId} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: low-stock panel */}
        <div className="flex flex-col gap-3">
          <Eyebrow>LOW STOCK ALERTS</Eyebrow>
          <LowStockPanel storeId={storeId} />
        </div>

        {/* Right: movements table */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <Eyebrow>RECENT MOVEMENTS</Eyebrow>
          <MovementsTable storeId={storeId} />
        </div>
      </div>

      {/* Stock-op side panel */}
      <StockOpPanel
        storeId={storeId}
        open={panelOpen}
        onOpenChange={setPanelOpen}
      />
    </div>
  );
}
