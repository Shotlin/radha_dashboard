'use client';
/**
 * app/(dash)/audit/page.tsx — Audit / EAN + scan sessions + product scanner.
 * Tabs: Scan Product | EAN Lists | Scan Sessions.
 */
import { useState, useRef } from 'react';
import { Upload, ListChecks, ScanLine, ScanBarcode } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { MatchRateKpi } from '@/features/audit/components/match-rate-kpi';
import { EanListsTable, type EanListsTableRef } from '@/features/audit/components/ean-lists-table';
import { EanItemsTable } from '@/features/audit/components/ean-items-table';
import { ImportWizard } from '@/features/audit/components/import-wizard';
import { ScanSessions } from '@/features/audit/components/scan-sessions';
import { ScanResultView } from '@/features/audit/components/scan-result-view';
import { useEanLists } from '@/features/audit/audit.queries';
import { useStoreScope } from '@/lib/hooks/use-store-scope';
import type { EanList } from '@/features/audit/audit.schema';
import { cn } from '@/lib/utils';

type Tab = 'scan' | 'lists' | 'sessions';

export default function AuditPage() {
  const { storeId } = useStoreScope();
  const [activeTab, setActiveTab] = useState<Tab>('scan');
  const [selectedList, setSelectedList] = useState<EanList | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const tableRef = useRef<EanListsTableRef>(null);

  const { data: listsData } = useEanLists(storeId);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'scan',     label: 'Scan Product',  icon: ScanBarcode },
    { key: 'lists',    label: 'EAN Lists',      icon: ListChecks  },
    { key: 'sessions', label: 'Scan Sessions',  icon: ScanLine    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="COMPLIANCE"
        title="Audit / EAN"
        subtitle="Scan product barcodes, manage approved EAN lists and review sessions."
        primaryAction={{
          label: 'Import list',
          icon: Upload,
          onClick: () => setImportOpen(true),
        }}
        secondaryActions={[
          {
            label: 'New list',
            onClick: () => tableRef.current?.openCreate(),
          },
        ]}
      />

      {/* KPI row */}
      <MatchRateKpi />

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-hairline" role="tablist">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => { setActiveTab(key); if (key !== 'lists') setSelectedList(null); }}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold border-b-2 -mb-px transition-colors',
              activeTab === key
                ? 'border-accent text-accent'
                : 'border-transparent text-ink-soft hover:text-ink hover:border-hairline',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div role="tabpanel" aria-label={
        activeTab === 'scan' ? 'Scan Product' :
        activeTab === 'lists' ? 'EAN Lists' : 'Scan Sessions'
      }>
        {activeTab === 'scan' && (
          <ScanResultView />
        )}

        {activeTab === 'lists' && (
          <>
            {selectedList ? (
              <EanItemsTable
                list={selectedList}
                onBack={() => setSelectedList(null)}
              />
            ) : (
              <EanListsTable
                ref={tableRef}
                onSelectList={(list) => setSelectedList(list)}
              />
            )}
          </>
        )}

        {activeTab === 'sessions' && <ScanSessions />}
      </div>

      {/* Import wizard */}
      <ImportWizard
        open={importOpen}
        onOpenChange={setImportOpen}
        lists={listsData?.items ?? []}
      />
    </div>
  );
}
