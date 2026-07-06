'use client';
/**
 * components/auth/permission-gate.tsx — cosmetic client-side permission gate.
 *
 * Hides/disables children if the current user does not hold the required permission.
 * Display-only — backend enforces real access.
 */
import { useSession } from '@/lib/auth/use-session';

interface PermissionGateProps {
  /** Required permission string */
  permission: string;
  /** Fallback to render when access is denied (default: null) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const { user, isLoading } = useSession();
  if (isLoading) return null;
  if (!user || !user.permissions.includes(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
