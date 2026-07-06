/**
 * lib/auth/rbac.ts — pure RBAC helpers.
 *
 * These operate on the session payload (returned by getSession or useSession).
 * Client-side usage is cosmetic (hide/disable). Backend re-checks on every request.
 */
import type { SessionPayload } from './session';
import type { Permission, Role } from '@/lib/permissions';

export type { Permission, Role };

/** True if the session user has the given role. */
export function hasRole(session: SessionPayload | null, role: Role): boolean {
  if (!session) return false;
  return session.user.role === role;
}

/** True if the session user holds the given permission string. */
export function can(session: SessionPayload | null, permission: Permission): boolean {
  if (!session) return false;
  return session.user.permissions.includes(permission);
}

/** True if the user has ANY of the supplied roles. */
export function hasAnyRole(session: SessionPayload | null, roles: Role[]): boolean {
  if (!session) return false;
  return roles.includes(session.user.role as Role);
}

/** True if the user holds ALL of the supplied permissions. */
export function canAll(session: SessionPayload | null, permissions: Permission[]): boolean {
  if (!session) return false;
  return permissions.every((p) => session.user.permissions.includes(p));
}
