# syntax=docker/dockerfile:1
# Build context MUST be the monorepo root so pnpm workspace can resolve @todo-app/shared

# ---- Base ----
# Node 24 Alpine for small image size; native TS execution (no build step needed)
FROM node:24-alpine AS base

RUN corepack enable
WORKDIR /app

# ---- Dependencies ----
# Install all workspace deps using the root lockfile, then use pnpm deploy
# to produce a self-contained production directory with symlinks fully resolved
FROM base AS deps

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# Copy source
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/
COPY tsconfig.json ./
COPY apps/api/scripts/patch-shared-exports.mjs ./apps/api/scripts/

# Build @todo-app/shared to JS so Node can load it from node_modules without TS stripping.
# shared/tsconfig.json has allowImportingTsExtensions=true and noEmit=true, so
# we override those flags for a one-off emit-enabled compilation.
RUN pnpm exec tsc \
      --project packages/shared/tsconfig.json \
      --noEmit false \
      --allowImportingTsExtensions false \
      --outDir packages/shared/dist \
      --declaration false \
      --declarationMap false \
      --skipLibCheck

# Patch shared package.json exports to point to compiled JS in dist/
RUN node apps/api/scripts/patch-shared-exports.mjs

# pnpm deploy creates /prod/api with resolved prod deps and source — no symlinks
# --legacy flag required for pnpm v10+ without inject-workspace-packages
RUN pnpm --filter @todo-app/api deploy --legacy --prod /prod/api

# ---- Production ----
FROM base AS production

# dumb-init for proper PID 1 signal forwarding
# dbmate for running SQL migrations at container startup
RUN apk add --no-cache dumb-init && \
    wget -qO /usr/local/bin/dbmate \
      https://github.com/amacneil/dbmate/releases/download/v2.31.0/dbmate-linux-amd64 && \
    echo "a5cde18ce35ce053cecab1e15a72f8a41f7715380e9b9a8a81d065dca7201567  /usr/local/bin/dbmate" | sha256sum -c - && \
    chmod +x /usr/local/bin/dbmate

ENV NODE_ENV=production
# Bind to all interfaces so the container is reachable from the Docker network
ENV HOST=0.0.0.0
# OpenTelemetry disabled by default; set to "false" and configure
# OTEL_EXPORTER_OTLP_ENDPOINT to enable telemetry export.
ENV OTEL_SDK_DISABLED=true

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S fastify -u 1001 -G nodejs

# Copy self-contained deployment from deploy stage
COPY --from=deps /prod/api ./

# Copy DB migrations (needed by dbmate at runtime)
COPY apps/api/db ./db

# Copy healthcheck script (shared with docker-compose.yml healthcheck)
COPY apps/api/scripts/healthcheck.mjs ./scripts/healthcheck.mjs

# Copy and install the startup entrypoint script
COPY apps/api/scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER fastify

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "scripts/healthcheck.mjs"]

ENTRYPOINT ["dumb-init", "--", "docker-entrypoint.sh"]
CMD ["node", "--import", "./src/instrumentation.ts", "./src/index.ts"]
