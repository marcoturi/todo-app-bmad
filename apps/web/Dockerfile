# syntax=docker/dockerfile:1
# Build context MUST be the monorepo root so pnpm workspace can resolve @todo-app/shared

# ---- Build Stage ----
FROM node:24-alpine AS build

RUN corepack enable
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
# Root tsconfig is required: apps/web/tsconfig.app.json extends ../../tsconfig.json
COPY tsconfig.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Bake VITE_API_URL at build time (Vite replaces import.meta.env.VITE_* at build)
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @todo-app/web build

# ---- Production Stage ----
# nginx-unprivileged runs as user 'nginx' (UID 101) on port 8080 — no extra user setup needed
FROM nginxinc/nginx-unprivileged:alpine AS production

COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:8080/ || exit 1
