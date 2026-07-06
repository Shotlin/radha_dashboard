'use client';
/**
 * features/notifications/components/preferences.tsx
 * Toggle list for notification channels and types.
 * PATCHes the backend immediately on each change.
 */
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/states';
import { useNotificationPrefs } from '../notifications.queries';
import { useUpdatePrefsMutation } from '../notifications.actions';
import { CHANNEL_LABELS, TYPE_LABELS } from '../notifications.schema';

/* ── Toggle row ──────────────────────────────────────────────────────────── */
function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--hairline)] last:border-b-0">
      <span className="text-[14px] text-[var(--ink)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200',
          'focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          checked ? 'bg-[var(--accent)]' : 'bg-[var(--hairline)]',
        )}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm',
            'transition-transform duration-200 ease-[var(--motion-enter)]',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

/* ── Section ─────────────────────────────────────────────────────────────── */
function PrefsSection({
  title,
  data,
  labels,
  onToggle,
  isPending,
}: {
  title: string;
  data: Record<string, boolean>;
  labels: Record<string, string>;
  onToggle: (key: string, value: boolean) => void;
  isPending: boolean;
}) {
  const keys = Object.keys(labels);

  return (
    <div className="card p-5">
      <h3 className="text-[15px] font-bold text-[var(--ink)] mb-3">{title}</h3>
      <div>
        {keys.map((key) => (
          <ToggleRow
            key={key}
            label={labels[key] ?? key}
            checked={data[key] ?? true}
            onChange={(v) => onToggle(key, v)}
            disabled={isPending}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Preferences panel ───────────────────────────────────────────────────── */
export function NotificationPreferences() {
  const { data, isLoading, isError } = useNotificationPrefs();
  const updateMutation = useUpdatePrefsMutation();

  function handleChannelToggle(key: string, value: boolean) {
    updateMutation.mutate({ channels: { [key]: value } });
  }

  function handleTypeToggle(key: string, value: boolean) {
    updateMutation.mutate({ types: { [key]: value } });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="card p-5">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="card p-5 text-center text-[14px] text-[var(--ink-soft)]">
        Could not load preferences. Please refresh.
      </div>
    );
  }

  // Merge backend data with the known labels (backend may have more or fewer keys)
  const channels = { ...Object.fromEntries(Object.keys(CHANNEL_LABELS).map((k) => [k, true])), ...data.channels };
  const types = { ...Object.fromEntries(Object.keys(TYPE_LABELS).map((k) => [k, true])), ...data.types };

  return (
    <div className="flex flex-col gap-4">
      <PrefsSection
        title="Notification Channels"
        data={channels}
        labels={CHANNEL_LABELS}
        onToggle={handleChannelToggle}
        isPending={updateMutation.isPending}
      />
      <PrefsSection
        title="Notification Types"
        data={types}
        labels={TYPE_LABELS}
        onToggle={handleTypeToggle}
        isPending={updateMutation.isPending}
      />

      {updateMutation.isError && (
        <p className="text-[13px] text-[var(--danger)] text-center" role="alert">
          Failed to save preferences. Please try again.
        </p>
      )}
      {updateMutation.isSuccess && (
        <p className="text-[13px] text-[var(--success)] text-center" role="status">
          Preferences saved.
        </p>
      )}
    </div>
  );
}
