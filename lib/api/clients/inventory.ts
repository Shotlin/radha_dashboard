/**
 * lib/api/clients/inventory.ts — Inventory endpoints (Doc 1 §6.10, §7.4)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { InventoryItemSchema } from '../schemas/common';
import { PaginatedSchema, cursorParams, type CursorParams } from '../core/pagination';

const StockMovementSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  productId: z.string().optional(),
  ean: z.string(),
  type: z.enum(['in', 'out', 'adjustment', 'count']),
  quantity: z.number(),
  reason: z.string().optional(),
  createdAt: z.string(),
});

export interface InventoryFilters extends CursorParams {
  storeId: string;
  lowStock?: boolean;
  categoryId?: string;
  search?: string;
}

export async function listInventory(filters: InventoryFilters) {
  const { storeId, lowStock, categoryId, search, ...paging } = filters;
  return apiFetch('/inventory', {
    schema: PaginatedSchema(InventoryItemSchema),
    query: { storeId, lowStock, categoryId, search, ...cursorParams(paging) },
  });
}

export async function getInventoryItem(id: string) {
  return apiFetch(`/inventory/${id}`, { schema: InventoryItemSchema });
}

export async function getLowStockAlerts(storeId: string) {
  return apiFetch('/inventory/low-stock', {
    schema: z.object({ items: z.array(InventoryItemSchema), total: z.number() }),
    query: { storeId },
  });
}

export async function getInventoryKpis(storeId: string) {
  return apiFetch('/inventory/kpis', {
    schema: z.object({ totalSkus: z.number(), lowStockCount: z.number(), outOfStockCount: z.number() }),
    query: { storeId },
  });
}

export async function recordStockMovement(data: {
  storeId: string;
  ean: string;
  type: string;
  quantity: number;
  reason?: string;
}) {
  return apiFetch('/inventory/movements', { method: 'POST', body: data, schema: StockMovementSchema });
}

export async function listStockMovements(storeId: string, params?: CursorParams) {
  return apiFetch('/inventory/movements', {
    schema: PaginatedSchema(StockMovementSchema),
    query: { storeId, ...cursorParams(params) },
  });
}

export async function updateMinStock(productId: string, storeId: string, minStock: number) {
  return apiFetch(`/inventory/${productId}/min-stock`, {
    method: 'PATCH',
    body: { storeId, minStock },
    schema: InventoryItemSchema,
  });
}
