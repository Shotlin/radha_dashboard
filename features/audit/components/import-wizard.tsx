'use client';
/**
 * features/audit/components/import-wizard.tsx
 * Multi-step import wizard:
 *   Step 1: Select a list + file upload
 *   Step 2: Processing — poll job status with progress bar
 *   Step 3: Results — success/error count + error CSV download
 */
import { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, CheckCircle2, AlertCircle, Download, X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { qk } from '@/lib/api/query-keys';
import { cn } from '@/lib/utils';
import { useImportJob } from '../audit.queries';
import { importCsv, cancelImport } from '../audit.actions';
import type { EanList } from '../audit.schema';
import { useStoreScope } from '@/lib/hooks/use-store-scope';

type Step = 'upload' | 'processing' | 'results';

interface ImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lists: EanList[];
}

export function ImportWizard({ open, onOpenChange, lists }: ImportWizardProps) {
  const { storeId } = useStoreScope();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>('upload');
  const [selectedListId, setSelectedListId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Poll import job ──────────────────────────────────────────────────── */
  const { data: job } = useImportJob(step === 'processing' ? jobId : null);

  // Transition to results when job completes
  if (step === 'processing' && job && ['done', 'failed', 'cancelled'].includes(job.status)) {
    // Use a timeout to avoid state-during-render
    setTimeout(() => setStep('results'), 0);
  }

  /* ── Progress % ───────────────────────────────────────────────────────── */
  const progressPct = (() => {
    if (!job) return 5;
    if (job.status === 'done') return 100;
    if (job.status === 'failed') return 100;
    if (job.total && job.processed) {
      return Math.round((job.processed / job.total) * 100);
    }
    return 40; // indeterminate
  })();

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith('.csv') || dropped.name.endsWith('.xlsx'))) {
      setFile(dropped);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file || !selectedListId) return;
    setUploadError(null);
    setUploading(true);
    try {
      const text = await file.text();
      const result = await importCsv(selectedListId, text);
      setJobId(result.id);
      setStep('processing');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = async () => {
    if (jobId) {
      try { await cancelImport(jobId); } catch { /* ignore */ }
    }
    handleClose();
  };

  const handleClose = () => {
    setStep('upload');
    setSelectedListId('');
    setFile(null);
    setJobId(null);
    setUploadError(null);
    onOpenChange(false);
  };

  const handleDone = () => {
    void qc.invalidateQueries({ queryKey: qk.eanLists(storeId ?? '') });
    handleClose();
  };

  /* ── Step content ─────────────────────────────────────────────────────── */
  const stepLabels: Step[] = ['upload', 'processing', 'results'];
  const stepIndex = stepLabels.indexOf(step);

  return (
    <Modal
      open={open}
      onOpenChange={(o) => { if (!o) handleClose(); }}
      title="Import EAN List"
      className="max-w-lg"
      primaryAction={
        step === 'upload'
          ? { label: 'Upload', onClick: handleUpload, loading: uploading }
          : step === 'results'
          ? { label: 'Done', onClick: handleDone }
          : undefined
      }
      cancelLabel={step === 'processing' ? 'Cancel import' : 'Cancel'}
    >
      {/* ── Step indicator ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6" aria-label="Import steps">
        {(['upload', 'processing', 'results'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors',
                i < stepIndex
                  ? 'bg-success text-white'
                  : i === stepIndex
                  ? 'bg-accent text-white'
                  : 'bg-surface-sunken text-ink-soft border border-hairline',
              )}
              aria-current={i === stepIndex ? 'step' : undefined}
            >
              {i < stepIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-[12px] font-medium capitalize',
                i === stepIndex ? 'text-ink' : 'text-ink-soft',
              )}
            >
              {s === 'upload' ? 'Upload' : s === 'processing' ? 'Processing' : 'Results'}
            </span>
            {i < 2 && <div className="w-8 h-px bg-hairline mx-1" />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Upload ────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="flex flex-col gap-4">
          <FormField label="EAN list" htmlFor="wizard-list" required>
            <select
              id="wizard-list"
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-[14px] text-ink bg-surface border border-hairline focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select a list…</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </FormField>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            aria-label="Upload CSV or Excel file"
            className={cn(
              'relative flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
              dragOver
                ? 'border-accent bg-accent-tint/30'
                : 'border-hairline hover:border-accent/60 hover:bg-accent-tint/10',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="sr-only"
              onChange={handleFileChange}
              aria-hidden="true"
            />
            <Upload className="h-8 w-8 text-accent" aria-hidden="true" />
            {file ? (
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-ink">{file.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="p-0.5 text-ink-soft hover:text-danger"
                  aria-label="Remove selected file"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-[14px] font-semibold text-ink">
                  Drop your CSV or Excel file here
                </p>
                <p className="text-[13px] text-ink-soft">or click to browse</p>
              </>
            )}
          </div>

          {uploadError && (
            <p className="text-[13px] text-danger font-medium" role="alert">
              {uploadError}
            </p>
          )}

          <p className="text-[12px] text-ink-soft">
            Accepted formats: <span className="font-mono">.csv</span>,{' '}
            <span className="font-mono">.xlsx</span>. Max 5 MB.
          </p>
        </div>
      )}

      {/* ── Step 2: Processing ────────────────────────────────────── */}
      {step === 'processing' && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-soft font-medium">
                {job?.status === 'processing' ? 'Processing EAN items…' : 'Queued for processing…'}
              </span>
              <span className="font-mono tabular-nums text-accent">{progressPct}%</span>
            </div>

            {/* Progress bar */}
            <div
              className="h-2 rounded-full bg-surface-sunken overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Import progress"
            >
              <div
                className={cn(
                  'h-full rounded-full bg-accent transition-[width] duration-500',
                  progressPct < 100 && 'animate-pulse',
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {job?.total && job?.processed !== undefined && (
            <p className="text-[13px] text-ink-soft font-mono tabular-nums">
              {job.processed.toLocaleString()} / {job.total.toLocaleString()} rows
            </p>
          )}

          <Button variant="secondary" size="sm" onClick={handleCancel} className="self-start">
            Cancel import
          </Button>
        </div>
      )}

      {/* ── Step 3: Results ──────────────────────────────────────── */}
      {step === 'results' && (
        <div className="flex flex-col gap-4">
          {job?.status === 'done' ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-[color:rgb(21_128_61_/_0.08)] border border-[color:rgb(21_128_61_/_0.25)]">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="text-[14px] font-bold text-success">Import complete</p>
                <p className="text-[13px] text-ink-soft font-mono tabular-nums">
                  {(job.imported ?? 0).toLocaleString()} items imported
                  {(job.errors ?? 0) > 0 && ` · ${job.errors!.toLocaleString()} errors`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-[color:rgb(185_28_28_/_0.06)] border border-[color:rgb(185_28_28_/_0.25)]">
              <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="text-[14px] font-bold text-danger">
                  {job?.status === 'cancelled' ? 'Import cancelled' : 'Import failed'}
                </p>
              </div>
            </div>
          )}

          {/* Error rows summary */}
          {(job?.errors ?? 0) > 0 && job?.errorRows && job.errorRows.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-semibold text-ink">
                {job.errors} row{job.errors! > 1 ? 's' : ''} had errors:
              </p>
              <div className="rounded-lg border border-hairline overflow-auto max-h-40">
                <table className="w-full text-[12px]">
                  <thead className="bg-surface-raised sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-ink-soft">Row</th>
                      <th className="px-3 py-2 text-left font-semibold text-ink-soft">EAN</th>
                      <th className="px-3 py-2 text-left font-semibold text-ink-soft">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.errorRows.map((r, i) => (
                      <tr key={i} className="border-t border-hairline">
                        <td className="px-3 py-2 font-mono tabular-nums text-ink-soft">{r.row}</td>
                        <td className="px-3 py-2 font-mono tabular-nums text-ink">{r.ean ?? '—'}</td>
                        <td className="px-3 py-2 text-danger">{r.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {job.errorCsvUrl && (
                <a
                  href={job.errorCsvUrl}
                  download="import-errors.csv"
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-accent hover:underline self-start"
                  aria-label="Download error CSV"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download error CSV
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
