/**
 * lib/auth/session.ts — server-only session cookie helpers.
 *
 * Tokens are stored ONLY in an httpOnly + Secure + SameSite=Lax cookie.
 * They are NEVER exposed to client JS, localStorage, or the URL.
 * This module must only be imported from Server Components, Route Handlers,
 * or middleware — never from client components.
 */
import 'server-only';
import { cookies } from 'next/headers';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'radha_session';

/** Shape stored in the session cookie (JSON-serialised). */
export interface SessionPayload {
  accessToken: string;
  refreshToken: string;
  /** Unix timestamp (ms) when the access token expires. */
  expiresAt: number;
  /** Minimal user identity kept server-side so layouts can read role fast. */
  user: {
    id: string;
    name: string;
    role: string;
    tenantId: string;
    storeIds: string[];
    permissions: string[];
  };
}

/** Read and parse the session cookie. Returns null if absent or malformed; never throws. */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const store = await cookies();
    const raw = store.get(COOKIE_NAME)?.value;
    if (!raw) return null;
    return JSON.parse(raw) as SessionPayload;
  } catch {
    return null;
  }
}

/** Write the session cookie. Call only from Route Handlers after login/refresh. */
export async function setSession(payload: SessionPayload): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // Expire the cookie 30 days from now as a safety net; the token itself is shorter-lived.
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Clear the session cookie on logout or refresh failure. */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * True if the access token is about to expire (within 60 s).
 * Exact predicate: returns true iff `expiresAt - now < 60_000` ms.
 */
export function isTokenExpiringSoon(expiresAt: number, now: number = Date.now()): boolean {
  return expiresAt - now < 60_000;
}
