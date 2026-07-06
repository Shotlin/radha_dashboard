/**
 * (dash)/layout.tsx — Server Component layout for all dashboard screens.
 *
 * Re-checks the session server-side BEFORE any Feature_Area data renders — the
 * middleware presence-check alone is not trusted (R7.5). On failure it renders
 * no Feature_Area data and redirects to `/login` with a validated same-origin
 * `next` (R7.6). For admin route segments it enforces the owner/admin role and
 * redirects to `/403` with no admin data rendered first (R7.4).
 *
 * Renders the adaptive shell: sidebar + top bar + page content.
 */
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth/session';
import { safeNextOrHome } from '@/lib/auth/next-param';
import { isAdminRole } from '@/lib/permissions';
import { DashShell } from '@/components/shell/dash-shell';

/**
 * Best-effort recovery of the current request pathname server-side.
 *
 * Next.js 15 does not expose the active pathname to layouts directly, and the
 * middleware (task 7.1) is intentionally left untouched and sets no custom
 * header. We therefore probe the headers Next forwards: on RSC client
 * navigations the browser sends `next-url` with the destination path, and some
 * deployments forward `x-pathname`/`x-invoke-path`. When none is available we
 * return `null` and callers fall back to safe defaults.
 */
async function getRequestPath(): Promise<string | null> {
  const h = await headers();
  const candidate =
    h.get('x-pathname') ?? h.get('x-invoke-path') ?? h.get('next-url') ?? null;
  if (!candidate) return null;
  // Relative values (a leading `/`) are already a pathname; strip any query.
  if (candidate.startsWith('/')) return candidate.split('?')[0];
  // `next-url` can be an absolute URL — reduce it to its pathname.
  try {
    return new URL(candidate).pathname;
  } catch {
    return null;
  }
}

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  // R7.5: re-verify the session server-side before rendering any Feature_Area data.
  const session = await getSession();
  const pathname = await getRequestPath();

  if (!session) {
    // R7.6: render no Feature_Area data; redirect to /login with a validated,
    // same-origin relative `next` (falls back to home when the path is unknown
    // or unsafe).
    const next = safeNextOrHome(pathname);
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  // R7.4: admin segments admit only owner/admin. Redirect insufficient roles to
  // /403 before any admin data is rendered. When the pathname is unavailable the
  // authoritative admin/layout.tsx guard still enforces this (defense in depth).
  if (pathname && pathname.startsWith('/admin')) {
    if (!isAdminRole(session.user.role)) {
      redirect('/403');
    }
  }

  return <DashShell>{children}</DashShell>;
}
