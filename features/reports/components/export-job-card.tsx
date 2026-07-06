'use client';
/**
 * features/reports/components/export-job-card.tsx
 * Shows job status, polls until done (3s throttled), then shows download button.
 * Uses a progress bar indicator — not a raw spinner.
 */
import { useEffect, useState } from 'react';
import { Download, CheckCircle2, AlertCircle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { cn } from '@/lib/utils';
import { useReportJob } from '../reports.queries';
import type { ReportJob } from '../reports.schema';

interface ExportJobCardProps {
  jobId: string;
  onDismiss: () => void;
}

function useElapsed(startedAt: string, active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = new Date(startedAt).getTime();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt, active]);
  return elapsed;
}

export function ExportJobCard({ jobId, onDismiss }: ExportJobCardProps) {
  const { data: job } = useReportJob(jobId);

  const isActive = !job || !['done', 'failed'].includes(job.status ?? '');
  const elapsed = useElapsed(job?.createdAt ?? new Date().toISOString(), isActive);

  /* ── Progress % heuristic ────────────────────────────────────────── */
  const progressPct = (() => {
    if (!job) return 8;
    if (job.status === 'done') return 100;
    if (job.status === 'failed') return 100;
    // Based on elapsed: queued 10%, processing smoothly 10→90
    if (job.status === 'queued') return 10;
    // Simulate progress asymptotically toward 90
    return Math.min(90, 10 + elapsed * 4);
  })();

  const statusConfig: Record<
    ReportJob['status'],
    { label: string; icon: React.ElementType; iconCls: string; barCls: string }
  > = {
    queued: {
      label: 'Queued…',
      icon: Clock,
      iconCls: 'text-ink-soft',
      barCls: 'bg-accent/60',
    },
    processing: {
      label: 'Processing…',
      icon: Clock,
      iconCls: 'text-accent',
      barCls: 'bg-accent',
    },
    done: {
      label: 'Ready to download',
      icon: CheckCircle2,
      iconCls: 'text-success',
      barCls: 'bg-success',
    },
    failed: {
      label: 'Export failed',
      icon: AlertCircle,
      iconCls: 'text-danger',
      barCls: 'bg-danger',
    },
  };

  const cfg = job ? statusConfig[job.status] : statusConfig.queued;
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        'card p-4 flex flex-col gap-3 border',
        job?.status === 'done' && 'border-[color:rgb(21_128_61_/_0.3)]',
        job?.status === 'failed' && 'border-[color:rgb(185_28_28_/_0.3)]',
      )}
      aria-live="polite"
      aria-label={`Export job: ${cfg.label}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4 flex-shrink-0', cfg.iconCls)} aria-hidden="true" />
          <div>
            <Eyebrow>{job?.type?.replace(/_/g, ' ').toUpperCase() ?? 'REPORT'}</Eyebrow>
            <p className="text-[14px] font-semibold text-ink">{cfg.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="font-mono tabular-nums text-[12px] text-ink-soft">
              {elapsed}s
            </span>
          )}
          {(job?.status === 'done' || job?.status === 'failed') && (
            <button
              onClick={onDismiss}
              aria-label="Dismiss export job"
              className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-sunken transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 rounded-full bg-surface-sunken overflow-hidden"
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500',
            cfg.barCls,
            isActive && progressPct < 100 && 'animate-pulse',
          )}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Download button when ready */}
      {job?.status === 'done' && job.downloadUrl && (
        <a
          href={job.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start"
          download
        >
          <Button variant="secondary" size="sm" aria-label="Download report">
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </Button>
        </a>
      )}

      {/* Metadata */}
      {job?.completedAt && (
        <p className="text-[12px] text-ink-soft font-mono tabular-nums">
          Completed {new Date(job.completedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
