# RADHA Admin Dashboard

Private back-office web application for the **RADHA** retail-ops platform (Retail Assistant for Data, Health & Audits). Provides Owner and Admin roles with a unified command centre: KPI overview, expiry management, task assignment, inventory + GRN, suppliers, EAN audit, reports & exports, analytics, billing, notifications, settings, and an admin console.

Built with **Next.js 15 App Router**, TanStack Query, Zod, shadcn/ui, and Recharts, consuming the NestJS backend at `/api/v1`.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18.17.0 |
| npm | ≥ 9 (bundled with Node 18) |
| RADHA Backend | Running and reachable (see below) |

---

## Quick start

### 1. Clone and install

```bash
cd radha_dashboard
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Open .env.local and fill in the values (see Environment Variables table below)
```

### 3. Run in development

```bash
npm run dev
# → http://localhost:3001 (or next available port)
```

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server with hot reload |
| `npm run build` | Production build (outputs to `.next/`) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Run TypeScript type-check (`tsc --noEmit`) |
| `npm run lint` | Run ESLint (zero warnings enforced) |

---

## Environment variables

All variables are declared in `.env.example`. Copy it to `.env.local` and fill in real values.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | Base URL for the NestJS backend API, e.g. `http://localhost:3000/api/v1`. Embedded in the client bundle — no secrets here. |
| `SESSION_COOKIE_NAME` | ✅ | Name of the httpOnly session cookie set by the backend, e.g. `radha_session`. Used by Route Handlers to forward the session. |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Sentry project DSN for error tracking. Only the public DSN — never the auth token. Leave blank to disable Sentry. |

> **Never put secrets** (JWT signing keys, Razorpay secrets, AWS credentials) in `NEXT_PUBLIC_*` variables — those are embedded in the browser bundle. Backend secrets live in `radha_backend/.env`.

---

## Backend dependency

The dashboard is a pure front-end client. It makes all requests to the NestJS backend at the path configured in `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:3000/api/v1`).

**To run the full stack locally:**

1. Start Postgres on port **5433** (database `radha_dev`, user `radha`) and Redis on port **6380**.
2. `cd radha_backend && npm install && npm run start:dev` — starts the API process.
3. (Optional) `npm run start:worker` and `npm run start:scheduler` for background jobs and cron.
4. In a separate terminal: `cd radha_dashboard && npm run dev`.

See `radha_backend/README.md` for full backend setup instructions.

---

## Authentication

Session is managed via an **httpOnly, Secure, SameSite=Lax cookie** set by the backend on login. The dashboard never stores tokens in `localStorage` or exposes them to client JavaScript.

- Login page: `/login`
- On `401` from any API call, `apiFetch` automatically attempts a silent token refresh, then redirects to `/login` if refresh fails.
- Logout: `POST /api/auth/logout` (clears the cookie server-side).

No manual cookie configuration is needed in `.env.local` beyond setting `SESSION_COOKIE_NAME` to match what the backend sets.

---

## Role-based access

Five roles are supported. Access is enforced at three layers:

1. **Middleware** (`middleware.ts`) — redirects unauthenticated requests to `/login`.
2. **Server layout** — checks `can()` / `hasRole()` helpers from `lib/auth/rbac.ts`; renders a 403 page for unauthorised roles.
3. **API routes** — every Route Handler re-checks the session before proxying to the backend.

| Role | Primary access |
|---|---|
| `admin` | Full access including `/admin/*` console |
| `owner` | All operational screens + billing + analytics |
| `manager` | Overview, expiry, tasks, inventory, GRN, suppliers, audit, reports |
| `staff` | Overview, tasks, expiry (limited) |
| `auditor` | Audit / EAN lists, scan sessions, read-only reports |

---

## 🆕 Gated features (proposed backend)

Several enterprise screens are **built but gated** behind a "Needs Backend" banner — they display the real UI layout but require backend endpoints that have not yet been built. They never show fabricated data.

Gated screens include: Team Management, Audit Log Viewer, Platform Tenants, Cross-Store Compare, Scheduled Reports, Broadcasts, Invoice History, Global Search, Saved Views, and Alert Rules.

To enable a gated screen:
1. Build and deploy the corresponding NestJS module (see `phases/PROPOSED_BACKEND.md` for the full endpoint list and build order).
2. Remove the `<NeedsBackend>` wrapper from the screen component in `features/`.
3. Wire the component to the real API endpoint via the typed `lib/api/*` client.

---

## Architecture overview

```
radha_dashboard/
  app/                      # Next.js App Router (layouts, pages, route handlers)
    (auth)/                 # Login, password reset, invite accept
    (dash)/                 # Authenticated shell — all dashboard screens
    api/                    # Route Handlers (server-side API proxies)
    globals.css             # RADHA design tokens + Tailwind base
  components/
    shell/                  # TopBar, Sidebar, StoreSwitcher, ThemeToggle, etc.
    ui/                     # shadcn/ui primitives (Button, Dialog, Table, …)
    system/                 # Cross-cutting: NeedsBackend, ErrorBoundary, etc.
  features/                 # Per-domain feature modules (expiry, tasks, billing, …)
  lib/
    api/                    # Typed API client (apiFetch + per-domain hooks)
    auth/                   # Session helpers, RBAC (can / hasRole)
    design/                 # tokens.css (single source of design truth)
    query/                  # TanStack Query provider
    utils.ts                # cn() and shared utilities
  middleware.ts             # Auth redirect guard
  next.config.mjs           # Security headers (CSP, HSTS, X-Frame, …)
```

### Phase breakdown

| Phases | Area |
|---|---|
| 01–02 | Project scaffold, design system primitives |
| 03–05 | Auth/session, app shell, API client layer |
| 06–17 | All operational screens (overview → settings) |
| 18 | Enterprise features (gated, needs backend) |
| 19 | Hardening: dark mode, a11y, security headers, performance |
| 20 | Final QA + handover (this README) |

### Key libraries

| Library | Purpose |
|---|---|
| Next.js 15 App Router | Framework, server components, route handlers |
| TanStack Query 5 | Server-state caching, background refresh, pagination |
| Zod 3 | API response validation, form schemas |
| React Hook Form | Form state + validation wiring |
| shadcn/ui (Radix UI) | Accessible component primitives |
| Recharts 2 | Charts (bar, line, area, pie) |
| Tailwind CSS 3 | Utility styling (tokens via CSS vars) |
| lucide-react | Icon set |

---

## Notes

- **No backend modifications**: the dashboard is a pure front-end client. Never modify `radha_backend/` from this project.
- **Design tokens**: all colors, spacing, radii, and shadows are CSS custom properties defined in `lib/design/tokens.css`. Never use hardcoded hex values in components.
- **Dark mode**: the `ThemeToggle` in the top bar writes `data-theme="dark"` to `<html>` and persists the preference in `localStorage`. Falls back to `prefers-color-scheme` on first visit.
- **`npm audit`**: run periodically and resolve any high/critical advisories before deploying.
