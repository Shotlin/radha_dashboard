'use client';
/**
 * features/admin/components/submissions.tsx
 * BE-56 v2 — community product submission moderation queue.
 * List (DataTable) + a detail dialog with image preview, editable
 * nutrition, and Approve/Reject actions.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ImageOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/states';
import { FormField, Input } from '@/components/ui/form-field';
import {
  useSubmissionsQueue,
  useSubmissionDetail,
} from '../admin.queries';
import { useApproveSubmissionMutation, useRejectSubmissionMutation } from '../admin.actions';
import type { NutritionValues, Submission } from '../admin.schema';

const NUTRITION_FIELDS: { key: keyof NutritionValues; label: string; unit: string }[] = [
  { key: 'servingSize', label: 'Serving size', unit: '' },
  { key: 'servingUnit', label: 'Serving unit', unit: '(g / ml)' },
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbohydrates', label: 'Carbohydrates', unit: 'g' },
  { key: 'sugars', label: 'Sugars', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'saturatedFat', label: 'Saturated fat', unit: 'g' },
  { key: 'transFat', label: 'Trans fat', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
];

/* ── Reject reason dialog ─────────────────────────────────────────────────── */
function RejectReasonDialog({
  submissionId,
  open,
  onOpenChange,
  onRejected,
}: {
  submissionId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRejected: () => void;
}) {
  const [reason, setReason] = useState('');
  const mutation = useRejectSubmissionMutation();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Reject Submission"
      description="Explain why — the submitter sees this reason on their submission history."
      destructive
      primaryAction={{
        label: 'Reject submission',
        onClick: () => {
          if (!reason.trim()) return;
          mutation.mutate(
            { id: submissionId, reason: reason.trim() },
            {
              onSuccess: () => {
                setReason('');
                onOpenChange(false);
                onRejected();
              },
            },
          );
        },
        loading: mutation.isPending,
      }}
    >
      <FormField label="Reason" htmlFor="reject-reason" required>
        <textarea
          id="reject-reason"
          className="input min-h-24 resize-none"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Photo doesn't match the EAN, nutrition values look implausible…"
        />
      </FormField>
      {mutation.isError && (
        <p className="mt-2 text-[13px] text-[var(--danger)]" role="alert">
          Failed to reject — please try again.
        </p>
      )}
    </Modal>
  );
}

