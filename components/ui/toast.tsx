'use client';

import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warn' | 'info';

export interface ToastData {
  id: string;
  message: string;
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; icon: React.ElementType; iconClass: string }> = {
  success: { bg: 'bg-[color:rgb(21_128_61_/_0.08)] border-[color:rgb(21_128_61_/_0.25)]', icon: CheckCircle, iconClass: 'text-success' },
  error: { bg: 'bg-[color:rgb(185_28_28_/_0.08)] border-[color:rgb(185_28_28_/_0.25)]', icon: AlertCircle, iconClass: 'text-danger' },
  warn: { bg: 'bg-[color:rgb(180_83_9_/_0.08)] border-[color:rgb(180_83_9_/_0.25)]', icon: AlertTriangle, iconClass: 'text-warn' },
  info: { bg: 'bg-surface-raised border-hairline', icon: Info, iconClass: 'text-teal' },
};

/* ── Single Toast item ─────────────────────────────────── */
interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const variant = toast.variant ?? 'info';
  const cfg = VARIANT_STYLES[variant];
  const Icon = cfg.icon;

  React.useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.durationMs ?? 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.durationMs, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-[var(--shadow-card)]',
        'text-[14px] text-ink animate-fade-up',
        cfg.bg,
      )}
    >
      <Icon className={cn('h-4 w-4 flex-shrink-0 mt-0.5', cfg.iconClass)} aria-hidden="true" />
      <span className="flex-1">{toast.message}</span>
      {toast.actionLabel && toast.onAction && (
        <button
          onClick={toast.onAction}
          className="text-accent font-semibold text-[13px] ml-1 hover:underline"
        >
          {toast.actionLabel}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-ink-soft hover:text-ink ml-1"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/* ── Toaster context + hook ─────────────────────────────── */
interface ToasterContextValue {
  addToast: (toast: Omit<ToastData, 'id'>) => void;
}

const ToasterContext = React.createContext<ToasterContextValue | null>(null);

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const addToast = React.useCallback((data: Omit<ToastData, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-4), { ...data, id }]); // max 5 toasts
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToasterContext.Provider value={{ addToast }}>
      {children}
      {/* Toast stack — bottom-right */}
      <div
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-3rem)]"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToasterContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToasterContext);
  if (!ctx) throw new Error('useToast must be used within <ToasterProvider>');
  return ctx;
}

/* ── Offline Banner ─────────────────────────────────────── */
export function OfflineBanner() {
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 inset-x-0 z-[200] bg-warn text-white text-[13px] font-semibold text-center py-2 px-4"
    >
      You're offline — changes may not be saved
    </div>
  );
}
