'use client';
/**
 * features/admin/components/webhooks.tsx
 * Endpoints table (CRUD) + deliveries table + replay button (with confirm).
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, RotateCcw, ChevronDown, ChevronRight, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/states';
import { FormField, Input } from '@/components/ui/form-field';
import { useWebhooks, useWebhookDeliveries } from '../admin.queries';
import {
  useCreateWebhookMutation,
  useUpdateWebhookMutation,
  useDeleteWebhookMutation,
  useReplayDeliveryMutation,
} from '../admin.actions';
import {
  CreateWebhookSchema,
  type CreateWebhookPayload,
  type Webhook,
  type WebhookDelivery,
  WebhookEventOptions,
} from '../admin.schema';
import { cn } from '@/lib/utils';

/* ── Create webhook dialog ───────────────────────────────────────────────── */
function CreateWebhookDialog({
  tenantId,
  open,
  onOpenChange,
}: {
  tenantId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const mutation = useCreateWebhookMutation(tenantId);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateWebhookPayload>({
    resolver: zodResolver(CreateWebhookSchema),
    defaultValues: { tenantId, events: [] },
  });

  const selectedEvents = watch('events') ?? [];

  function toggleEvent(event: string) {
    const current = selectedEvents;
    const next = current.includes(event)
      ? current.filter((e) => e !== event)
      : [...current, event];
    setValue('events', next, { shouldValidate: true });
  }

  function onSubmit(data: CreateWebhookPayload) {
    mutation.mutate(data, {
      onSuccess: () => {
        reset({ tenantId, events: [] });
        onOpenChange(false);
      },
    });
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Webhook Endpoint"
      primaryAction={{
        label: 'Create webhook',
        onClick: () => void handleSubmit(onSubmit)(),
        loading: mutation.isPending,
      }}
      className="max-w-lg"
    >
      <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <FormField label="Endpoint URL" htmlFor="url" required error={errors.url?.message}>
          <Input id="url" type="url" placeholder="https://your-server.com/webhook" mono {...register('url')} />
        </FormField>

        <div>
          <p className="text-[13px] font-semibold text-[var(--ink)] mb-2">
            Events <span className="text-[var(--danger)]">*</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {WebhookEventOptions.map((event) => (
              <button
                key={event}
                type="button"
                onClick={() => toggleEvent(event)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[12px] font-medium border transition-colors',
                  selectedEvents.includes(event)
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-[var(--surface-sunken)] text-[var(--ink)] border-[var(--hairline)] hover:border-[var(--accent)]',
                )}
              >
                {event}
              </button>
            ))}
          </div>
          {errors.events && (
            <p className="mt-1 text-[12px] text-[var(--danger)]">{errors.events.message}</p>
          )}
        </div>

        {mutation.isError && (
          <p className="text-[13px] text-[var(--danger)]" role="alert">
            Failed to create webhook. Please check the URL and try again.
          </p>
        )}
      </form>
    </Modal>
  );
}

/* ── Deliveries sub-table ────────────────────────────────────────────────── */
function DeliveriesTable({ webhookId, replayMutation }: { webhookId: string; replayMutation: ReturnType<typeof useReplayDeliveryMutation> }) {
  const { data, isLoading } = useWebhookDeliveries(webhookId);
  const [replayTarget, setReplayTarget] = useState<string | null>(null);
  const deliveries = data?.items ?? [];

  const columns: ColumnDef<WebhookDelivery>[] = [
    { key: 'event', header: 'Event', render: (r) => <span className="font-mono text-[12px]">{r.event}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-[11px] font-semibold',
            r.status >= 200 && r.status < 300
              ? 'bg-[color:rgb(21_128_61_/_0.1)] text-[var(--success)]'
              : 'bg-[color:rgb(185_28_28_/_0.1)] text-[var(--danger)]',
          )}
        >
          {r.status}
        </span>
      ),
    },
    { key: 'attempt', header: 'Attempt', mono: true },
    {
      key: 'deliveredAt',
      header: 'Delivered At',
      mono: true,
      render: (r) =>
        r.deliveredAt
          ? new Date(r.deliveredAt).toLocaleString('en-IN')
          : <span className="text-[var(--ink-soft)]">Pending</span>,
    },
    {
      key: 'replay',
      header: '',
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[12px]"
          onClick={() => setReplayTarget(r.id)}
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Replay
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={deliveries}
        rowKey={(r) => r.id}
        state={isLoading ? 'loading' : deliveries.length === 0 ? 'empty' : 'default'}
        emptyMessage="No deliveries yet for this webhook."
        className="mt-2"
      />

      {/* Replay confirm */}
      <Modal
        open={replayTarget !== null}
        onOpenChange={(v) => !v && setReplayTarget(null)}
        title="Replay Delivery"
        description="This will re-send the event to the webhook endpoint. The previous delivery is not modified."
        primaryAction={{
          label: 'Confirm replay',
          onClick: () => {
            if (!replayTarget) return;
            replayMutation.mutate(
              { deliveryId: replayTarget },
              { onSuccess: () => setReplayTarget(null) },
            );
          },
          loading: replayMutation.isPending,
        }}
      />
    </>
  );
}