/* ── Detail dialog ────────────────────────────────────────────────────────── */
function SubmissionDetailDialog({
  submission,
  open,
  onOpenChange,
}: {
  submission: Submission;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: detail, isLoading } = useSubmissionDetail(open ? submission.id : null);
  const approveMutation = useApproveSubmissionMutation();
  const [rejectOpen, setRejectOpen] = useState(false);

  const { register, handleSubmit } = useForm<{
    name: string;
    category: string;
    nutrition: NutritionValues;
  }>({
    values: {
      name: submission.name ?? '',
      category: submission.category ?? '',
      nutrition: submission.nutrition ?? {},
    },
  });

  function onApprove(values: { name: string; category: string; nutrition: NutritionValues }) {
    const nutrition = Object.fromEntries(
      Object.entries(values.nutrition).filter(([, v]) => v !== undefined && v !== ('' as never)),
    ) as NutritionValues;
    approveMutation.mutate(
      {
        id: submission.id,
        data: {
          name: values.name.trim() || undefined,
          category: values.category.trim() || undefined,
          nutrition: Object.keys(nutrition).length > 0 ? nutrition : undefined,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <>
      <Modal
        open={open && !rejectOpen}
        onOpenChange={onOpenChange}
        title={`Review: ${submission.name ?? submission.ean}`}
        description={`EAN ${submission.ean} — submitted ${new Date(submission.submittedAt).toLocaleString('en-IN')}`}
        className="max-w-2xl"
        primaryAction={{
          label: 'Approve & publish',
          onClick: () => void handleSubmit(onApprove)(),
          loading: approveMutation.isPending,
        }}
      >
        <div className="flex flex-col gap-4">
          {/* Images */}
          <div>
            <p className="text-[13px] font-semibold text-[var(--ink)] mb-2">Photos</p>
            {isLoading ? (
              <p className="text-[13px] text-[var(--ink-soft)]">Loading…</p>
            ) : detail && detail.imageUrls.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {detail.imageUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt="Submitted product label"
                    className="w-28 h-28 object-cover rounded-lg border border-[var(--hairline)]"
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[13px] text-[var(--ink-soft)]">
                <ImageOff className="h-4 w-4" aria-hidden="true" />
                No photo attached
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Product name" htmlFor="sub-name">
              <Input id="sub-name" {...register('name')} />
            </FormField>
            <FormField label="Category" htmlFor="sub-category">
              <Input id="sub-category" {...register('category')} />
            </FormField>
          </div>

          {submission.brand && (
            <p className="text-[13px] text-[var(--ink-soft)]">Brand: {submission.brand}</p>
          )}

          {/* Nutrition */}
          <div>
            <p className="text-[13px] font-semibold text-[var(--ink)] mb-2">
              Nutrition panel (edit before publishing if the scanner misread anything)
            </p>
            <div className="grid grid-cols-3 gap-3">
              {NUTRITION_FIELDS.map((f) => (
                <FormField key={f.key} label={`${f.label} ${f.unit}`} htmlFor={`nut-${f.key}`}>
                  <Input
                    id={`nut-${f.key}`}
                    mono
                    {...register(`nutrition.${f.key}` as const)}
                  />
                </FormField>
              ))}
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="self-start text-[var(--danger)]"
            onClick={() => setRejectOpen(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Reject instead
          </Button>

          {approveMutation.isError && (
            <p className="text-[13px] text-[var(--danger)]" role="alert">
              Failed to approve — please try again.
            </p>
          )}
        </div>
      </Modal>

      <RejectReasonDialog
        submissionId={submission.id}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onRejected={() => onOpenChange(false)}
      />
    </>
  );
}

/* ── Main queue panel ─────────────────────────────────────────────────────── */
export function SubmissionsPanel() {
  const [status, setStatus] = useState<'pending' | 'flagged'>('pending');
  const [reviewing, setReviewing] = useState<Submission | null>(null);
  const { data, isLoading, isError } = useSubmissionsQueue(status);
  const submissions = data?.data ?? [];

  const columns: ColumnDef<Submission>[] = [
    { key: 'ean', header: 'EAN', mono: true },
    {
      key: 'name',
      header: 'Name / Brand',
      render: (r) => (
        <div>
          <p className="text-[13px] text-[var(--ink)]">{r.name ?? '—'}</p>
          {r.brand && <p className="text-[11px] text-[var(--ink-soft)]">{r.brand}</p>}
        </div>
      ),
    },
    {
      key: 'nutrition',
      header: 'Nutrition',
      render: (r) => (
        <span className="text-[12px] text-[var(--ink-soft)]">
          {r.nutrition ? 'Detected' : 'None'}
        </span>
      ),
    },
    {
      key: 'photos',
      header: 'Photos',
      render: (r) => (
        <span className="text-[12px] text-[var(--ink-soft)]">{r.s3ObjectKeys.length}</span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      mono: true,
      render: (r) => new Date(r.submittedAt).toLocaleDateString('en-IN'),
    },
    {
      key: 'review',
      header: '',
      render: (r) => (
        <Button variant="ghost" size="sm" onClick={() => setReviewing(r)}>
          Review
        </Button>
      ),
    },
  ];

  if (isError) {
    return (
      <EmptyState
        title="Could not load submissions"
        description="The moderation queue is unavailable. Please try again."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {(['pending', 'flagged'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
              status === s
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--surface-sunken)] text-[var(--ink)] border-[var(--hairline)]'
            }`}
          >
            {s === 'pending' ? 'Pending' : 'Flagged (re-review)'}
          </button>
        ))}
        <span className="text-[13px] text-[var(--ink-soft)] ml-2">
          {data?.total ?? 0} in queue
        </span>
      </div>

      {isLoading ? (
        <div className="card p-4 text-center text-[var(--ink-soft)] text-[13px]">
          Loading submissions…
        </div>
      ) : submissions.length === 0 ? (
        <EmptyState
          title="Queue is empty"
          description="No community product submissions waiting for review right now."
        />
      ) : (
        <DataTable
          columns={columns}
          data={submissions}
          rowKey={(r) => r.id}
          state="default"
        />
      )}

      {reviewing && (
        <SubmissionDetailDialog
          submission={reviewing}
          open={reviewing !== null}
          onOpenChange={(v) => !v && setReviewing(null)}
        />
      )}
    </div>
  );
}
