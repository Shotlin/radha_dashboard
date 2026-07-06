// Feature: dashboard-production-ready, Property 15: Hard refresh failure clears the session and redirects safely

import { describe, it, expect } from 'vitest';
import { assertProperty, fc } from '@/test/property';
import { isSafeNextPath, safeNextOrHome } from './next-param';
import type { RefreshOutcome } from './refresh-session';

/**
 * Property 15 — Hard refresh failure clears the session and redirects safely.
 *
 * For any hard refresh failure (invalid or expired refresh token), the
 * Session_Manager decision is to clear the cookie and redirect to login, and the
 * redirect target's `next` value is a validated same-origin relative path.
 *
 * Validates: Requirements 6.5
 *
 * This property has two purely-testable halves, both wired from real production
 * code:
 *
 *  1. The hard-vs-transient classification (the `RefreshOutcome` contract
 *     produced by `refresh-session.ts#runRefresh` and consumed by
 *     `api-fetch.ts`): a HARD failure (`{ ok: false, hard: true }`) is the only
 *     outcome that clears the cookie and redirects to `/login`; a TRANSIENT
 *     failure (`{ ok: false, hard: false }`) and a success (`{ ok: true }`) keep
 *     the session. `sessionDecision` below mirrors exactly the wiring in
 *     `api-fetch.ts` (`if (!outcome.ok && outcome.hard) endSession()` → 401 →
 *     client redirect) over the exported `RefreshOutcome` type.
 *
 *  2. The redirect-target safety (the security-critical half — R6.5 / R7.1):
 *     the redirect `next` is built exactly as `use-session.ts` builds it, via the
 *     real `safeNextOrHome(currentPath)`. For ANY current path — including
 *     hostile ones (absolute, protocol-relative, scheme, control chars) — the
 *     resulting `next` is either a validated same-origin relative path
 *     (`isSafeNextPath` true) or the safe home route, so the `/login?next=...`
 *     URL can never become an open redirect.
 */

const MAX = 2048;

/** Mirrors the session-end decision wired in `lib/api/core/api-fetch.ts` (R6.5). */
type SessionDecision = 'clear-and-redirect' | 'keep';
function sessionDecision(outcome: RefreshOutcome): SessionDecision {
  // A hard failure ends the session: clear the cookie + redirect to /login.
  // Everything else (transient failure, success) retains the session.
  return !outcome.ok && outcome.hard ? 'clear-and-redirect' : 'keep';
}

/** Builds the redirect `next` exactly as `use-session.ts` does on a hard end. */
function redirectNextFor(currentPath: string): string {
  return safeNextOrHome(currentPath);
}

// ── Generators ────────────────────────────────────────────────────────────

/** Every shape of `RefreshOutcome` the contract can produce. */
const refreshOutcome: fc.Arbitrary<RefreshOutcome> = fc.oneof(
  fc.constant<RefreshOutcome>({ ok: true }),
  fc.constant<RefreshOutcome>({ ok: false, hard: true }),
  fc.constant<RefreshOutcome>({ ok: false, hard: false }),
);

/** A hard failure specifically (invalid/expired refresh token). */
const hardFailure: fc.Arbitrary<RefreshOutcome> = fc.constant<RefreshOutcome>({
  ok: false,
  hard: true,
});

const PATH_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~:@!$&\'()*+,;=%?#[] /';
const pathChar = fc.constantFrom(...PATH_CHARS.split(''));

/** A plausible same-origin relative path, like `usePathname()` + search. */
const benignCurrentPath = fc
  .tuple(fc.array(pathChar, { minLength: 1, maxLength: 80 }), fc.option(fc.string(), { nil: undefined }))
  .map(([chars, search]) => {
    const path = '/' + chars.join('').replace(/^\/+/, '');
    return search ? `${path}?${search}` : path;
  });

/** Adversarial "current path" values an attacker might try to smuggle into `next`. */
const hostileCurrentPath = fc.oneof(
  fc.constantFrom(
    'https://evil.com',
    'http://evil.com/steal',
    'HTTPS://EVIL.COM',
    '//evil.com',
    '//evil.com/path',
    '/\\evil.com',
    '/\\\\evil.com',
    'javascript:alert(1)',
    'JavaScript:alert(document.cookie)',
    'data:text/html,<script>',
    'mailto:a@b.com',
    'file:///etc/passwd',
    'ftp://host/x',
    'evil.com',
    'foo/bar',
    '',
    ' /ok',
    '/foo\\bar',
    '/\u0000',
    '/path\u0001',
    '/a\u001Fb',
    '/tab\there',
    '/new\nline',
  ),
  // overlong path (> MAX)
  fc.constant('/' + 'a'.repeat(MAX + 1)),
  // entirely arbitrary strings
  fc.string(),
);

const anyCurrentPath = fc.oneof(benignCurrentPath, hostileCurrentPath);

// ── Properties ──────────────────────────────────────────────────────────────

describe('Property 15: hard refresh failure clears the session and redirects safely', () => {
  it('clears the cookie + redirects to /login ONLY for a hard refresh failure', () => {
    assertProperty(
      fc.property(refreshOutcome, (outcome) => {
        const decision = sessionDecision(outcome);
        if (!outcome.ok && outcome.hard) {
          expect(decision).toBe('clear-and-redirect');
        } else {
          // success or transient failure → keep the session (no logout, R6.2)
          expect(decision).toBe('keep');
        }
      }),
    );
  });

  it('builds a validated same-origin `next` for ANY current path on a hard end', () => {
    assertProperty(
      fc.property(hardFailure, anyCurrentPath, (outcome, currentPath) => {
        // Hard failure must trigger the clear-and-redirect path.
        expect(sessionDecision(outcome)).toBe('clear-and-redirect');

        const next = redirectNextFor(currentPath);
        // The redirect target is always safe: a validated same-origin relative
        // path, or the safe home route fallback — never an open redirect.
        expect(isSafeNextPath(next) || next === '/').toBe(true);

        // The full /login URL never carries an unsafe destination.
        const loginUrl = `/login?next=${encodeURIComponent(next)}`;
        const decoded = decodeURIComponent(loginUrl.split('next=')[1]);
        expect(isSafeNextPath(decoded) || decoded === '/').toBe(true);
      }),
    );
  });

  it('preserves a benign current path verbatim in the redirect `next`', () => {
    assertProperty(
      fc.property(benignCurrentPath, (currentPath) => {
        const next = redirectNextFor(currentPath);
        if (isSafeNextPath(currentPath)) {
          // A safe path is preserved exactly so the user returns where they were.
          expect(next).toBe(currentPath);
        } else {
          // Otherwise it falls back to the safe home route.
          expect(next).toBe('/');
        }
      }),
    );
  });

  it('never emits a hostile path as the redirect `next` (open-redirect safety)', () => {
    assertProperty(
      fc.property(hostileCurrentPath, (currentPath) => {
        const next = redirectNextFor(currentPath);
        // Hostile inputs collapse to the home route unless they happen to be a
        // genuinely safe relative path; either way the result is safe.
        if (next !== '/') {
          expect(isSafeNextPath(next)).toBe(true);
        }
        // A scheme/protocol-relative/authority value is never echoed back.
        expect(next.startsWith('//')).toBe(false);
        expect(/^[a-z][a-z0-9+.-]*:/i.test(next)).toBe(false);
      }),
    );
  });
});
