'use client';
/**
 * features/reports/components/report-builder.tsx
 * Form: dataset type select, date range, store scope, format (XLSX/PDF/CSV).
 * One orange "Generate report" CTA.
 */
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileBarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField, Input } from '@/components/ui/form-field';
import { Eyebrow } from '@/components/ui/eyebrow';
import {
  ReportBuilderSchema,
  type ReportBuilderInput,
  DATASET_TYPES,
} from '../reports.schema';

const FORMATS = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'pdf', label: 'PDF' },
  { value: 'csv', label: 'CSV' },
] as const;

interface ReportBuilderProps {
  storeId: string | null;
  onSubmit: (data: ReportBuilderInput) => void;
  isSubmitting: boolean;
}

export function ReportBuilder({ storeId, onSubmit, isSubmitting }: ReportBuilderProps) {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportBuilderInput>({
    resolver: zodResolver(ReportBuilderSchema),
    defaultValues: {
      type: '',
      from: thirtyDaysAgo,
      to: today,
      storeId: storeId ?? undefined,
      format: 'xlsx',
    },
  });

  return (
    <div className="card p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-accent-tint flex items-center justify-center">
          <FileBarChart2 className="h-4 w-4 text-accent" aria-hidden="true" />
        </div>
        <div>
          <Eyebrow>REPORT BUILDER</Eyebrow>
          <h2 className="text-[16px] font-bold text-ink">Generate a new report</h2>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        aria-label="Report builder form"
        noValidate
      >
        {/* Dataset type */}
        <FormField
          label="Dataset"
          htmlFor="report-type"
          required
          error={errors.type?.message}
          className="sm:col-span-2 lg:col-span-1"
        >
          <select
            id="report-type"
            {...register('type')}
            className="w-full px-3 py-2.5 rounded-lg text-[14px] text-ink bg-surface border border-hairline focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Select dataset…</option>
            {DATASET_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </FormField>

        {/* From date */}
        <FormField label="From" htmlFor="report-from" required error={errors.from?.message}>
          <Input
            id="report-from"
            type="date"
            mono
            {...register('from')}
          />
        </FormField>

        {/* To date */}
        <FormField label="To" htmlFor="report-to" required error={errors.to?.message}>
          <Input
            id="report-to"
            type="date"
            mono
            {...register('to')}
          />
        </FormField>

        {/* Format */}
        <FormField label="Format" htmlFor="report-format" required error={errors.format?.message}>
          <select
            id="report-format"
            {...register('format')}
            className="w-full px-3 py-2.5 rounded-lg text-[14px] text-ink bg-surface border border-hairline focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </FormField>

        {/* CTA — spans full width on mobile, right-aligned on large */}
        <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
            aria-label="Generate report"
          >
            <FileBarChart2 className="h-4 w-4" aria-hidden="true" />
            Generate report
          </Button>
        </div>
      </form>
    </div>
  );
}
