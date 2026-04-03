# todo-app-bmad

## Description

A full-stack todo application built with Fastify (Node.js) and React, managed as a pnpm monorepo.

**Features:** create, complete, and delete todos — with a mobile-responsive UI, full Docker support, 70% test coverage enforcement, accessibility audit, and automated semantic releases.

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 24.x | https://nodejs.org or via nvm: `nvm install 24` |
| pnpm | 10.x | `npm install -g pnpm@10` |
| Docker Desktop | latest | https://www.docker.com/products/docker-desktop/ |

> **Linux users:** Docker Engine + Compose plugin (v2) works in place of Docker Desktop.

The exact Node.js version used in this project is `24.11.0` (see `.nvmrc`). If you use nvm, run `nvm use` from the repo root to switch automatically.

---

## Project Structure

```
./
├── apps/
│   ├── api/              → Fastify REST backend (Node 24 native TypeScript, no build step)
│   └── web/              → React + Redux frontend (Vite 7, Tailwind 4, shadcn/ui)
├── packages/
│   └── shared/           → Shared TypeScript types for the API contract (@todo-app/shared)
├── docker-compose.yml    → Full-stack Docker Compose (postgres, api, web)
├── .github/
│   └── workflows/
│       └── release.yml   → CI (lint+types+tests+coverage) → E2E → Release (semantic-release)
├── .nvmrc                → Node.js version pin (24.11.0)
└── pnpm-workspace.yaml   → pnpm workspace members
```

For a deeper technical overview, see the [Architecture Decision Document](_bmad-output/planning-artifacts/architecture.md).

---

## Local Development

Follow these steps **in order** from a fresh clone to a fully running application.

### 1. Clone and install

```bash
git clone <repo-url>
cd todo-app-bmad
pnpm install
```

> **Important:** Always run `pnpm install` from the **monorepo root**. Never run it from inside `apps/api`, `apps/web`, or `packages/shared` — the workspace uses a single root lockfile.

### 2. Configure environment variables

Each application needs its own `.env` file copied from the provided example:

```bash
# Option A — using the shorthand script (recommended)
pnpm --filter @todo-app/api create:env
pnpm --filter @todo-app/web create:env

# Option B — manual copy
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

The default values in `.env.example` work out of the box for local development with no changes required.

**`apps/api/.env.example` variables:**

```
LOG_LEVEL=info
NODE_ENV=development
HOST=localhost
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todos?sslmode=disable
DBMATE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todos?sslmode=disable
OTEL_SDK_DISABLED=true
OTEL_SERVICE_NAME=todo-app-api
```

**`apps/web/.env.example` variables:**

```
VITE_API_URL=http://localhost:3000
VITE_SENTRY_DSN=https://fdgdfgsdfg.ingest.sentry.io/5232
VITE_API_MOCKING=true
```

### 3. Start PostgreSQL

```bash
docker compose up postgres -d
```

This starts a PostgreSQL 17 container on port `5432` using the credentials in your `.env` file.

### 4. Run database migrations

```bash
pnpm --filter @todo-app/api db:migrate
```

This applies all pending migrations from `apps/api/db/migrations/`.

### 5. Start the backend

> **Prerequisite:** Ensure you have completed Step 2 (environment variables) — the server reads `.env` on startup and will fail without it.

```bash
cd apps/api && pnpm start
```

The API server starts with hot-reload (via `--watch`) and listens on **http://localhost:3000**.

### 6. Start the frontend

Open a new terminal:

```bash
cd apps/web && pnpm dev
```

The frontend dev server starts on **http://localhost:5173**.

### 7. Open the app

Navigate to **http://localhost:5173** in your browser. The todo app should be fully functional.

---

## Running Tests

All test commands are run from the **monorepo root** using `--filter`.

| Command | Description |
|---|---|
| `pnpm --filter @todo-app/api test` | Backend unit tests (Node test runner) |
| `pnpm --filter @todo-app/api test:coverage` | Backend unit tests with coverage report (c8, 70% threshold) |
| `pnpm --filter @todo-app/api test:e2e` | Backend Cucumber E2E tests (requires running PostgreSQL) |
| `pnpm --filter @todo-app/web test` | Frontend unit tests (Vitest) |
| `pnpm --filter @todo-app/web test:coverage` | Frontend unit tests with coverage report (Vitest + @vitest/coverage-v8, 70% threshold) |
| `pnpm --filter @todo-app/web test:e2e` | Frontend Playwright E2E tests (requires running frontend dev server) |
| `pnpm --filter @todo-app/web test:a11y` | Accessibility audit (Playwright + axe-core, requires running frontend dev server) |

### Additional quality checks

```bash
# TypeScript type-check across all workspaces
pnpm -r type:check

# Lint and format check across all workspaces
pnpm -r check

# Auto-fix lint and formatting issues across all workspaces
pnpm -r check:fix
```

---

## CI/CD

The CI/CD pipeline is defined in `.github/workflows/release.yml` and runs three jobs in sequence:

| Job | Trigger | What it does |
|---|---|---|
| **`ci`** | Every push / PR | Biome lint + format check, TypeScript type-check, dependency-cruiser architecture validation, unit tests + coverage (70% threshold) across all workspaces |
| **`e2e`** | After `ci` passes | Spins up a PostgreSQL service container, runs DB migrations, executes backend Cucumber E2E, frontend Playwright E2E, and accessibility (axe-core) test suites |
| **`release`** | After `ci` + `e2e` pass, push to `main` only | Runs semantic-release independently for `@todo-app/api` and `@todo-app/web` |

---

## Docker (Full Stack)

Run the entire application with Docker Compose — no local Node.js or pnpm required (only Docker).

```bash
# Copy the root .env.example to .env
cp .env.example .env

# Build and start all services (postgres, api, web)
docker compose up --build
```

| Service | URL | Description |
|---|---|---|
| **web** | http://localhost | Nginx-served React frontend |
| **api** | http://localhost:3000 | Fastify REST API |
| **postgres** | localhost:5432 | PostgreSQL 17 database |

The API service waits for PostgreSQL to be healthy and runs migrations on startup. The web service waits for the API to be healthy.

**Test profile** — spin up an isolated E2E test database alongside the full stack:

```bash
POSTGRES_DB=todos_test docker compose --profile test up --wait
```

---

## Architecture

For a full technical overview — including technology choices, architectural decisions, data model, and infrastructure design — see the [Architecture Decision Document](_bmad-output/planning-artifacts/architecture.md).
