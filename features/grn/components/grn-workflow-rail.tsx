'use client';
/**
 * features/grn/components/grn-workflow-rail.tsx
 * Stepper timeline showing GRN workflow: draft → validated → received → cancelled.
 */
import { FileText, CheckCircle, PackageCheck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GrnStatus } from '../grn.queries';

interface Step {
  key: string;
  label: string;
  icon: React.ElementType;
  activeStatuses: GrnStatus[];
  completedStatuses: GrnStatus[];
}

const STEPS: Step[] = [
  {
    key: 'draft',
    label: 'Draft',
    icon: FileText,
    activeStatuses: ['draft'],
    completedStatuses: ['received', 'partial'],
  },
  {
    key: 'validated',
    label: 'Items Added',
    icon: CheckCircle,
    activeStatuses: ['partial'],
    completedStatuses: ['received'],
  },
  {
    key: 'received',
    label: 'Received',
    icon: PackageCheck,
    activeStatuses: ['received'],
    completedStatuses: [],
  },
];

interface GrnWorkflowRailProps {
  status: GrnStatus;
}

export function GrnWorkflowRail({ status }: GrnWorkflowRailProps) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-[color:rgb(185_28_28_/_0.06)] rounded-lg border border-[color:rgb(185_28_28_/_0.2)]">
        <XCircle className="h-4 w-4 text-danger flex-shrink-0" aria-hidden="true" />
        <span className="text-[13px] font-semibold text-danger">GRN Cancelled</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0" role="list" aria-label="GRN workflow steps">
      {STEPS.map((step, idx) => {
        const isActive = step.activeStatuses.includes(status);
        const isCompleted = step.completedStatuses.includes(status);
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center" role="listitem">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors',
                  isCompleted
                    ? 'bg-success border-success text-white'
                    : isActive
                      ? 'bg-accent border-accent text-white'
                      : 'bg-surface-sunken border-hairline text-ink-soft',
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <span
                className={cn(
                  'text-[11px] font-semibold whitespace-nowrap',
                  isCompleted ? 'text-success' : isActive ? 'text-accent' : 'text-ink-soft',
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-12 mx-1 mb-6 transition-colors',
                  isCompleted ? 'bg-success' : 'bg-hairline',
                )}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
