# Story 3.5: Docker Containerisation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the full application stack containerised with Docker Compose,
so that the entire app (frontend, backend, and database) can be started with a single `docker compose up` command in any environment.

## Acceptance Criteria

1. **Given** a `Dockerfile` is created in `apps/api`, **When** it is built, **Then** it uses a multi-stage build: a build/install stage and a lean production stage. **And** the production image runs as a non-root user. **And** the image exposes the correct port (3000) and starts the Fastify server via the configured start command. **And** a `HEALTHCHECK` instruction is included that polls `GET /health` to report container health.

2. **Given** a `Dockerfile` is created in `apps/web`, **When** it is built, **Then** it uses a multi-stage build: a Node build stage (runs `pnpm build`) and an Nginx production stage that serves the built static assets. **And** the production image runs as a non-root user. **And** the Nginx configuration proxies `/api/` requests to the backend container. **And** a `HEALTHCHECK` instruction is included.

3. **Given** the root `docker-compose.yml` is updated, **When** `docker compose up` is run from the monorepo root, **Then** three services start: `postgres`, `api`, and `web`. **And** the `api` service depends on `postgres` being healthy before starting. **And** the `web` service depends on `api` being healthy before starting. **And** the `postgres` service uses a named volume for data persistence across restarts. **And** all inter-service communication uses Docker internal networking — no hardcoded `localhost` references between containers.

4. **Given** environment configuration is needed for each service, **When** `docker-compose.yml` references environment variables, **Then** a root-level `.env.example` documents all required variables for the compose stack: `DATABASE_URL`, `FRONTEND_URL`, `VITE_API_URL`, and `POSTGRES_*` credentials. **And** sensitive values are never hardcoded in `docker-compose.yml` — they are sourced from environment variables or a `.env` file.

5. **Given** a developer clones the repository on a clean machine, **When** they copy `.env.example` to `.env` and run `docker compose up --build`, **Then** the full stack builds and starts successfully with no manual intervention. **And** the frontend is accessible at `http://localhost:80`. **And** the backend API is accessible at `http://localhost:3000/api/v1/todos`. **And** `docker compose logs` shows structured logs from all three services with no fatal errors.

6. **Given** a `test` compose profile or override is defined, **When** `docker compose --profile test up` is run, **Then** the stack starts in a configuration suitable for running E2E tests.

## Tasks / Subtasks

