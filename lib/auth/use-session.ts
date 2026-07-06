'use client';
/**
 * lib/auth/use-session.ts — client hook for current session user.
 *
 * Fetches /api/auth/me (which proxies GET /api/v1/auth/me with a server-side
 * Bearer token) so the raw access token is never visible in client JS.
 *
 * SESSION-END HANDLING (R6.5, client half):
 * When the server reports a hard session end (HTTP 401 from /api/auth/me — the
 * refresh token is invalid/expired and the cookie has already been cleared
 * server-side), this hook drops all client-side session state (clears the query
 * cache) and redirects to /login within ~1 s, preserving the original path in a
 * validated same-origin `next` parameter. Transient failures (HTTP 503) are
 * surfaced as a non-fatal error and DO NOT redirect, so a flaky backend never
 * bounces the user to the login page (R6.2).
 */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { safeNextOrHome } from './next-param';

export interface SessionUser {
  id: string;
  name: string;
  role: string;
  tenantId: string;
  storeIds: string[];
  permissions: string[];
  /**
   * True when the current session is a demo session (R2.1–R2.3). Surfaced from
   * the server `/api/auth/me` response — never carries tokens. Drives the
   * persistent Demo_Indicator. Absent/false on real sessions.
   */
  isDemo?: boolean;
}

export interface UseSessionResult {
  user: SessionUser | null;
  isLoading: boolean;
  isError: boolean;
}

/** Thrown when the server reports a hard session end (401), driving a redirect. */
class SessionEndedError extends Error {
  constructor() {
    super('Session ended');
    this.name = 'SessionEndedError';
  }
}

/** Guard so concurrent useSession consumers trigger the redirect only once. */
let redirecting = false;

async function fetchMe(): Promise<SessionUser> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) {
    // A 401 means the session is over (cookie already cleared server-side).
    // Any other status (e.g. 503 transient) is non-fatal — do not redirect.
    if (res.status === 401) throw new SessionEndedError();
    throw new Error('Could not load session');
  }
  const data = (await res.json()) as { user: SessionUser };
  return data.user;
}

export function useSession(): UseSessionResult {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data, isLoading, isError, error } = useQuery<SessionUser>({
    queryKey: ['session', 'me'],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000, // 5 min — revalidate silently in background
    retry: false,
  });

  useEffect(() => {
    if (!(error instanceof SessionEndedError)) return;
    if (redirecting) return;
    // Already on an auth page — nothing to redirect to.
    if (pathname && pathname.startsWith('/login')) return;
    redirecting = true;

    // Drop all client-side session state (R6.5).
    queryClient.clear();

    // Preserve the original path as a validated same-origin `next` (R7.1).
    const search = searchParams?.toString();
    const current = `${pathname ?? '/'}${search ? `?${search}` : ''}`;
    const next = safeNextOrHome(current);
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [error, pathname, searchParams, queryClient, router]);

  return {
    user: data ?? null,
    isLoading,
    isError,
  };
}

/** Client-side can() check — cosmetic only. Backend enforces. */
export function usePermission(permission: string): boolean {
  const { user } = useSession();
  return user?.permissions.includes(permission) ?? false;
}
