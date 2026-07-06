'use client';
/**
 * features/suppliers/components/import-export.tsx
 * CSV import with error feedback, and export button.
 */
import { useRef, useState } from 'react';
import { Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImportSuppliers } from '../suppliers.actions';
import type { SuppliersListResult } from '../suppliers.queries';

interface ImportResult {
  imported: number;
  errors: number;
}

interface ImportExportProps {
  /** Called after a successful export trigger */
  onExport?: () => void;
  suppliers?: SuppliersListResult;
}

function buildCsv(items: SuppliersListResult['items']): string {
  const header = 'name,contactName,phone,email,address,isActive';
  const rows = items.map((s) =>
    [
      `"${s.name}"`,
      `"${s.contactName ?? ''}"`,
      `"${s.phone ?? ''}"`,
      `"${s.email ?? ''}"`,
      `"${s.address ?? ''}"`,
      s.isActive ? 'true' : 'false',
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

export function ImportExport({ onExport, suppliers }: ImportExportProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const importMutation = useImportSuppliers();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const csv = ev.target?.result as string;
      importMutation.mutate(csv, {
        onSuccess: (result) => {
          const res = result as ImportResult;
          setImportResult(res);
        },
      });
    };
    reader.readAsText(file);
    // Reset so same file can be re-uploaded
    e.target.value = '';
  };

  const handleExport = () => {
    if (!suppliers?.items.length) return;
    const csv = buildCsv(suppliers.items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suppliers.csv';
    a.click();
    URL.revokeObjectURL(url);
    onExport?.();
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Import */}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        aria-label="Import suppliers CSV"
        onChange={handleFileChange}
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={() => fileRef.current?.click()}
        disabled={importMutation.isPending}
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        {importMutation.isPending ? 'Importing…' : 'Import CSV'}
      </Button>

      {/* Export */}
      {suppliers?.items.length ? (
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </Button>
      ) : null}

      {/* Result feedback */}
      {importResult && (
        <div className="flex items-center gap-2 text-[13px]">
          {importResult.imported > 0 && (
            <span className="flex items-center gap-1 text-success">
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              {importResult.imported} imported
            </span>
          )}
          {importResult.errors > 0 && (
            <span className="flex items-center gap-1 text-danger">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              {importResult.errors} errors
            </span>
          )}
        </div>
      )}

      {importMutation.isError && (
        <span className="text-[13px] text-danger" role="alert">
          Import failed: {(importMutation.error as Error)?.message ?? 'Unknown error'}
        </span>
      )}
    </div>
  );
}
