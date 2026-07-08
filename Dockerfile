# RADHA admin dashboard -- production image (Next.js 15, standalone output).
# Multi-stage: deps -> build -> lean runtime (only the traced output +
# static assets, no full node_modules in the final image).
#
# Build: docker build -t radha-dashboard .
# Run:   docker run -p 3100:3000 --env-file .env.dashboard.production radha-dashboard

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --legacy-peer-deps

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* vars are baked into the client bundle at build time, so
# they must be present here, not just at container-run time.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# .next/standalone already contains a minimal server.js + only the
# node_modules the traced pages actually import.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

USER node
EXPOSE 3000
CMD ["node", "server.js"]
