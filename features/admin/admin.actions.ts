'use client';
/**
 * features/admin/admin.actions.ts
 * Client-side mutation actions for the Admin Console feature (Phase 16).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/api/query-keys';
import type {
  ApproveSubmissionPayload,
  CreateWebhookPayload,
  UpdateWebhookPayload,
} from './admin.schema';

/* ── Impersonation ───────────────────────────────────────────────────────── */

export async function startImpersonation(payload: {
  targetUserId: string;
  reason: string;
}): Promise<{ impersonationToken: string; expiresAt: string }> {
  const res = await fetch('/api/admin/impersonate', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: payload.targetUserId, reason: payload.reason }),
  });
  if (!res.ok) throw new Error('Failed to start impersonation');
  return res.json() as Promise<{ impersonationToken: string; expiresAt: string }>;
}

export async function stopImpersonation(): Promise<{ ok: boolean }> {
  const res = await fetch('/api/admin/impersonate/stop', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to stop impersonation');
  return res.json() as Promise<{ ok: boolean }>;
}

/* ── Webhooks ────────────────────────────────────────────────────────────── */

export async function createWebhook(data: CreateWebhookPayload) {
  const res = await fetch('/api/admin/webhooks', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create webhook');
  return res.json();
}

export async function updateWebhook(id: string, data: UpdateWebhookPayload) {
  const res = await fetch(`/api/admin/webhooks/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update webhook');
  return res.json();
}

export async function deleteWebhook(id: string): Promise<void> {
  const res = await fetch(`/api/admin/webhooks/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete webhook');
}

export async function replayDelivery(webhookId: string, deliveryId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/admin/webhooks/${webhookId}/deliveries/${deliveryId}/replay`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to replay delivery');
  return res.json() as Promise<{ ok: boolean }>;
}

/* ── Community product submissions (BE-56 v2) ────────────────────────────── */

export async function approveSubmission(id: string, data: ApproveSubmissionPayload) {
  const res = await fetch(`/api/admin/submissions/${id}/approve`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to approve submission');
  return res.json();
}

export async function rejectSubmission(id: string, reason: string) {
  const res = await fetch(`/api/admin/submissions/${id}/reject`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Failed to reject submission');
  return res.json();
}

/* ── React mutation hooks ────────────────────────────────────────────────── */

export function useStartImpersonationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startImpersonation,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'impersonation-audit'] });
    },
  });
}

export function useStopImpersonationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stopImpersonation,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'impersonation-audit'] });
    },
  });
}

export function useCreateWebhookMutation(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.webhooks(tenantId) });
    },
  });
}

export function useUpdateWebhookMutation(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWebhookPayload }) =>
      updateWebhook(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.webhooks(tenantId) });
    },
  });
}

export function useDeleteWebhookMutation(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.webhooks(tenantId) });
    },
  });
}

export function useReplayDeliveryMutation(webhookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deliveryId }: { deliveryId: string }) =>
      replayDelivery(webhookId, deliveryId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.webhookDeliveries(webhookId) });
    },
  });
}

export function useApproveSubmissionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveSubmissionPayload }) =>
      approveSubmission(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'submissions'] });
    },
  });
}

export function useRejectSubmissionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectSubmission(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'submissions'] });
    },
  });
}
