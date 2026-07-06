'use client';
/**
 * components/auth/role-gate.tsx — cosmetic client-side role gate.
 *
 * Hides/disables children if the current user does not have the required role.
 * This is display-only — the backend enforces real access.
 */
import { useSession } from '@/lib/auth/use-session';

interface RoleGateProps {
  /** Required role(s) — child renders if user has ANY of them */
  roles: string[];
  /** Fallback to render when access is denied (default: null) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGate({ roles, fallback = null, children }: RoleGateProps) {
  const { user, isLoading } = useSession();
  if (isLoading) return null;
  if (!user || !roles.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
}
