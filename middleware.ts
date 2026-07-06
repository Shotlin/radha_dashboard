/**
 * middleware.ts — route guard.
 *
 * Checks only for session cookie PRESENCE (fast, no upstream call).
 * The server layout / server component re-checks role and permissions
 * before rendering any data — middleware is the UX gate, not the security gate.
 *
 * Routing logic:
 *  - Unauthenticated → /login?next=<original-path>
 *  - /admin/* accessed by non-admin → /403
 *  - /login accessed while authenticated → / (or role-based home)
 */
import { NextResponse, type NextRequest } from 'next/server';
import { safeNextOrHome } from '@/lib/auth/next-param';
import { isAdminRole } from '@/lib/permissions';

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? 'radha_session';

/** Routes that are public (no session required) */
const PUBLIC_PATHS = ['/login', '/reset', '/invite', '/verify', '/403', '/styleguide'];

/** Routes that require 'admin' role (read from cookie claim — cosmetic check) */
const ADMIN_ONLY_PREFIX = '/admin';

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function getSessionFromCookie(req: NextRequest): { role?: string } | null {
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { user?: { role?: string } };
    return { role: parsed.user?.role };
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const session = getSessionFromCookie(req);
  const isAuthenticated = session !== null;

  // Redirect authenticated users away from AUTH pages only (not error pages).
  // The incoming `next` is attacker-controllable, so validate it and discard
  // anything that is not a same-origin relative path (R7.2, R7.3).
  const AUTH_PATHS = ['/login', '/reset', '/invite', '/verify'];
  if (isAuthenticated && AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    const requestedNext = req.nextUrl.searchParams.get('next');
    const target = safeNextOrHome(requestedNext);
    return NextResponse.redirect(new URL(target, req.url));
  }

  // Redirect unauthenticated users to login, preserving the original path as a
  // validated same-origin relative `next` value (R7.1, R7.3). An unparseable
  // session cookie surfaces here as `isAuthenticated === false` (R7.7).
  if (!isAuthenticated && !isPublic(pathname)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', safeNextOrHome(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Guard /admin/* for non-admin roles (cosmetic — server re-checks)
  if (isAuthenticated && pathname.startsWith(ADMIN_ONLY_PREFIX)) {
    if (!isAdminRole(session?.role)) {
      return NextResponse.redirect(new URL('/403', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static / _next/image
     * - favicon.ico
     * - Files with extensions (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
