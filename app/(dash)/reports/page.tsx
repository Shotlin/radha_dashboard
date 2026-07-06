'use client';
/**
 * app/(dash)/reports/page.tsx — Phase 12: Reports + exports.
 * Builder at top → active jobs → artefacts table.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Eyebrow } from '@/components/ui/eyebrow';
import { ReportBuilder } from '@/features/reports/components/report-builder';
import { ExportJobCard } from '@/features/reports/components/export-job-card';
import { ArtefactsTable } from '@/features/reports/components/artefacts-table';
import { useReportJobs } from '@/features/reports/reports.queries';
import { createReport, reExportReport } from '@/features/reports/reports.actions';
import type { ReportBuilderInput } from '@/features/reports/reports.schema';
import { useStoreScope } from '@/lib/hooks/use-store-scope';
import { qk } from '@/lib/api/query-keys';

export default function ReportsPage() {
  const { storeId } = useStoreScope();
  const qc = useQueryClient();

  // Active job IDs to show cards for (current session)
  const [activeJobIds, setActiveJobIds] = useState<string[]>([]);

  const { data: jobsData, isLoading, isError, refetch } = useReportJobs(storeId);

  /* ── Create report ─────────────────────────────────────────────────── */
  const createMutation = useMutation({
    mutationFn: (data: ReportBuilderInput) =>
      createReport({
        type: data.type,
        storeId: storeId ?? undefined,
        from: data.from,
        to: data.to,
        format: data.format,
      }),
    onSuccess: (job) => {
      setActiveJobIds((prev) => [...prev, job.id]);
      void qc.invalidateQueries({ queryKey: qk.reportJobs(storeId ?? '') });
    },
  });

  /* ── Re-export ─────────────────────────────────────────────────────── */
  const reExportMutation = useMutation({
    mutationFn: (reportId: string) => reExportReport(reportId),
    onSuccess: (job) => {
      setActiveJobIds((prev) => [...prev, job.id]);
      void qc.invalidateQueries({ queryKey: qk.reportJobs(storeId ?? '') });
    },
  });

  const handleDismissJob = (jobId: string) => {
    setActiveJobIds((prev) => prev.filter((id) => id !== jobId));
  };

  const allJobs = jobsData?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="INSIGHTS"
        title="Reports"
        subtitle="Build, generate, and download store reports."
      />

      {/* Report builder */}
      <ReportBuilder
        storeId={storeId}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />

      {/* Active job cards */}
      {activeJobIds.length > 0 && (
        <div className="flex flex-col gap-3">
          <Eyebrow>ACTIVE EXPORTS</Eyebrow>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeJobIds.map((id) => (
              <ExportJobCard
                key={id}
                jobId={id}
                onDismiss={() => handleDismissJob(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Artefacts table */}
      <ArtefactsTable
        jobs={allJobs}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        onReExport={(jobId) => reExportMutation.mutate(jobId)}
      />
    </div>
  );
}
