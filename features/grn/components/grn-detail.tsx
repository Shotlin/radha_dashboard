'use client';
/**
 * features/grn/components/grn-detail.tsx
 * Header info card + workflow rail for a GRN detail page.
 */
import { useRouter } from 'next/navigation';
import { Truck, FileText, Calendar, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/states';
import { usePermission } from '@/lib/auth/use-session';
import { PERMISSIONS } from '@/lib/permissions';
import { GrnWorkflowRail } from './grn-workflow-rail';
import { useReceiveGrn } from '../grn.actions';
import type { Grn } from '../grn.queries';

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-md bg-surface-sunken flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-ink-soft" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[11px] text-ink-soft font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-[14px] font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

interface GrnDetailProps {
  grn: Grn;
  storeId: string;
  isLoading?: boolean;
}

export function GrnDetail({ grn, storeId, isLoading = false }: GrnDetailProps) {
  const router = useRouter();
  const canApprove = usePermission(PERMISSIONS.GRN_APPROVE);
  const receive = useReceiveGrn(grn.id, storeId);

  if (isLoading) {
    return (
      <div className="card p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const isDraft = grn.status === 'draft' || grn.status === 'partial';
  const isReceived = grn.status === 'received';
  const isCancelled = grn.status === 'cancelled';

  return (
    <div className="card p-6 flex flex-col gap-6">
      {/* Header grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <InfoRow
          icon={FileText}
          label="Invoice #"
          value={grn.invoiceNo ?? 'Not set'}
        />
        <InfoRow
          icon={Truck}
          label="Supplier"
          value={grn.supplierName ?? 'No supplier'}
        />
        <InfoRow
          icon={Calendar}
          label="Created"
          value={new Date(grn.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        />
        {grn.receivedAt && (
          <InfoRow
            icon={CheckCircle}
            label="Received"
            value={new Date(grn.receivedAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          />
        )}
      </div>

      {/* Workflow rail */}
      <GrnWorkflowRail status={grn.status} />

      {/* Receive action */}
      {isDraft && canApprove && !isCancelled && (
        <div className="flex items-center gap-3 pt-2 border-t border-hairline">
          <Button
            variant="primary"
            onClick={() => receive.mutate(undefined, { onSuccess: () => router.refresh() })}
            disabled={receive.isPending}
          >
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            {receive.isPending ? 'Receiving…' : 'Mark as Received'}
          </Button>
          {receive.isError && (
            <p className="text-[13px] text-danger" role="alert">
              {(receive.error as Error)?.message ?? 'Failed to receive GRN.'}
            </p>
          )}
        </div>
      )}

      {isReceived && (
        <p className="text-[13px] text-success font-semibold">
          ✓ GRN has been received and stock has been posted.
        </p>
      )}
    </div>
  );
}
