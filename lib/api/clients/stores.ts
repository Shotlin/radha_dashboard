/**
 * lib/api/clients/stores.ts — Stores endpoints (Doc 1 §6.3)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { StoreSchema, StoreListSchema } from '../schemas/common';

export async function listStores() {
  return apiFetch('/stores', { schema: StoreListSchema });
}

export async function getStore(storeId: string) {
  return apiFetch(`/stores/${storeId}`, { schema: StoreSchema });
}

export async function createStore(data: { name: string; address?: string }) {
  return apiFetch('/stores', { method: 'POST', body: data, schema: StoreSchema });
}

export async function updateStore(storeId: string, data: Partial<{ name: string; address: string; isActive: boolean }>) {
  return apiFetch(`/stores/${storeId}`, { method: 'PATCH', body: data, schema: StoreSchema });
}

export async function deleteStore(storeId: string) {
  return apiFetch(`/stores/${storeId}`, { method: 'DELETE', schema: z.object({}), noBody: true });
}
