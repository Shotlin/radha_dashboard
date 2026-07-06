'use server';
/**
 * features/expiry/expiry.actions.ts — Server Actions for expiry module.
 * Calls server-only API clients; results revalidate relevant query keys.
 */
import { revalidatePath } from 'next/cache';
import {
  createExpiry,
  updateExpiry,
  deleteExpiry,
  acknowledgeExpiryAlert,
  updateExpiryThresholds,
} from '@/lib/api/clients/expiry';

/* ── createExpiry ────────────────────────────────────────── */
export async function createExpiryAction(data: {
  storeId: string;
  ean: string;
  expiryDate: string;
  quantity: number;
  batchNo?: string;
}) {
  const result = await createExpiry(data);
  revalidatePath('/expiry');
  return result;
}

/* ── updateExpiry ────────────────────────────────────────── */
export async function updateExpiryAction(
  id: string,
  data: Partial<{ expiryDate: string; quantity: number; status: string }>,
) {
  const result = await updateExpiry(id, data);
  revalidatePath('/expiry');
  return result;
}

/* ── deleteExpiry ────────────────────────────────────────── */
export async function deleteExpiryAction(id: string) {
  const result = await deleteExpiry(id);
  revalidatePath('/expiry');
  return result;
}

/* ── acknowledgeAlert ────────────────────────────────────── */
export async function acknowledgeAlertAction(id: string) {
  const result = await acknowledgeExpiryAlert(id);
  revalidatePath('/expiry');
  return result;
}

/* ── updateThresholds ────────────────────────────────────── */
export async function updateThresholdsAction(
  storeId: string,
  thresholds: Array<{ category: string; warningDays: number }>,
) {
  const result = await updateExpiryThresholds(storeId, thresholds);
  revalidatePath('/expiry');
  return result;
}
