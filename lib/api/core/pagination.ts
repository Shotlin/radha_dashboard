/**
 * lib/api/core/pagination.ts — cursor pagination helpers.
 * Backend uses (created_at desc, id desc) cursor pattern.
 */
import { z } from 'zod';

export const PaginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().optional(),
    nextCursor: z.string().nullable().optional(),
    hasMore: z.boolean().optional(),
  });

export type Paginated<T> = {
  items: T[];
  total?: number;
  nextCursor?: string | null;
  hasMore?: boolean;
};

export interface CursorParams {
  cursor?: string;
  limit?: number;
}

/** Build standard limit/cursor query params */
export function cursorParams(p?: CursorParams): Record<string, string> {
  const out: Record<string, string> = {};
  if (p?.limit !== undefined) out.limit = String(p.limit);
  if (p?.cursor) out.cursor = p.cursor;
  return out;
}
