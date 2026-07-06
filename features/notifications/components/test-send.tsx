'use client';
/**
 * features/notifications/components/test-send.tsx
 * Admin/owner only: channel picker + send button.
 * POSTs to /api/notifications/test.
 */
import { useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSendTestMutation } from '../notifications.actions';
import { CHANNEL_LABELS } from '../notifications.schema';

const CHANNELS = Object.entries(CHANNEL_LABELS) as [string, string][];

export function TestSendPanel() {
  const [channel, setChannel] = useState<string>('in_app');
  const sendMutation = useSendTestMutation();

  function handleSend() {
    sendMutation.mutate(channel);
  }

  return (
    <div className="card p-5">
      <h3 className="text-[15px] font-bold text-[var(--ink)] mb-1">Send Test Notification</h3>
      <p className="text-[13px] text-[var(--ink-soft)] mb-4">
        Fire a test notification to your account. Useful for verifying delivery channels are configured correctly.
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Channel picker */}
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Notification channel">
          {CHANNELS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={channel === key}
              onClick={() => setChannel(key)}
              className={
                channel === key
                  ? 'px-3 py-1.5 rounded-full text-[13px] font-semibold bg-[var(--accent)] text-white transition-colors'
                  : 'px-3 py-1.5 rounded-full text-[13px] font-medium bg-[var(--surface-sunken)] text-[var(--ink)] border border-[var(--hairline)] hover:border-[var(--accent)] transition-colors'
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Send button */}
        <Button
          variant="primary"
          size="sm"
          onClick={handleSend}
          loading={sendMutation.isPending}
          className="flex-shrink-0"
        >
          <SendHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Send test
        </Button>
      </div>

      {sendMutation.isError && (
        <p className="mt-3 text-[13px] text-[var(--danger)]" role="alert">
          Failed to send test notification. Please try again.
        </p>
      )}
      {sendMutation.isSuccess && (
        <p className="mt-3 text-[13px] text-[var(--success)]" role="status">
          Test notification sent via <strong>{CHANNEL_LABELS[channel]}</strong>. Check your device/inbox.
        </p>
      )}
    </div>
  );
}
