// Feature: dashboard-production-ready, R7.6 layout redirect safety
/**
 * Component test for the (dash) server layout's redirect safety (Requirement 7.6).
 *
 * The layout (`DashLayout`) is an async Server Component that re-verifies the
 * session server-side BEFORE any Feature_Area data renders. On an invalid
 * (null/unparseable) session it must render no Feature_Area data and redirect to
 * `/login` carrying a validated, same-origin relative `next` (never a hostile
 * absolute/protocol-relative value).
 *
 * Because the component depends on Next's server primitives we mock:
 *  - `next/navigation` `redirect()` — records the target and throws a sentinel,
 *    matching Next's real "redirect throws to abort rendering" behaviour.
 *  - `next/headers` `headers()` — a controllable map exposing `x-pathname`.
 *  - `@/lib/auth/session` `getSession()` — returns null or a valid session.
 *  - `@/components/shell/dash-shell` — a marker stub so we can assert the shell
 *    (and therefore Feature_Area data) is NOT rendered when a redirect occurs.
 *
 * The pure validators (`safeNextOrHome` / `isAdminRole`) are left REAL so the
 * test exercises the genuine same-origin validation path.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isSafeNextPath } from '@/lib/auth/next-param';

// Mutable state shared with the hoisted module mocks below.
const state = vi.hoisted(() => ({
  headerValue: null as string | null,
  sessionValue: null as unknown,
  redirectCalls: [] as string[],
}));

// `redirect()` in Next throws internally to abort the render; emulate that with
// a sentinel that also carries a `digest` like the real implementation.
class RedirectSentinel extends Error {
  digest: string;
  constructor(url: string) {
    super('NEXT_REDIRECT');
    this.digest = `NEXT_REDIRECT;replace;${url};307;`;
  }
}

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    state.redirectCalls.push(url);
    throw new RedirectSentinel(url);
  },
}));

vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => (name === 'x-pathname' ? state.headerValue : null),
  }),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: async () => state.sessionValue,
}));

vi.mock('@/components/shell/dash-shell', () => ({
  DashShell: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'dash-shell' }, children),
}));

// Import AFTER the mocks are registered.
import DashLayout from './layout';

const FEATURE_MARKER = 'FEATURE_AREA_DATA';
const children = <div data-testid="feature-area">{FEATURE_MARKER}</div>;

/** Decode the `next` query value out of a `/login?next=...` redirect URL. */
function nextParamOf(loginUrl: string): string {
  const query = loginUrl.split('?')[1] ?? '';
  return new URLSearchParams(query).get('next') ?? '';
}

beforeEach(() => {
  state.headerValue = null;
  state.sessionValue = null;
  state.redirectCalls = [];
});

describe('(dash) layout — redirect safety (R7.6)', () => {
  it('null session: renders no Feature_Area data and redirects to /login with a validated same-origin next', async () => {
    state.sessionValue = null;
    state.headerValue = '/audit';

    // The layout must abort by redirecting (throwing the sentinel) — it must not
    // return any rendered tree.
    await expect(DashLayout({ children })).rejects.toBeInstanceOf(RedirectSentinel);

    // Exactly one redirect, targeting the login page.
    expect(state.redirectCalls).toHaveLength(1);
    const target = state.redirectCalls[0];
    expect(target.startsWith('/login?next=')).toBe(true);

    // The carried `next` is a valid same-origin relative path.
    const next = nextParamOf(target);
    expect(isSafeNextPath(next)).toBe(true);
    expect(next).toBe('/audit');

    // No Feature_Area data / shell was rendered before the redirect.
    expect(screen.queryByTestId('dash-shell')).toBeNull();
    expect(screen.queryByTestId('feature-area')).toBeNull();
    expect(screen.queryByText(FEATURE_MARKER)).toBeNull();
  });

  it('invalid (unparseable) session value is treated as no session and redirects', async () => {
    // getSession() returns null on malformed cookies; simulate a falsy session.
    state.sessionValue = null;
    state.headerValue = '/expiry';

    await expect(DashLayout({ children })).rejects.toBeInstanceOf(RedirectSentinel);

    const next = nextParamOf(state.redirectCalls[0]);
    expect(isSafeNextPath(next)).toBe(true);
    expect(next).toBe('/expiry');
    expect(screen.queryByTestId('dash-shell')).toBeNull();
  });

  it('hostile absolute path: next falls back to the safe default `/`, never the hostile value', async () => {
    state.sessionValue = null;
    state.headerValue = 'https://evil.com';

    await expect(DashLayout({ children })).rejects.toBeInstanceOf(RedirectSentinel);

    const next = nextParamOf(state.redirectCalls[0]);
    expect(next).toBe('/');
    expect(isSafeNextPath(next)).toBe(true);
    expect(next).not.toContain('evil.com');
  });

  it('hostile protocol-relative path: next falls back to the safe default `/`', async () => {
    state.sessionValue = null;
    state.headerValue = '//evil.com/steal';

    await expect(DashLayout({ children })).rejects.toBeInstanceOf(RedirectSentinel);

    const next = nextParamOf(state.redirectCalls[0]);
    // safeNextOrHome rejects protocol-relative values outright.
    expect(next).toBe('/');
    expect(isSafeNextPath('//evil.com/steal')).toBe(false);
    expect(next).not.toContain('evil.com');
  });

  it('unknown path: next falls back to the safe default `/`', async () => {
    state.sessionValue = null;
    state.headerValue = null; // header absent → pathname unknown

    await expect(DashLayout({ children })).rejects.toBeInstanceOf(RedirectSentinel);

    const next = nextParamOf(state.redirectCalls[0]);
    expect(next).toBe('/');
    expect(isSafeNextPath(next)).toBe(true);
  });

  it('valid session on a non-admin path: renders the shell with Feature_Area data and does not redirect', async () => {
    state.sessionValue = {
      accessToken: 't',
      refreshToken: 'r',
      expiresAt: Date.now() + 60_000,
      user: {
        id: 'u1',
        name: 'Manager',
        role: 'manager',
        tenantId: 'tenant-1',
        storeIds: ['s1'],
        permissions: [],
      },
    };
    state.headerValue = '/expiry';

    const tree = await DashLayout({ children });
    render(tree as React.ReactElement);

    expect(state.redirectCalls).toHaveLength(0);
    expect(screen.getByTestId('dash-shell')).toBeInTheDocument();
    expect(screen.getByTestId('feature-area')).toBeInTheDocument();
    expect(screen.getByText(FEATURE_MARKER)).toBeInTheDocument();
  });
});
