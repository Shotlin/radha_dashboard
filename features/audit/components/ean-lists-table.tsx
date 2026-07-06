'use client';
/**
 * features/audit/components/ean-lists-table.tsx
 * DataTable for EAN lists: active toggle (confirm on deactivate), item count,
 * create / edit / delete. Exposes onSelectList for drilling into items.
 */
import { useState, forwardRef, useImperativeHandle } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { ToggleLeft, ToggleRight, Trash2, Pencil, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { FormField, Input } from '@/components/ui/form-field';
import { StatusChip } from '@/components/ui/status-chip';
import { ErrorState } from '@/components/ui/states';
import { qk } from '@/lib/api/query-keys';
import { cn } from '@/lib/utils';
import { useEanLists } from '../audit.queries';
import {
  activateList,
  deactivateList,
  deleteList,
  createList,
  updateList,
} from '../audit.actions';
import { CreateEanListSchema, type CreateEanListInput, type EanList } from '../audit.schema';
import { useStoreScope } from '@/lib/hooks/use-store-scope';

export interface EanListsTableRef {
  openCreate: () => void;
}

interface EanListsTableProps {
  onSelectList: (list: EanList) => void;
}

export const EanListsTable = forwardRef<EanListsTableRef, EanListsTableProps>(
  function EanListsTable({ onSelectList }, ref) {
    const { storeId } = useStoreScope();
    const qc = useQueryClient();

    const { data, isLoading, isError, refetch } = useEanLists(storeId);

    // Modals state
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<EanList | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EanList | null>(null);
    const [deactivateTarget, setDeactivateTarget] = useState<EanList | null>(null);

    useImperativeHandle(ref, () => ({
      openCreate: () => setCreateOpen(true),
    }));

    /* ── Create / Edit form ─────────────────────────────────────────────── */
    const {
      register,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<CreateEanListInput>({
      resolver: zodResolver(CreateEanListSchema),
    });

    const createMutation = useMutation({
      mutationFn: ({ name }: CreateEanListInput) => createList(storeId ?? '', name),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: qk.eanLists(storeId ?? '') });
        setCreateOpen(false);
        reset();
      },
    });

    const editMutation = useMutation({
      mutationFn: ({ name }: CreateEanListInput) =>
        updateList(editTarget?.id ?? '', name),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: qk.eanLists(storeId ?? '') });
        setEditTarget(null);
        reset();
      },
    });

    const deleteMutation = useMutation({
      mutationFn: () => deleteList(deleteTarget?.id ?? ''),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: qk.eanLists(storeId ?? '') });
        setDeleteTarget(null);
      },
    });

    const activateMutation = useMutation({
      mutationFn: (id: string) => activateList(id),
      onSuccess: () => void qc.invalidateQueries({ queryKey: qk.eanLists(storeId ?? '') }),
    });

    const deactivateMutation = useMutation({
      mutationFn: () => deactivateList(deactivateTarget?.id ?? ''),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: qk.eanLists(storeId ?? '') });
        setDeactivateTarget(null);
      },
    });

    const handleToggle = (list: EanList) => {
      if (list.isActive) {
        setDeactivateTarget(list);
      } else {
        activateMutation.mutate(list.id);
      }
    };

    /* ── columns ─────────────────────────────────────────────────────────── */
    const columns: ColumnDef<EanList>[] = [
      {
        key: 'name',
        header: 'List Name',
        sortable: true,
        render: (row) => (
          <span className="font-semibold text-ink">{row.name}</span>
        ),
      },
      {
        key: 'isActive',
        header: 'Status',
        render: (row) => (
          <StatusChip
            variant={row.isActive ? 'matched' : 'neutral'}
            label={row.isActive ? 'Active' : 'Inactive'}
          />
        ),
      },
      {
        key: 'itemCount',
        header: 'Items',
        mono: true,
        render: (row) => (
          <span className="font-mono tabular-nums text-ink">
            {row.itemCount.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        mono: true,
        render: (row) => (
          <span className="font-mono tabular-nums text-ink-soft text-[13px]">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'text-right',
        render: (row) => (
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => onSelectList(row)}
              aria-label={`View items in ${row.name}`}
              className="p-1.5 rounded-lg text-ink-soft hover:text-accent hover:bg-accent-tint transition-colors"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              onClick={() => handleToggle(row)}
              aria-label={row.isActive ? `Deactivate ${row.name}` : `Activate ${row.name}`}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                row.isActive
                  ? 'text-success hover:text-warn hover:bg-[color:rgb(180_83_9_/_0.08)]'
                  : 'text-ink-soft hover:text-success hover:bg-[color:rgb(21_128_61_/_0.08)]',
              )}
            >
              {row.isActive ? (
                <ToggleRight className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ToggleLeft className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <button
              onClick={() => { setEditTarget(row); reset({ name: row.name }); }}
              aria-label={`Edit ${row.name}`}
              className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-sunken transition-colors"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              onClick={() => setDeleteTarget(row)}
              aria-label={`Delete ${row.name}`}
              className="p-1.5 rounded-lg text-ink-soft hover:text-danger hover:bg-[color:rgb(185_28_28_/_0.08)] transition-colors"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ),
      },
    ];

    const tableState =
      isLoading ? 'loading'
      : isError ? 'error'
      : (data?.items.length ?? 0) === 0 ? 'empty'
      : 'default';

    return (
      <>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          rowKey={(r) => r.id}
          state={tableState}
          emptyMessage="No approved EAN lists yet — import your first list to get started."
        />

        {isError && (
          <ErrorState
            title="Failed to load EAN lists"
            onRetry={() => void refetch()}
            className="mt-4"
          />
        )}

        {/* ── Create list modal ──────────────────────────────────────── */}
        <Modal
          open={createOpen}
          onOpenChange={(o) => { setCreateOpen(o); if (!o) reset(); }}
          title="Create EAN List"
          description="Enter a name for the new approved EAN list."
          primaryAction={{
            label: 'Create',
            onClick: handleSubmit((v) => createMutation.mutate(v)),
            loading: createMutation.isPending,
          }}
        >
          <FormField label="List name" htmlFor="create-name" required error={errors.name?.message}>
            <Input
              id="create-name"
              placeholder="e.g. Aisle 3 Approved Items"
              {...register('name')}
            />
          </FormField>
        </Modal>

        {/* ── Edit list modal ────────────────────────────────────────── */}
        <Modal
          open={!!editTarget}
          onOpenChange={(o) => { if (!o) { setEditTarget(null); reset(); } }}
          title="Rename EAN List"
          primaryAction={{
            label: 'Save',
            onClick: handleSubmit((v) => editMutation.mutate(v)),
            loading: editMutation.isPending,
          }}
        >
          <FormField label="List name" htmlFor="edit-name" required error={errors.name?.message}>
            <Input id="edit-name" {...register('name')} />
          </FormField>
        </Modal>

        {/* ── Delete confirm modal ──────────────────────────────────── */}
        <Modal
          open={!!deleteTarget}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
          title={`Delete "${deleteTarget?.name}"?`}
          description="This will permanently remove the list and all its EAN items. This action cannot be undone."
          destructive
          primaryAction={{
            label: 'Delete list',
            onClick: () => deleteMutation.mutate(),
            loading: deleteMutation.isPending,
          }}
        />

        {/* ── Deactivate confirm modal ──────────────────────────────── */}
        <Modal
          open={!!deactivateTarget}
          onOpenChange={(o) => { if (!o) setDeactivateTarget(null); }}
          title={`Deactivate "${deactivateTarget?.name}"?`}
          description="Scan audits will no longer use this list for matching. You can re-activate it at any time."
          primaryAction={{
            label: 'Deactivate',
            onClick: () => deactivateMutation.mutate(),
            loading: deactivateMutation.isPending,
          }}
        />
      </>
    );
  },
);