/* ── Webhook row with expandable deliveries ──────────────────────────────── */
function WebhookRow({
  webhook,
  tenantId,
}: {
  webhook: Webhook;
  tenantId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMutation = useDeleteWebhookMutation(tenantId);
  const updateMutation = useUpdateWebhookMutation(tenantId);
  const replayMutation = useReplayDeliveryMutation(webhook.id);

  function handleToggleActive() {
    updateMutation.mutate({ id: webhook.id, data: { isActive: !webhook.isActive } });
  }

  return (
    <>
      <div className="border-b border-[var(--hairline)] last:border-b-0">
        {/* Row header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex-shrink-0 text-[var(--ink-soft)] hover:text-[var(--ink)]"
            aria-label={expanded ? 'Collapse deliveries' : 'Expand deliveries'}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-mono text-[13px] text-[var(--ink)] truncate">{webhook.url}</p>
            <p className="text-[11px] text-[var(--ink-soft)] mt-0.5">
              {webhook.events.join(', ')}
            </p>
          </div>

          {/* Active toggle */}
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={updateMutation.isPending}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border transition-colors',
              webhook.isActive
                ? 'bg-[color:rgb(21_128_61_/_0.08)] border-[color:rgb(21_128_61_/_0.35)] text-[var(--success)]'
                : 'bg-[var(--surface-sunken)] border-[var(--hairline)] text-[var(--ink-soft)]',
            )}
            aria-label={webhook.isActive ? 'Deactivate webhook' : 'Activate webhook'}
          >
            <Power className="h-2.5 w-2.5" aria-hidden="true" />
            {webhook.isActive ? 'Active' : 'Inactive'}
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[var(--danger)] hover:bg-[color:rgb(185_28_28_/_0.06)]"
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete webhook"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Deliveries */}
        {expanded && (
          <div className="px-8 pb-4">
            <DeliveriesTable webhookId={webhook.id} replayMutation={replayMutation} />
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Webhook"
        description={`Are you sure you want to delete the webhook endpoint "${webhook.url}"? This action cannot be undone.`}
        destructive
        primaryAction={{
          label: 'Delete webhook',
          onClick: () =>
            deleteMutation.mutate(webhook.id, { onSuccess: () => setDeleteOpen(false) }),
          loading: deleteMutation.isPending,
        }}
      />
    </>
  );
}

/* ── Main webhooks panel ─────────────────────────────────────────────────── */
interface WebhooksPanelProps {
  tenantId: string;
}

export function WebhooksPanel({ tenantId }: WebhooksPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isError } = useWebhooks(tenantId);
  const webhooks = data?.items ?? [];

  if (isError) {
    return (
      <EmptyState
        title="Could not load webhooks"
        description="Webhooks are unavailable. Please try again."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--ink-soft)]">
          {webhooks.length} endpoint{webhooks.length !== 1 ? 's' : ''} configured
        </p>
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add endpoint
        </Button>
      </div>

      {isLoading ? (
        <div className="card p-4 text-center text-[var(--ink-soft)] text-[13px]">
          Loading webhooks…
        </div>
      ) : webhooks.length === 0 ? (
        <EmptyState
          title="No webhook endpoints"
          description="Add an endpoint to start receiving event notifications."
          action={{ label: 'Add endpoint', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="card overflow-hidden">
          {webhooks.map((wh) => (
            <WebhookRow key={wh.id} webhook={wh} tenantId={tenantId} />
          ))}
        </div>
      )}

      <CreateWebhookDialog tenantId={tenantId} open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
