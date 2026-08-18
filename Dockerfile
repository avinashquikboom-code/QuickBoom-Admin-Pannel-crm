# syntax=docker/dockerfile:1

# ============================================================================
# QuikBoom Admin Panel — Production Docker image (Next.js, standalone output)
#
# NEXT_PUBLIC_* vars are inlined into the client bundle at BUILD time, not
# read at container start — they must be passed as build args. api.qbapp.online
# and admin.qbapp.online are separate subdomains (see deploy/docker/nginx/),
# so this is a genuine cross-origin URL — the backend's CORS is already
# permissive (app.enableCors({ origin: true, credentials: true }) in main.ts).
# ============================================================================

FROM node:20-alpine AS base
WORKDIR /app

# ---------- Stage: install deps ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Stage: build ----------
FROM deps AS build
COPY . .
ARG NEXT_PUBLIC_API_BASE_URL=https://api.qbapp.online/api/v1
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- Stage: production runtime ----------
FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/ || exit 1

CMD ["node", "server.js"]
