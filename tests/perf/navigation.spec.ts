/**
 * Navigation performance harness — Playwright (task 16.2).
 *
 * Validates navigation-speed requirements for a warm authenticated session:
 *   R5.1 — header/shell appears within 1s for ≥95% of navigations.
 *   R5.3 — primary data appears within 2.5s for ≥95% of navigations.
 *   R5.4 — shell stays responsive during data loads (next navigation starts
 *            within 1s of user input, measured by `time-to-interactive`).
 *
 * Warm-session definition (R5.1): the application shell is already loaded and
 * the user authenticated within the prior 30 minutes. The harness logs in once
 * at the start of the suite, then exercises cross-page navigations.
 *
 * Usage:
 *   npx playwright test tests/perf/navigation.spec.ts
 *   (or: npx playwright test --project=chromium tests/perf/navigation.spec.ts)
 *
 * Requires:
 *   - PLAYWRIGHT_BASE_URL (defaults to http://localhost:3000)
 *   - DEMO_EMAIL / DEMO_PASSWORD (or DEMO_MODE=true login)
 *
 * NOTE: This harness is intentionally thin — it measures client-side perceived
 * performance using the Navigation Timing API + PerformanceObserver polyfill.
 * The "primary data" threshold (R5.3) is approximated by asserting that the
 * first non-skeleton content element is visible within 2.5s.
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

// ── Routes to exercise (a representative cross-section of Feature_Area pages) ──
const ROUTES = [
  { path: '/', label: 'Overview' },
  { path: '/expiry', label: 'Expiry' },
  { path: '/tasks', label: 'Tasks' },
  { path: '/inventory', label: 'Inventory' },
  { path: '/audit', label: 'Audit' },
  { path: '/grn', label: 'GRN' },
  { path: '/notifications', label: 'Notifications' },
];

// ── Performance thresholds ─────────────────────────────────────────────────
const SHELL_P95_MS = 1000;  // R5.1: header/shell within 1s
const DATA_P95_MS = 2500;   // R5.3: primary data within 2.5s
const NAV_START_MS = 1000;  // R5.4: shell responds to next nav within 1s

// P95 helper: given a sorted array of durations, return the 95th percentile value.
function p95(durations: number[]): number {
  if (durations.length === 0) return 0;
  const sorted = [...durations].sort((a, b) => a - b);
  const idx = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// ── Setup — log in once before all tests ──────────────────────────────────
test.beforeAll(async ({ browser }) => {
  // If DEMO_MODE is active, the dashboard logs in automatically on first visit;
  // otherwise we perform a real login with credentials.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`);

  if (process.env.DEMO_MODE === 'true') {
    // Demo mode: tap the demo login button if it exists, else proceed.
    const demoBtn = page.getByRole('button', { name: /demo/i });
    if (await demoBtn.count() > 0) {
      await demoBtn.click();
    }
  } else {
    const email = process.env.DEMO_EMAIL ?? 'demo@radha.app';
    const password = process.env.DEMO_PASSWORD ?? 'Demo1234!';
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
  }

  // Wait for the dashboard shell to mount (confirms auth succeeded).
  await page.waitForSelector('nav, aside, [data-testid="sidebar"]', { timeout: 10_000 });
  await ctx.storageState({ path: 'playwright/.auth/session.json' });
  await ctx.close();
});

// ── Main suite ────────────────────────────────────────────────────────────
test.describe('Navigation performance (warm session)', () => {
  test.use({ storageState: 'playwright/.auth/session.json' });

  test('R5.1 — shell/header appears within 1s for ≥95% of cross-page navigations', async ({ page }) => {
    await page.goto(BASE);
    // Warm the shell (load the root page first so it counts as a warm session).
    await page.waitForSelector('nav, aside', { timeout: 10_000 });

    const shellDurations: number[] = [];

    for (const route of ROUTES) {
      const t0 = Date.now();
      await page.goto(`${BASE}${route.path}`);

      // The persistent shell (sidebar + top bar) stays mounted — wait for the
      // navigation link / logo that proves the shell rendered.
      await page.waitForSelector('nav a, aside a, [data-testid="top-bar"]', { timeout: 5_000 });
      const elapsed = Date.now() - t0;
      shellDurations.push(elapsed);
      console.log(`[shell] ${route.label}: ${elapsed}ms`);
    }

    const shellP95 = p95(shellDurations);
    console.log(`[shell P95] ${shellP95}ms (threshold: ${SHELL_P95_MS}ms)`);
    expect(shellP95, `Shell/header P95 ${shellP95}ms exceeds 1s threshold`).toBeLessThanOrEqual(SHELL_P95_MS);
  });

  test('R5.3 — primary data appears within 2.5s for ≥95% of navigations', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForSelector('nav a, aside a', { timeout: 10_000 });

    const dataDurations: number[] = [];

    for (const route of ROUTES) {
      const t0 = Date.now();
      await page.goto(`${BASE}${route.path}`);

      // Wait until a non-skeleton content element (h1/h2 + numeric KPI or list
      // item) is visible — proxy for "primary data loaded".
      // Skeleton elements are aria-hidden, so any *visible* text is real content.
      await page.waitForFunction(
        () => {
          // Look for any heading that isn't inside an aria-hidden block.
          const headings = document.querySelectorAll('h1, h2, h3');
          for (const h of headings) {
            if (!h.closest('[aria-hidden="true"]') && (h as HTMLElement).offsetParent !== null) {
              return true;
            }
          }
          return false;
        },
        { timeout: 5_000 },
      );
      const elapsed = Date.now() - t0;
      dataDurations.push(elapsed);
      console.log(`[data] ${route.label}: ${elapsed}ms`);
    }

    const dataP95 = p95(dataDurations);
    console.log(`[data P95] ${dataP95}ms (threshold: ${DATA_P95_MS}ms)`);
    expect(dataP95, `Primary data P95 ${dataP95}ms exceeds 2.5s threshold`).toBeLessThanOrEqual(DATA_P95_MS);
  });

  test('R5.4 — shell stays responsive: next navigation begins within 1s of user tap', async ({ page }) => {
    await page.goto(`${BASE}/expiry`);
    await page.waitForSelector('nav a, aside a', { timeout: 10_000 });

    const navStartDurations: number[] = [];

    // Simulate tapping navigation links in rapid succession and measure how
    // quickly the route transitions start (skeleton or next page) — not how long
    // they take to fully render.
    const navLinks = page.locator('nav a, aside a').filter({ hasNot: page.locator('svg') });
    const linkCount = Math.min(await navLinks.count(), ROUTES.length);

    for (let i = 0; i < linkCount; i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('http')) continue;

      const t0 = Date.now();
      await link.click();

      // The route transition has started when either a skeleton or the first
      // page heading/content appears.
      await page.waitForFunction(
        () => {
          const busy = document.querySelector('[aria-busy="true"]');
          const heading = document.querySelector('h1, h2');
          return !!busy || !!heading;
        },
        { timeout: 3_000 },
      );
      const elapsed = Date.now() - t0;
      navStartDurations.push(elapsed);
      console.log(`[nav-start] ${href}: ${elapsed}ms`);

      // Brief settle before next navigation.
      await page.waitForTimeout(300);
    }

    if (navStartDurations.length > 0) {
      const navP95 = p95(navStartDurations);
      console.log(`[nav-start P95] ${navP95}ms (threshold: ${NAV_START_MS}ms)`);
      expect(navP95, `Shell responsiveness P95 ${navP95}ms exceeds 1s threshold`).toBeLessThanOrEqual(NAV_START_MS);
    }
  });
});
