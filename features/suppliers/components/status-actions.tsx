'use client';
/**
 * features/suppliers/components/status-actions.tsx
 * Activate / deactivate supplier with confirmation.
 */
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActivateSupplier, useDeactivateSupplier } from '../suppliers.actions';

interface StatusActionsProps {
  supplierId: string;
  isActive: boolean;
}

export function StatusActions({ supplierId, isActive }: StatusActionsProps) {
  const activate = useActivateSupplier(supplierId);
  const deactivate = useDeactivateSupplier(supplierId);

  const handleActivate = () => {
    activate.mutate();
  };

  const handleDeactivate = () => {
    if (!window.confirm('Deactivate this supplier? You can reactivate them later.')) return;
    deactivate.mutate();
  };

  if (isActive) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={handleDeactivate}
        disabled={deactivate.isPending}
        className="text-danger hover:bg-[color:rgb(185_28_28_/_0.08)] border-[color:rgb(185_28_28_/_0.2)]"
      >
        <XCircle className="h-4 w-4" aria-hidden="true" />
        {deactivate.isPending ? 'Deactivating…' : 'Deactivate'}
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleActivate}
      disabled={activate.isPending}
      className="text-success hover:bg-[color:rgb(21_128_61_/_0.08)] border-[color:rgb(21_128_61_/_0.2)]"
    >
      <CheckCircle className="h-4 w-4" aria-hidden="true" />
      {activate.isPending ? 'Activating…' : 'Activate'}
    </Button>
  );
}
