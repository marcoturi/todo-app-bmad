# Security Review

**Project:** todo-app-bmad
**Date:** 2026-03-24
**Scope:** Full-stack security audit (backend API, frontend React app, Docker infrastructure)
**Methodology:** AI-assisted static analysis, code review, and runtime verification

---

## Summary

The codebase demonstrates strong security practices. One medium-severity misconfiguration was found and remediated. All other checks passed with no issues.

| Severity | Found | Remediated | Remaining |
| -------- | ----- | ---------- | --------- |
| Critical | 0     | 0          | 0         |
| High     | 0     | 0          | 0         |
| Medium   | 1     | 1          | 0         |
| Low      | 2     | 0          | 2         |
| Info     | 2     | 0          | 2         |

---

## Findings

### MEDIUM-001: Docker Compose CORS origin mismatch

- **Severity:** Medium
- **Category:** Misconfiguration
- **Location:** `docker-compose.yml:29`
- **Status:** Remediated

**Description:** The `FRONTEND_URL` default was `http://localhost:80`. Browsers normalize port 80 and send `Origin: http://localhost` (without `:80`), causing CORS preflight failures. The frontend could not communicate with the API when running via `docker compose up`.

**Remediation:** Changed the default to `http://localhost` (without explicit port). Verified the CORS `Access-Control-Allow-Origin` header now matches the browser origin.

---

### LOW-001: `find-todos` route missing querystring schema

- **Severity:** Low
- **Category:** Input Validation Gap
- **Location:** `apps/api/src/modules/todos/queries/find-todos/find-todos.route.ts`
- **Status:** Noted (not remediated — no functional impact)

**Description:** The `GET /api/v1/todos` route does not define a `querystring` schema. While the handler does not consume query parameters, Fastify will silently accept and ignore any query string. For consistency with the `find-users` route and for API documentation accuracy, a schema could be added.

**Risk:** Minimal. Stray query parameters are ignored; no injection vector exists.

---

### LOW-002: Dependency vulnerabilities in dev-only packages

- **Severity:** Low
- **Category:** Supply Chain
- **Status:** Noted (not remediated — no production impact)

**Description:** `pnpm audit` reports 11 vulnerabilities (6 high, 5 moderate) — all in `undici` via `@semantic-release/github` and `@semantic-release/npm`. These are development-only CI/CD dependencies and are not included in production Docker images.

