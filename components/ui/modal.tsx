'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ModalAction {
  label: string;
  onClick: () => void;
  loading?: boolean;
}

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** If set, renders in danger mode (red CTA, separated from cancel) */
  destructive?: boolean;
  primaryAction?: ModalAction;
  cancelLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Modal (Doc 2 §4.8) — centered, scale 0.96→1 + opacity.
 * Destructive variant separates danger CTA from cancel.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  destructive = false,
  primaryAction,
  cancelLabel = 'Cancel',
  children,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] data-[state=open]:animate-fade-up transition-opacity duration-200" />
        <Dialog.Content
          className={cn(
            'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-md bg-surface-raised rounded-xl shadow-[var(--shadow-card-md)]',
            'data-[state=open]:scale-100 data-[state=open]:opacity-100',
            'data-[state=closed]:scale-95 data-[state=closed]:opacity-0',
            'transition-[transform,opacity] duration-200 ease-[var(--motion-enter)]',
            'p-6',
            className,
          )}
          aria-describedby={description ? 'modal-desc' : undefined}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <Dialog.Title
              className={cn('text-[18px] font-bold', destructive ? 'text-danger' : 'text-ink')}
            >
              {title}
            </Dialog.Title>
            <Dialog.Close
              className="flex-shrink-0 p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-accent transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {description && (
            <Dialog.Description id="modal-desc" className="text-[14px] text-ink-soft mb-4">
              {description}
            </Dialog.Description>
          )}

          {children && <div className="mb-6">{children}</div>}

          {/* Actions */}
          {primaryAction && (
            <div
              className={cn(
                'flex gap-3',
                destructive ? 'flex-col-reverse sm:flex-row-reverse' : 'justify-end',
              )}
            >
              <Dialog.Close asChild>
                <Button variant="secondary" size="sm">
                  {cancelLabel}
                </Button>
              </Dialog.Close>
              <Button
                variant={destructive ? 'danger' : 'primary'}
                size="sm"
                onClick={primaryAction.onClick}
                loading={primaryAction.loading}
              >
                {primaryAction.label}
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