- [ ] Task 1: Verify and finalize `apps/api/Dockerfile` (AC: #1)
  - [ ] 1.1 Review the existing `apps/api/Dockerfile` (already created in Story 1.2) — multi-stage base→deps→production, non-root user `fastify/nodejs`, port 3000, `dumb-init`, HEALTHCHECK at `/health`. Confirm all AC #1 requirements are satisfied.
  - [ ] 1.2 Verify the CMD uses the production start form (no `--env-file` flag, uses dumb-init): `CMD ["dumb-init", "node", "--import", "./src/instrumentation.ts", "./src/index.ts"]` — this is correct for Docker where env vars are injected via compose, not .env files.
  - [ ] 1.3 Confirm `HOST=0.0.0.0` and `PORT=3000` are set (or defaulted) so Fastify binds on all interfaces, not just localhost.
  - [ ] 1.4 If any gap is found, patch the Dockerfile accordingly. Otherwise, no changes needed.

- [ ] Task 2: Create `apps/web/Dockerfile` (AC: #2)
  - [ ] 2.1 Create the Dockerfile with a two-stage build. Build context will be the monorepo root (required for pnpm workspace to resolve `@todo-app/shared`).
  - [ ] 2.2 **Build stage** (`node:24-alpine`): enable corepack, copy root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, copy `packages/shared/package.json` and `apps/web/package.json`, run `pnpm install --frozen-lockfile`, copy source code (`packages/shared/src`, `apps/web/src`, etc.), accept `VITE_API_URL` as a `ARG`/`ENV` build argument (default `http://localhost:3000`), run `pnpm --filter @todo-app/web build`.
  - [ ] 2.3 **Production stage** (`nginxinc/nginx-unprivileged:alpine`): copy built dist from `apps/web/dist` into `/usr/share/nginx/html`, copy `apps/web/nginx.conf` to `/etc/nginx/conf.d/default.conf`. The `nginx-unprivileged` image already runs as non-root user `nginx` (UID 101) on port 8080 — no extra user setup required.
  - [ ] 2.4 Add a HEALTHCHECK: `CMD ["wget", "-q", "-O", "/dev/null", "http://localhost:8080/"]`
  - [ ] 2.5 Expose port 8080 (the unprivileged nginx port). In docker-compose this is mapped to host port 80 via `ports: - "80:8080"`.

- [ ] Task 3: Create `apps/web/nginx.conf` (AC: #2)
  - [ ] 3.1 Create an nginx server block listening on port 8080 (matching the unprivileged image default).
  - [ ] 3.2 Configure root at `/usr/share/nginx/html` with index `index.html`.
  - [ ] 3.3 Add SPA fallback: `try_files $uri $uri/ /index.html` so React Router client-side routes work on refresh.
  - [ ] 3.4 Add API proxy location: `location /api/ { proxy_pass http://api:3000/api/; proxy_http_version 1.1; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_read_timeout 30s; }` — uses Docker internal service name `api` (NOT `localhost`).
  - [ ] 3.5 Add `gzip on` for text assets and set `server_tokens off` (recommended security hardening).

- [ ] Task 4: Update root `docker-compose.yml` (AC: #3, #4, #5)
  - [ ] 4.1 Keep the existing `postgres` service unchanged (image postgres:17-alpine, named volume `postgres_data`, healthcheck already present).
  - [ ] 4.2 Add `api` service:
    - `build: { context: ./apps/api, dockerfile: Dockerfile }`
    - `environment`: `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT=3000`, `DATABASE_URL=postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-todos}?sslmode=disable`, `FRONTEND_URL=${FRONTEND_URL:-http://localhost:80}`, `OTEL_SDK_DISABLED=true`
    - `ports: - "3000:3000"`
    - `depends_on: { postgres: { condition: service_healthy } }`
    - Container-level `healthcheck` (polling `/health`): `test: ["CMD", "node", "-e", "fetch('http://localhost:3000/health').then(r=>{if(!r.ok)throw r}).catch(()=>process.exit(1))"]`, interval 30s, timeout 5s, retries 3, start_period 15s
    - Use Docker internal hostname `postgres` (never `localhost`) for DATABASE_URL
  - [ ] 4.3 Add `web` service:
    - `build: { context: ., dockerfile: apps/web/Dockerfile, args: { VITE_API_URL: "${VITE_API_URL:-http://localhost:3000}" } }`
    - `ports: - "80:8080"`
    - `depends_on: { api: { condition: service_healthy } }`
    - Container-level `healthcheck`: `test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://localhost:8080/"]`, interval 30s, timeout 5s, retries 3, start_period 10s
  - [ ] 4.4 Add a `test` profile override to the `web` and `api` services so `docker compose --profile test up` starts the stack in a test-friendly configuration (e.g., `POSTGRES_DB=todos_test`).

- [ ] Task 5: Create root `.env.example` (AC: #4, #5)
  - [ ] 5.1 Create `/.env.example` at the monorepo root documenting all variables needed for `docker compose up`:
    ```
    # PostgreSQL credentials (used by postgres service and api service)
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=postgres
    POSTGRES_DB=todos

    # API service
    FRONTEND_URL=http://localhost:80

    # Web service (build arg — baked into the frontend bundle at image build time)
    VITE_API_URL=http://localhost:3000
    ```
  - [ ] 5.2 Ensure `/.env.example` is committed to the repo but `/.env` is in `.gitignore`.

- [ ] Task 6: Verify full stack with `docker compose up --build` (AC: #5)
  - [ ] 6.1 Copy root `.env.example` to `.env` at root.
  - [ ] 6.2 Run `docker compose build --no-cache` from monorepo root — confirm all three services build with zero errors.
  - [ ] 6.3 Run `docker compose up -d` — confirm all three services reach healthy status via `docker compose ps`.
  - [ ] 6.4 Verify `curl http://localhost:3000/api/v1/todos` returns `200 OK` with a JSON array.
  - [ ] 6.5 Verify the frontend is accessible at `http://localhost:80` (open in browser or `curl -o /dev/null -w "%{http_code}" http://localhost:80`).
  - [ ] 6.6 Run `docker compose logs --tail=50` — confirm structured Pino JSON logs from `api` and nginx access logs from `web`, no fatal errors.
  - [ ] 6.7 Run `docker compose down -v` when done to clean up.

- [ ] Task 7: Run existing CI checks to confirm no regressions (All AC)
  - [ ] 7.1 Run `pnpm --filter apps/api check` — zero Biome violations.
  - [ ] 7.2 Run `pnpm --filter @todo-app/web check` — zero Biome violations.
  - [ ] 7.3 Confirm `docker-compose.yml` is valid YAML with `docker compose config`.

## Dev Notes

### What Already Exists — DO NOT Recreate

| Item | Location | Notes |
|------|----------|-------|
| API `Dockerfile` | `apps/api/Dockerfile` | Created in Story 1.2; multi-stage, non-root user `fastify`, dumb-init, HEALTHCHECK at `/health`. **Verify only, do NOT rewrite unless a gap is found.** |
| `docker-compose.yml` | `/docker-compose.yml` | Already has `postgres` service with healthcheck and named volume. **Extend with `api` and `web` services — do NOT recreate** |
| `apps/api/.env.example` | `apps/api/.env.example` | Local dev env vars. Keep as-is. Docker uses inject-by-environment, not .env file. |
| `apps/web/.env.example` | `apps/web/.env.example` | Local dev env vars with `VITE_API_URL=http://localhost:3000`. Keep as-is. |
| `/health` route | `apps/api/src/` | Already implemented in Story 1.2; returns `{ status: "ok" }`. API Dockerfile HEALTHCHECK polls it. |

### Monorepo Docker Build Strategy for `apps/web`

The web app depends on `@todo-app/shared` (a pnpm workspace package). The Docker build context **must be the monorepo root** so that:
- `pnpm-workspace.yaml` is available (declares workspace members)
- `packages/shared/` is included in the build context
- `pnpm install` resolves the workspace dependency correctly

The `build.context` in docker-compose must therefore be `.` (monorepo root), not `./apps/web`.

**Pattern for web Dockerfile build stage:**
```dockerfile
# syntax=docker/dockerfile:1

# ---- Build Stage ----
FROM node:24-alpine AS build

RUN corepack enable
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
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
FROM nginxinc/nginx-unprivileged:alpine AS production

COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:8080/ || exit 1
```

Note: `nginxinc/nginx-unprivileged:alpine` runs nginx as user `nginx` (UID 101) on port 8080 out of the box — no manual user setup needed. docker-compose maps `80:8080`.

### VITE_API_URL: Build-time vs Runtime

**Critical**: Vite env vars (`VITE_*`) are **baked into the JS bundle at build time**, not injected at runtime. This means:
- You cannot change `VITE_API_URL` after the image is built.
- In docker-compose, `VITE_API_URL` is passed as a Docker **build arg** (`args:`), not a container environment variable.
- The nginx proxy for `/api/` is included in `nginx.conf` as a secondary path (satisfies AC and enables zero-config production deploys where `VITE_API_URL` could be set to `""` making the SPA use relative URLs).

### Nginx Configuration Notes

```nginx
server {
    listen 8080;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
    server_tokens off;

    # API reverse proxy — uses Docker internal hostname 'api'
    location /api/ {
        proxy_pass http://api:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 30s;
    }

    # SPA fallback — React Router client-side routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Do NOT use `localhost` in `proxy_pass`** — Docker Compose internal networking resolves service names (e.g., `api`) as hostnames.

### Docker Compose Service Dependency Chain

```
postgres (healthcheck: pg_isready) → api (healthcheck: curl /health) → web (healthcheck: wget /)
         ↪ api.depends_on: postgres (healthy)
                   ↪ web.depends_on: api (healthy)
```

This ensures:
1. Postgres is healthy before the API starts (avoids startup race conditions)
2. The API is healthy before the web container starts (nginx proxy ready)

### Inter-Service Networking

| From service | To service | Correct URL | Wrong (do NOT use) |
|---|---|---|---|
| `api` → `postgres` | `DATABASE_URL` | `postgresql://...@postgres:5432/todos` | `@localhost:5432` |
| nginx (`web`) → `api` | `proxy_pass` | `http://api:3000/api/` | `http://localhost:3000` |
| browser → `api` | VITE_API_URL | `http://localhost:3000` (host port) | `http://api:3000` (not accessible from browser) |

Docker Compose creates an internal network and resolves service names as hostnames. Only the browser is outside Docker, so it uses `localhost` + the exposed host port.

### Existing API Dockerfile Verification Checklist

The `apps/api/Dockerfile` already exists. Before doing any work, verify:
- [ ] Multi-stage build: `base` → `deps` → `production` stages present ✅ (already confirmed)
- [ ] Non-root user: `fastify` user (UID 1001), group `nodejs` ✅ (already confirmed)
- [ ] Port 3000 exposed via `EXPOSE 3000` ✅ (already confirmed)
- [ ] `dumb-init` for PID 1 signal forwarding ✅ (already confirmed)
- [ ] `HOST=0.0.0.0` set so Fastify binds on all interfaces (not just 127.0.0.1) — **verify this**
- [ ] HEALTHCHECK polls `/health` endpoint ✅ (already confirmed)
- [ ] CMD does NOT use `--env-file` (env injected by compose, not .env file) — **verify this**

If all pass: no changes needed to `apps/api/Dockerfile`.

### Previous Story Learnings (Story 3.4 — Mobile Responsive Layout)

Story 3.4 is currently `in-progress`. No learnings to incorporate from a completed story. However:
- The frontend build (`pnpm --filter @todo-app/web build`) must succeed before building the web Docker image. Ensure Story 3.4 is complete and all Tailwind changes are committed before running `docker compose build`.
- All existing `data-testid` attributes, `aria-label` attributes, and component structure are unchanged in this story — Docker is infrastructure only, zero frontend code changes.

### Git Intelligence

Recent commits:
1. `feat: complete and delete todo` (Story 3.3)
2. `feat: delte todos` (Story 3.2)
3. `feat: add update-todo` (Story 3.1)

Stories 3.1–3.4 are all feature implementation work in `apps/api/src/` and `apps/web/src/`. Story 3.5 is the first infrastructure/ops story — files to create/modify are all outside `src/` directories (`Dockerfile`, `nginx.conf`, `docker-compose.yml`, `.env.example`). Commit message should be `feat: docker containerisation` following the `feat:` conventional commit prefix pattern.

### Security Notes

- **Non-root users**: API image uses custom `fastify` user; web image uses nginx-unprivileged's built-in `nginx` user. Both satisfy the "non-root user" AC.
- **No hardcoded secrets**: All credentials are in env vars / `.env` file, never in `docker-compose.yml` or `Dockerfile`. `.env` is gitignored.
- **POSTGRES_PASSWORD**: Use a strong password in production `.env`. The default `postgres` is for local dev only.
- **`server_tokens off`** in nginx: Removes server version from response headers (prevents fingerprinting).
- **Internal communications**: The `api` service is reachable internally as `http://api:3000` but its port 3000 is also exposed to the host. For production, consider removing the host port binding for the `api` service and routing all traffic through nginx.
- **VITE_API_URL baked at build time**: If `VITE_API_URL=http://localhost:3000` is baked in, the frontend bundle targets `localhost:3000`. This is fine for local Docker dev but not for cloud deployment. For cloud, set `VITE_API_URL=""` so the SPA uses relative paths that nginx proxies.

### Project Structure Notes

New files created by this story:
- `apps/web/Dockerfile` — web frontend multi-stage build (build context: monorepo root)
- `apps/web/nginx.conf` — nginx configuration (SPA fallback + API proxy)
- `/.env.example` — root-level compose env vars documentation

Modified files:
- `/docker-compose.yml` — add `api` and `web` services alongside existing `postgres`

No files changed in `apps/api/src/`, `apps/web/src/`, or `packages/shared/`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.5: Docker Containerisation (acceptance criteria)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Infrastructure & Deployment section]
- [Source: _bmad-output/project-context.md — Monorepo Structure and Technology Stack]
- [Source: apps/api/Dockerfile — Existing API Docker configuration]
- [Source: docker-compose.yml — Existing postgres service configuration]
- [Source: apps/api/.env.example — API environment variable reference]
- [Source: apps/web/.env.example — Web environment variable reference]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