| Advisory | Package | Via | Severity |
| -------- | ------- | --- | -------- |
| GHSA-f269-vfmq-vjvj | undici ≥7.0.0 <7.24.0 | @semantic-release/github | High |
| GHSA-f269-vfmq-vjvj | undici ≥6.0.0 <6.24.0 | @semantic-release/npm | High |
| GHSA-vrm6-8vpv-qv8q | undici ≥7.0.0 <7.24.0 | @semantic-release/github | High |
| GHSA-vrm6-8vpv-qv8q | undici <6.24.0 | @semantic-release/npm | High |
| GHSA-v9p9-hfj2-hcw8 | undici ≥7.0.0 <7.24.0 | @semantic-release/github | High |
| GHSA-v9p9-hfj2-hcw8 | undici <6.24.0 | @semantic-release/npm | High |
| GHSA-4992-7rv2-5pvq | undici | @semantic-release/github | Moderate |
| GHSA-4992-7rv2-5pvq | undici | @semantic-release/npm | Moderate |
| GHSA-phc3-fgpg-7m6h | undici ≥7.17.0 <7.24.0 | @semantic-release/github | Moderate |
| + 2 more | undici | @semantic-release/* | Moderate |

**Recommendation:** Update `@semantic-release/github` and `@semantic-release/npm` when patched versions are available.

---

### INFO-001: `VITE_SENTRY_DSN` exposed to client bundle

- **Severity:** Info
- **Category:** Environment Variables
- **Location:** `apps/web/src/shared/config/env.ts`
- **Status:** Acceptable

**Description:** AC #2 states only `VITE_API_URL` should be exposed. `VITE_SENTRY_DSN` is also exposed. However, Sentry DSNs are **public by design** — they identify the project for error reporting but do not grant write access to Sentry settings. This is an acceptable deviation.

---

### INFO-002: Form input missing `id` or `name` attribute

- **Severity:** Info
- **Category:** HTML Best Practice
- **Location:** `apps/web/src/features/todos/components/CreateTodoForm.tsx`
- **Status:** Noted

**Description:** The todo input field lacks an `id` or `name` attribute. This was flagged by Chrome DevTools as a best-practice issue. It does not create a security vulnerability but may affect form auto-fill behavior and accessibility tooling.

---

## Backend Security Audit

### SQL Injection Protection

| Check | Result | Evidence |
| ----- | ------ | -------- |
| postgres.js tagged templates | PASS | All queries use `` db`...` `` parameterized syntax |
| No string concatenation for SQL | PASS | Zero instances of SQL string concatenation |
| Identifier escaping | PASS | Table names use `db(tableName)` |
| SQL isolated to repository layer | PASS | No SQL in handlers, routes, or domain |

**Files verified:** `sql-repository.base.ts`, `todo.repository.ts`, `user.repository.ts`, all migration and seed files, test step definitions.

### XSS Prevention

| Check | Result | Evidence |
| ----- | ------ | -------- |
| No raw HTML responses | PASS | All routes return JSON via `res.send()` |
| No static file serving | PASS | No `serveStatic` or `sendFile` usage |
| Error handler sanitized | PASS | Generic error messages, no stack traces exposed |

### Security Headers

| Check | Result | Evidence |
| ----- | ------ | -------- |
| @fastify/helmet registered globally | PASS | `apps/api/src/server/index.ts:13` — `global: true` |
| Version: 13.0.2 | PASS | Default headers: CSP, X-Frame-Options, HSTS, X-Content-Type-Options |

### CORS Configuration

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Origin restricted (not wildcard) | PASS | `origin: env.server.frontendUrl` (from `FRONTEND_URL` env var) |
| Methods restricted | PASS | `['GET', 'POST', 'PATCH', 'DELETE']` only |

### Input Validation (TypeBox Schemas)

| Route | Method | Body | Params | Response | Status |
| ----- | ------ | ---- | ------ | -------- | ------ |
| `/api/v1/todos` | GET | n/a | n/a | ✅ | PASS |
| `/api/v1/todos` | POST | ✅ | n/a | ✅ | PASS |
| `/api/v1/todos/:id` | PATCH | ✅ | ✅ | ✅ | PASS |
| `/api/v1/todos/:id` | DELETE | n/a | ✅ | — | PASS |
| `/api/v1/users` | GET | n/a | n/a | ✅ | PASS |
| `/api/v1/users` | POST | ✅ | n/a | ✅ | PASS |
| `/api/v1/users/:id` | DELETE | n/a | ✅ | — | PASS |

### Secrets and Credentials

| Check | Result | Evidence |
| ----- | ------ | -------- |
| No hardcoded secrets in source | PASS | Searched for password, secret, token, api_key patterns |
| `.gitignore` covers `.env` files | PASS | `.env`, `.env.local`, `.env.*.local` all ignored |
| Authorization headers redacted in logs | PASS | `redact: ['headers.authorization']` in Pino config |

### Environment Variable Validation

| Check | Result | Evidence |
| ----- | ------ | -------- |
| TypeBox schema for all env vars | PASS | `apps/api/src/config/env.ts` — `DATABASE_URL`, `FRONTEND_URL`, `LOG_LEVEL`, `NODE_ENV`, `HOST`, `PORT` |
| Enum validation for NODE_ENV | PASS | Only allows `development`, `production`, `test` |
| Startup fails on invalid config | PASS | `env-schema` throws on missing required vars |

---

## Frontend Security Audit

### XSS Prevention

| Check | Result | Evidence |
| ----- | ------ | -------- |
| No `dangerouslySetInnerHTML` | PASS | Zero matches across all source files |
| User content rendered as text | PASS | `{todo.description}` in JSX — React auto-escapes |
| No innerHTML usage | PASS | No DOM manipulation with user content |

### Environment Variables

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Centralized env config | PASS | All access via `src/shared/config/env.ts` |
| No direct `import.meta.env` in app code | PASS | Only used in `env.ts` config file |
| Exposed vars: `VITE_API_URL`, `VITE_SENTRY_DSN` | PASS | Both are non-secret values |

### Secrets and Credentials

| Check | Result | Evidence |
| ----- | ------ | -------- |
| No secrets in source | PASS | No API keys, tokens, or passwords found |
| No localStorage/sessionStorage for secrets | PASS | localStorage used for non-secret settings only (`local-storage.service.ts`); no secrets stored |

---

## Docker Infrastructure Security

### Container User Isolation

| Container | Non-root User | Method |
| --------- | ------------- | ------ |
| API | `fastify` (UID 1001) | `adduser -S fastify` + `USER fastify` |
| Web | `nginx` (UID 101) | `nginxinc/nginx-unprivileged` base image |

### Additional Docker Security

| Check | Result | Evidence |
| ----- | ------ | -------- |
| dumb-init as PID 1 (API) | PASS | Proper signal forwarding |
| Alpine base images | PASS | Minimal attack surface |
| Multi-stage builds | PASS | Build deps excluded from production |
| `server_tokens off` (nginx) | PASS | No version disclosure |
| No privileged mode | PASS | No `privileged: true` in docker-compose |
| Healthchecks configured | PASS | All services have healthcheck definitions |
