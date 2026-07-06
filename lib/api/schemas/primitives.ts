/**
 * lib/api/schemas/primitives.ts — shared Zod primitives used across domain schemas.
 */
import { z } from 'zod';

export const UUIDSchema = z.string().uuid();
export const ISODateSchema = z.string().datetime({ offset: true });
export const ISODateLocalSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const EANSchema = z.string().min(8).max(14).regex(/^\d+$/);
export const PhoneSchema = z.string().min(10).max(15);
export const MoneySchema = z.number().nonnegative();
export const PaginationCursorSchema = z.string().optional();
export const LimitSchema = z.number().int().min(1).max(100).optional().default(20);
