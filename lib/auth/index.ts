/**
 * lib/auth — public barrel for auth utilities.
 *
 * Server-only functions (getSession, setSession, clearSession) must be
 * imported directly from './session' in Route Handlers / Server Components.
 *
 * Client-safe exports re-exported here:
 */
export { useSession, usePermission } from './use-session';
export { hasRole, can, hasAnyRole, canAll } from './rbac';
export type { SessionUser, UseSessionResult } from './use-session';
export type { Permission, Role } from './rbac';
