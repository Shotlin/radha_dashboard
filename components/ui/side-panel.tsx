'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** If true, shows a "You have unsaved changes" confirm before closing */
  isDirty?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Side Panel (Doc 2 §4.7) — right slide-in drawer, xl left radius, scrim.
 * Confirm-on-dismiss if dirty. Spring enter from right.
 */
export function SidePanel({
  open,
  onOpenChange,
  title,
  description,
  isDirty = false,
  children,
  footer,
  className,
}: SidePanelProps) {
  const handleOpenChange = (next: boolean) => {
    if (!next && isDirty) {
      if (!window.confirm('You have unsaved changes. Close anyway?')) return;
    }
    onOpenChange(next);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        {/* Scrim */}
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px]',
            'data-[state=open]:animate-fade-up data-[state=closed]:opacity-0',
            'transition-opacity duration-[280ms]',
          )}
        />
        {/* Panel */}
        <Dialog.Content
          className={cn(
            'fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px]',
            'bg-surface-raised flex flex-col',
            'rounded-l-[24px] shadow-[var(--shadow-card-md)]',
            'data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full',
            'transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
            className,
          )}
          aria-describedby={description ? 'side-panel-desc' : undefined}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4 border-b border-hairline">
            <div>
              <Dialog.Title className="text-[18px] font-bold text-ink">{title}</Dialog.Title>
              {description && (
                <Dialog.Description id="side-panel-desc" className="text-[13px] text-ink-soft mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="ml-4 flex-shrink-0 p-2 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-accent transition-colors"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="p-6 pt-4 border-t border-hairline bg-surface">{footer}</div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
