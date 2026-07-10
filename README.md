# Radha Dashboard

Next.js 15 admin dashboard for the RADHA platform. Owner and Admin roles:
KPI overview, expiry management, product moderation, settings.

Repo: `github.com/Shotlin/radha_dashboard`

Deployed at: `https://dash.radha.opslin.com` (EC2, port 3100, same compose
stack as the backend). Cloudflare DNS record (`dash` CNAME/A) must point to
`13.203.219.243` — the founder sets this manually.

## Architecture

BFF pattern — the dashboard's Next.js API Route Handlers proxy all requests
to the NestJS backend (`radha_backend`). No browser-to-backend CORS needed.
All backend responses are wrapped as `{success, data, meta}` by the backend's
global `ResponseInterceptor`; the `apiFetch` helper unwraps the envelope
before returning to callers.

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_API_BASE_URL (see below)
npm run dev   # → http://localhost:3001
```

## Environment variables

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL, e.g. `https://radha.opslin.com` for prod or `http://localhost:3000` for local dev |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional — Sentry DSN for error tracking. Leave blank to disable. |

No secrets belong here — all sensitive values live in the backend's
`.env.production`.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (outputs to `.next/`) |
| `npm run start` | Serve production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Deployment

Deployed as the `radha-dashboard` service in `docker-compose.selfhosted.yml`
on the EC2 host. The compose service reads from `.env.dashboard.production`
(created directly on the server, not committed).

To redeploy:
```bash
cd ~/radha_backend
git pull   # pulls compose + Dockerfile changes if any
docker compose -f docker-compose.selfhosted.yml --env-file .env.production up -d --build
```

## Admin login

Dashboard admin accounts use a separate email+password system (not the mobile
app's phone+OTP system). Account: `founder@radha.opslin.com`. If the password
needs to be reset, use the `src/db/create-first-admin.ts` script inside the
backend with `TS_NODE_TRANSPILE_ONLY=1`.

## Key directories

```
app/
  (auth)/          Login, invite-accept
  (dash)/          Authenticated shell — all dashboard screens
  api/             Route Handlers (server-side proxies to NestJS backend)
components/
  shell/           TopBar, Sidebar, StoreSwitcher
  ui/              shadcn/ui primitives
features/          Per-domain feature modules
lib/
  api/
    core/
      envelope.ts  parseBackendJson / parseBackendError — unwraps {success,data,meta}
      api-fetch.ts Central fetch helper (all API calls go through here)
    clients/       Per-domain typed clients
  auth/            Session helpers, RBAC (can / hasRole)
middleware.ts      Auth redirect guard
```
