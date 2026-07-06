/**
 * app/(dash)/admin/layout.tsx — Server Component admin guard.
 *
 * SECURITY: Re-checks session server-side. If the user is not an admin,
 * redirects to /403. This is the authoritative gate for the entire /admin section.
 * Client-side role checks (RoleGate) are cosmetic only.
 */
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/permissions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!isAdminRole(session.user.role)) {
    redirect('/403');
  }

  return <>{children}</>;
}
