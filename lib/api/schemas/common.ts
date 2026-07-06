/**
 * lib/api/schemas/common.ts — shared domain schemas (User, Store, KPIs, etc.)
 */
import { z } from 'zod';
import { UUIDSchema, ISODateSchema, MoneySchema } from './primitives';

/* ── Auth / User ─────────────────────────────────────────────────────────── */
export const UserMeSchema = z.object({
  id: UUIDSchema,
  mobile: z.string().optional(),
  name: z.string(),
  role: z.string(),
  tenantId: UUIDSchema,
  storeIds: z.array(UUIDSchema),
  permissions: z.array(z.string()),
  isVerified: z.boolean(),
  bypassOnboarding: z.boolean().optional(),
  createdAt: ISODateSchema,
});
export type UserMe = z.infer<typeof UserMeSchema>;

export const TokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});
export type TokenPair = z.infer<typeof TokenPairSchema>;

/* ── Store ───────────────────────────────────────────────────────────────── */
export const StoreSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  tenantId: UUIDSchema,
  address: z.string().optional(),
  isActive: z.boolean().optional(),
  createdAt: ISODateSchema.optional(),
});
export type Store = z.infer<typeof StoreSchema>;

export const StoreListSchema = z.object({
  stores: z.array(StoreSchema),
  total: z.number().optional(),
});

/* ── Dashboard KPIs ──────────────────────────────────────────────────────── */
export const KpiItemSchema = z.object({
  label: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  trend: z.number().optional(), // % change
  trendDirection: z.enum(['up', 'down', 'flat']).optional(),
  actionNeeded: z.boolean().optional(),
});
export type KpiItem = z.infer<typeof KpiItemSchema>;

export const DashboardKpisSchema = z.object({
  expiringItems: z.number(),
  expiredItems: z.number(),
  lowStockItems: z.number(),
  openTasks: z.number(),
  pendingGrns: z.number(),
  storeHealthScore: z.number().optional(),
  kpis: z.array(KpiItemSchema).optional(),
});
export type DashboardKpis = z.infer<typeof DashboardKpisSchema>;

/* ── Alert ───────────────────────────────────────────────────────────────── */
export const AlertItemSchema = z.object({
  id: UUIDSchema,
  type: z.string(),
  severity: z.enum(['info', 'warning', 'critical']),
  message: z.string(),
  storeId: UUIDSchema.optional(),
  resolvedAt: ISODateSchema.nullable().optional(),
  createdAt: ISODateSchema,
});
export type AlertItem = z.infer<typeof AlertItemSchema>;

/* ── Health Score ────────────────────────────────────────────────────────── */
export const HealthScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  components: z.array(
    z.object({
      label: z.string(),
      score: z.number().min(0).max(100),
      weight: z.number().optional(),
    }),
  ).optional(),
  lastAssessedAt: ISODateSchema.nullable().optional(),
});
export type HealthScore = z.infer<typeof HealthScoreSchema>;

/* ── Notification ────────────────────────────────────────────────────────── */
export const NotificationSchema = z.object({
  id: UUIDSchema,
  type: z.string(),
  title: z.string(),
  body: z.string().optional(),
  isRead: z.boolean(),
  createdAt: ISODateSchema,
  metadata: z.record(z.unknown()).optional(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationListSchema = z.object({
  items: z.array(NotificationSchema),
  unreadCount: z.number(),
  nextCursor: z.string().nullable().optional(),
});

/* ── Product ─────────────────────────────────────────────────────────────── */
export const ProductSchema = z.object({
  id: UUIDSchema,
  ean: z.string(),
  name: z.string(),
  brand: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type Product = z.infer<typeof ProductSchema>;

/* ── Expiry record ───────────────────────────────────────────────────────── */
export const ExpiryRecordSchema = z.object({
  id: UUIDSchema,
  storeId: UUIDSchema,
  productId: UUIDSchema.optional(),
  ean: z.string(),
  productName: z.string().optional(),
  expiryDate: z.string(),
  batchNo: z.string().optional(),
  quantity: z.number(),
  status: z.enum(['fresh', 'expiring_soon', 'expired']),
  createdAt: ISODateSchema,
  updatedAt: ISODateSchema,
});
export type ExpiryRecord = z.infer<typeof ExpiryRecordSchema>;

/* ── Task ────────────────────────────────────────────────────────────────── */
export const TaskSchema = z.object({
  id: UUIDSchema,
  storeId: UUIDSchema,
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: UUIDSchema.nullable().optional(),
  dueAt: ISODateSchema.nullable().optional(),
  completedAt: ISODateSchema.nullable().optional(),
  createdAt: ISODateSchema,
  updatedAt: ISODateSchema,
});
export type Task = z.infer<typeof TaskSchema>;

/* ── Inventory ───────────────────────────────────────────────────────────── */
export const InventoryItemSchema = z.object({
  id: UUIDSchema,
  storeId: UUIDSchema,
  productId: UUIDSchema,
  ean: z.string(),
  productName: z.string(),
  currentStock: z.number(),
  minStock: z.number().optional(),
  unit: z.string().optional(),
  lastMovedAt: ISODateSchema.nullable().optional(),
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

/* ── GRN ─────────────────────────────────────────────────────────────────── */
export const GrnSchema = z.object({
  id: UUIDSchema,
  storeId: UUIDSchema,
  supplierId: UUIDSchema.optional(),
  invoiceNo: z.string().optional(),
  status: z.enum(['draft', 'received', 'partial', 'cancelled']),
  itemCount: z.number().optional(),
  totalAmount: MoneySchema.optional(),
  receivedAt: ISODateSchema.nullable().optional(),
  createdAt: ISODateSchema,
});
export type Grn = z.infer<typeof GrnSchema>;

/* ── Supplier ────────────────────────────────────────────────────────────── */
export const SupplierSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  name: z.string(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  isActive: z.boolean(),
  createdAt: ISODateSchema,
});
export type Supplier = z.infer<typeof SupplierSchema>;

/* ── EAN List ────────────────────────────────────────────────────────────── */
export const EanListSchema = z.object({
  id: UUIDSchema,
  storeId: UUIDSchema,
  name: z.string(),
  isActive: z.boolean(),
  itemCount: z.number(),
  createdAt: ISODateSchema,
});
export type EanList = z.infer<typeof EanListSchema>;

/* ── Subscription ────────────────────────────────────────────────────────── */
export const SubscriptionSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  plan: z.string(),
  status: z.enum(['trial', 'active', 'past_due', 'cancelled', 'expired']),
  trialEndsAt: ISODateSchema.nullable().optional(),
  currentPeriodEnd: ISODateSchema.nullable().optional(),
  cancelledAt: ISODateSchema.nullable().optional(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;
