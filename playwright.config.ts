import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the dashboard's end-to-end / perf harness (D4).
 *
 * The specs live under `tests/` (kept out of the Vitest graph, which only
 * collects `app|components|features/**`), so the two runners never collide.
 *
 * To run locally:
 *   1. one-time: `npx playwright install chromium`
 *   2. start the app: `npm run build && npm run start` (or `npm run dev`)
 *   3. `npm run test:e2e`  (or `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e`)
 *
 * `webServer` is intentionally omitted: the perf thresholds (R5.1/R5.3) are
 * meaningful only against a production build, so the operator starts the
 * server explicitly rather than having Playwright spin up `next dev`.
 */
export default defineConfig({
  testDir: './tests',
  // Perf measurements must not contend for CPU — run serially.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
