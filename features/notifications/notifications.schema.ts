/**
 * features/notifications/notifications.schema.ts
 * Zod schemas for the Notifications feature (Phase 15).
 */
import { z } from 'zod';

/* ── Notification item ───────────────────────────────────────────────────── */
export const NotificationTypeSchema = z.enum([
  'expiry_alert',
  'task_assigned',
  'task_due',
  'grn_received',
  'stock_low',
  'subscription',
  'health_score',
  'audit',
  'system',
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationItemSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  body: z.string().optional(),
  isRead: z.boolean(),
  createdAt: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
export type NotificationItem = z.infer<typeof NotificationItemSchema>;

export const NotificationListResponseSchema = z.object({
  items: z.array(NotificationItemSchema),
  unreadCount: z.number(),
  nextCursor: z.string().nullable().optional(),
});
export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;

/* ── Preferences ─────────────────────────────────────────────────────────── */
export const NotificationPrefsSchema = z.object({
  channels: z.record(z.boolean()),
  types: z.record(z.boolean()),
});
export type NotificationPrefs = z.infer<typeof NotificationPrefsSchema>;

export const UpdatePrefsSchema = z.object({
  channels: z.record(z.boolean()).optional(),
  types: z.record(z.boolean()).optional(),
});
export type UpdatePrefsPayload = z.infer<typeof UpdatePrefsSchema>;

/* ── Test send ───────────────────────────────────────────────────────────── */
export const TestSendSchema = z.object({
  channel: z.enum(['email', 'push', 'sms', 'in_app']),
});
export type TestSendPayload = z.infer<typeof TestSendSchema>;

export const NOTIFICATION_TYPE_META: Record<
  string,
  { label: string; glyph: string; color: string }
> = {
  expiry_alert: { label: 'Expiry Alert', glyph: '⏰', color: 'text-[var(--warn)]' },
  task_assigned: { label: 'Task Assigned', glyph: '📋', color: 'text-[var(--accent)]' },
  task_due: { label: 'Task Due', glyph: '⚠️', color: 'text-[var(--warn)]' },
  grn_received: { label: 'GRN Received', glyph: '🚚', color: 'text-[var(--success)]' },
  stock_low: { label: 'Low Stock', glyph: '📦', color: 'text-[var(--accent-deep)]' },
  subscription: { label: 'Subscription', glyph: '💳', color: 'text-[var(--accent)]' },
  health_score: { label: 'Health Score', glyph: '🏥', color: 'text-[var(--teal)]' },
  audit: { label: 'Audit', glyph: '🔍', color: 'text-[var(--accent)]' },
  system: { label: 'System', glyph: '⚙️', color: 'text-[var(--ink-soft)]' },
};

export const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  push: 'Push Notifications',
  sms: 'SMS',
  in_app: 'In-App',
};

export const TYPE_LABELS: Record<string, string> = {
  expiry_alert: 'Expiry Alerts',
  task_assigned: 'Task Assignments',
  task_due: 'Task Due Reminders',
  grn_received: 'GRN Received',
  stock_low: 'Low Stock Alerts',
  subscription: 'Subscription Updates',
  health_score: 'Health Score Reports',
  audit: 'Audit Notifications',
  system: 'System Messages',
};
