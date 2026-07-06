/**
 * lib/api/index.ts — public barrel for the RADHA API client layer.
 *
 * All server-side usage should import from here (or the specific client file).
 * Client components use Server Actions / /api/* proxies — they do NOT import
 * from this barrel directly.
 */

// Core
export { apiFetch } from './core/api-fetch';
export {
  ApiRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ResponseValidationError,
  NotImplementedBackendError,
  toUiError,
  type ApiError,
  type UiError,
  type UiErrorPlacement,
} from './core/errors';
export { cursorParams, PaginatedSchema, type Paginated, type CursorParams } from './core/pagination';
export { debounce, throttle, exponentialBackoffMs, sleep } from './core/rate';
export { QueryProvider } from './core/query-client';

// Query keys
export { qk } from './query-keys';

// Schemas
export * from './schemas/primitives';
export * from './schemas/common';

// Domain clients
export * as dashboardApi from './clients/dashboard';
export * as storesApi from './clients/stores';
export * as authApi from './clients/auth';
export * as expiryApi from './clients/expiry';
export * as tasksApi from './clients/tasks';
export * as inventoryApi from './clients/inventory';
export * as grnApi from './clients/grn';
export * as suppliersApi from './clients/suppliers';
export * as eanListsApi from './clients/ean-lists';
export * as reportsApi from './clients/reports';
export * as subscriptionsApi from './clients/subscriptions';
export * as analyticsApi from './clients/analytics';
export * as notificationsApi from './clients/notifications';
export * as adminApi from './clients/admin';
export * as productsApi from './clients/products';
export * as tenantsApi from './clients/tenants';
export * as featureFlagsApi from './clients/feature-flags';
export * as recallApi from './clients/recall';
export * as referralsApi from './clients/referrals';
