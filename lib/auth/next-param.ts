/**
 * lib/auth/next-param.ts — pure validation for `next` redirect targets.
 *
 * The single source of truth for what counts as a safe redirect target. These
 * functions are pure (no I/O, no server-only dependencies) so they can run in
 * middleware, route handlers, server components, and tests alike.
 *
 * A safe `next` value is a same-origin relative path: a single leading `/`,
 * never protocol-relative (`//`, `/\`), never carrying a scheme or authority,
 * free of control characters, and at most 2048 characters long. This blocks
 * open-redirect attacks where an attacker supplies `//evil.com` or
 * `https://evil.com` as the post-login destination.
 */

/** Maximum permitted length of a `next` redirect target. */
const MAX = 2048;

/**
 * True iff `value` is a same-origin relative path (R7.1).
 *
 * The value must:
 * - be present (non-empty),
 * - be at most {@link MAX} characters long,
 * - begin with a single `/` (relative path),
 * - not begin with `//` or `/\` (protocol-relative URLs),
 * - contain no scheme component (e.g. `https:`, `javascript:`),
 * - contain no control characters or backslashes that a browser might
 *   normalize into an authority component.
 */
export function isSafeNextPath(value: string | null | undefined): boolean {
  if (!value) return false;
  if (value.length > MAX) return false;
  if (!value.startsWith('/')) return false; // must be relative, leading single slash
  if (value.startsWith('//') || value.startsWith('/\\')) return false; // no protocol-relative
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false; // no scheme
  // reject control chars / backslashes that browsers may normalize to authority
  if (/[\u0000-\u001F\\]/.test(value)) return false;
  return true;
}

/**
 * Returns `value` when it is a safe same-origin relative path, else the default
 * home route (R7.3). Used everywhere a `next` value reaches a redirect so an
 * absent or hostile value can never leak out as an open redirect.
 */
export function safeNextOrHome(value: string | null | undefined, home = '/'): string {
  return isSafeNextPath(value) ? (value as string) : home;
}
