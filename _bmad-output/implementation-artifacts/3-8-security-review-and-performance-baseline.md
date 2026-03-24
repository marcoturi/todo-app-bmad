# Story 3.8: Security Review and Performance Baseline

Status: done

## Story

As a developer,
I want a security review of the codebase and a documented performance baseline,
So that common vulnerabilities are identified and remediated before shipping, and performance targets from the spec are verified.

## Acceptance Criteria

1. **Given** the backend codebase is complete, **When** an AI-assisted security review is conducted, **Then** the review checks for: SQL injection risk (postgres.js tagged templates confirm parameterised queries), XSS risk (all API responses are JSON — no raw HTML rendered), input validation gaps (TypeBox schemas cover all request bodies and path params), and missing security headers. **And** any findings are documented in `docs/security-review.md` with severity (critical / high / medium / low) and remediation applied or noted. **And** zero critical or high severity findings remain unaddressed at story completion.

2. **Given** the frontend codebase is complete, **When** the security review covers the React app, **Then** the review confirms: no `dangerouslySetInnerHTML` usage, no secrets or API keys committed in source, only `VITE_API_URL` and `VITE_SENTRY_DSN` (public DSN, non-secret) are exposed to the client bundle, and all user-supplied content is rendered as text (not HTML). **And** findings are documented in `docs/security-review.md`.

3. **Given** the full stack is running via `docker compose up`, **When** Chrome DevTools (or Playwright's `page.metrics()`) is used to measure performance, **Then** page load to interactive on first visit is measured and documented — target: < 2s. **And** a create-todo interaction round-trip (form submit → list update) is measured — target: < 200ms perceived latency. **And** a `GET /api/v1/todos` API call is measured under normal conditions — target: < 300ms p95. **And** results are documented in `docs/performance-baseline.md` with pass/fail against each NFR target.

4. **Given** the performance baseline document exists, **When** any result fails its NFR target, **Then** the failure is noted with a proposed investigation path (e.g. slow DB query, large bundle, unoptimised render). **And** at least the critical path (page load + create interaction) must meet targets before the story is considered done.

5. **Given** the Vite production build is run via `pnpm --filter apps/web build`, **When** the build completes successfully, **Then** the build output confirms code splitting is applied — multiple chunks are generated rather than a single monolithic bundle. **And** no individual JavaScript chunk exceeds 500kb uncompressed. **And** the build output (or a bundle analyser report) is included in `docs/performance-baseline.md` as evidence of tree-shaking and code splitting.

## Tasks / Subtasks

### Security Review

- [x] Task 1: Backend Security Audit (AC: #1)
  - [x] 1.1 Verify all SQL queries use postgres.js tagged template literals (parameterised) — no raw string concatenation
  - [x] 1.2 Confirm all API responses are JSON (no raw HTML rendering, no XSS vectors)
  - [x] 1.3 Verify TypeBox schemas cover ALL request bodies and path params across all routes
  - [x] 1.4 Confirm @fastify/helmet is registered globally with appropriate config
  - [x] 1.5 Check CORS config restricts to `FRONTEND_URL` only (not wildcard)
  - [x] 1.6 Verify no hardcoded secrets or credentials in source files
  - [x] 1.7 Check environment variable validation (TypeBox schema for env vars)
  - [x] 1.8 Verify Docker images run as non-root users
  - [x] 1.9 Document all findings in `docs/security-review.md`

- [x] Task 2: Frontend Security Audit (AC: #2)
  - [x] 2.1 Confirm zero `dangerouslySetInnerHTML` usage
  - [x] 2.2 Verify no secrets/API keys committed in source (check .gitignore coverage)
  - [x] 2.3 Confirm only `VITE_API_URL` is exposed to client bundle (check `VITE_SENTRY_DSN` is acceptable)
  - [x] 2.4 Verify all user-supplied content renders as text, not HTML
  - [x] 2.5 Check dependency vulnerabilities via `pnpm audit`
  - [x] 2.6 Document findings in `docs/security-review.md`

### Performance Baseline

- [x] Task 3: Build Analysis (AC: #5)
  - [x] 3.1 Run `pnpm --filter apps/web build` and capture output
  - [x] 3.2 Verify code splitting produces multiple chunks (vendor-react, vendor-redux, vendor-radix, vendor-sentry, vendor-ui)
  - [x] 3.3 Verify no individual JS chunk exceeds 500kb uncompressed
  - [x] 3.4 Document bundle sizes and chunk breakdown in `docs/performance-baseline.md`

- [x] Task 4: Runtime Performance Measurement (AC: #3, #4)
  - [x] 4.1 Start full stack via `docker compose up --build`
  - [x] 4.2 Measure page load to interactive — target: < 2s
  - [x] 4.3 Measure create-todo round-trip (form submit → list update) — target: < 200ms
  - [x] 4.4 Measure `GET /api/v1/todos` API response time — target: < 300ms p95
  - [x] 4.5 If any target fails, document investigation path and remediate critical path
  - [x] 4.6 Document all results with pass/fail in `docs/performance-baseline.md`

### Documentation

- [x] Task 5: Create Security Review Document (AC: #1, #2)
  - [x] 5.1 Write `docs/security-review.md` with findings table (severity: critical/high/medium/low)
  - [x] 5.2 Ensure zero critical or high findings remain unaddressed

- [x] Task 6: Create Performance Baseline Document (AC: #3, #4, #5)
  - [x] 6.1 Write `docs/performance-baseline.md` with NFR targets table and results
  - [x] 6.2 Include build output / bundle analysis evidence
  - [x] 6.3 Include runtime measurement results with methodology

## Dev Notes

### Current Security Posture (Pre-Audit Findings)

The codebase already has several security measures in place. The audit must **verify and document** these, not re-implement:

| Area | Current State | Verification Needed |
|------|--------------|-------------------|
| SQL Injection | postgres.js tagged templates (parameterised) | Confirm NO raw string concatenation in any repository file |
| XSS | All API responses JSON; React auto-escapes JSX | Confirm no `dangerouslySetInnerHTML`, no raw HTML endpoints |
| Security Headers | `@fastify/helmet@13.0.2` registered globally | Verify headers appear in responses (CSP, X-Frame-Options, etc.) |
| CORS | Restricted to `FRONTEND_URL` env var | Confirm not wildcard `*` |
| Input Validation | TypeBox schemas on routes | Verify ALL routes have schemas (path params + body) |
| Secrets | `.gitignore` covers `.env*` files | Verify no hardcoded credentials in source |
| Env Vars (FE) | Centralized in `apps/web/src/shared/config/env.ts` | Note: both `VITE_API_URL` and `VITE_SENTRY_DSN` are exposed — AC says only `VITE_API_URL`; document `VITE_SENTRY_DSN` as acceptable (public DSN, not a secret) |
| Docker | Non-root users, dumb-init, Alpine images | Verify non-root in both Dockerfiles |
| nginx | `server_tokens off`, gzip, SPA routing | Verify no information leakage |

### Current Build / Code Splitting Setup

Vite config at `apps/web/vite.config.mts` already has manual chunk splitting:
- `vendor-react`: react, react-dom, react-router, react-redux
- `vendor-redux`: @reduxjs/toolkit (RTK Query, Immer, Reselect)
- `vendor-radix`: @radix-ui primitives
- `vendor-sentry`: @sentry/react (async loaded)
- `vendor-ui`: cva, clsx, tailwind-merge, lucide-react

Build target: `esnext`. Verify chunk sizes during build.

### Performance NFR Targets

| NFR | Target | How to Measure |
|-----|--------|---------------|
| NFR1: UI interaction response | < 200ms perceived | Time from form submit to list update visible in browser |
| NFR2: API response p95 | < 300ms | Multiple `GET /api/v1/todos` calls, measure p95 |
| NFR3: Page load to interactive | < 2s | First visit cold load in Docker stack |
| NFR4: Code splitting | No unbounded bundles | Build output analysis, no chunk > 500kb |

### Measurement Approach

**For build analysis (Task 3):** Run Vite build and parse terminal output for chunk sizes. No extra tooling needed.

**For runtime measurements (Task 4):** Use the Docker Compose stack (`docker compose up --build`). Measurements can be done via:
- Chrome DevTools Performance tab or Lighthouse for page load
- Playwright `page.metrics()` or simple timestamp measurement for interaction latency
- `curl` with timing or a simple script for API p95

### Project Structure Notes

Output documents go in `docs/` (exists but empty):
- `docs/security-review.md` — new file
- `docs/performance-baseline.md` — new file

No changes to application source code expected unless the audit finds a vulnerability that needs remediation.

### Critical Don'ts

- Do NOT install new security packages — `@fastify/helmet` is already in place
- Do NOT add authentication — v1 is explicitly no-auth by architecture decision
- Do NOT refactor or "improve" code during the audit — this is a review, not a refactor
- Do NOT add rate limiting or WAF — out of scope for v1
- Do NOT modify the Vite chunk config unless a chunk exceeds 500kb
- Do NOT run load/stress testing — this is a baseline under normal conditions only

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.8]
- [Source: _bmad-output/planning-artifacts/architecture.md#Security]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR Performance Requirements]
- [Source: apps/api/src/server/index.ts — helmet registration]
- [Source: apps/web/vite.config.mts — code splitting config]
- [Source: apps/web/src/shared/config/env.ts — env var centralization]
- [Source: apps/api/Dockerfile — non-root user, multi-stage build]
- [Source: apps/web/Dockerfile — nginx-unprivileged, multi-stage build]
- [Source: apps/web/nginx.conf — server_tokens off, gzip, proxy config]
- [Source: docker-compose.yml — service dependencies, healthchecks]

### Previous Story Intelligence (from 3.7 Accessibility Audit)

- Story 3.7 is in "review" status — modified CSS files (`global.css`) and component files (`TodoItem.tsx`, `CreateTodoForm.tsx`, `TodoList.tsx`)
- Added Playwright config at `apps/web/playwright.config.ts` and a11y tests at `apps/web/e2e/a11y/accessibility.spec.ts`
- Adjusted contrast ratio for `muted-foreground` from `oklch(0.556 0 0)` to `oklch(0.45 0 0)` — the security review should note this as a positive accessibility fix, not flag it
- All 30 existing unit tests pass, build and type checks pass — regression-safe baseline

### Git Intelligence (Recent Commits)

```
c2bcee3 chore: update gitignore, serena config, and add CLAUDE.md
00fe0a3 docs(bmad): add story 3.7 accessibility audit and update sprint status
9aeaf44 test(web): add Playwright accessibility audit with axe-core
2041db7 feat(web): add accessibility improvements to todo components
b02ef47 test(web): rewrite tests against real API instead of MSW mocks
ff7dfc9 refactor(web): remove MSW mocking layer and connect to real API
```

Key pattern: recent work removed MSW mocking layer and connected tests to real API. Frontend tests now hit the actual backend. This is relevant for performance measurement — tests can validate real latency.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Discovered local Node dev server (PID 7623) on port 3000 intercepting Docker API requests — killed to enable proper Docker-based measurements
- Found CORS misconfiguration: `FRONTEND_URL` default `http://localhost:80` doesn't match browser origin `http://localhost` — fixed in docker-compose.yml

### Completion Notes List

- **Task 1 (Backend Security Audit):** All SQL queries use parameterized tagged templates. All routes return JSON. Helmet globally registered. CORS restricted to FRONTEND_URL. No hardcoded secrets. TypeBox env validation in place. Docker containers run non-root. One low finding: find-todos route missing querystring schema.
- **Task 2 (Frontend Security Audit):** Zero dangerouslySetInnerHTML. No secrets in source. Env vars centralized in env.ts. User content rendered as text only. pnpm audit found 11 vulnerabilities all in dev-only @semantic-release dependencies (undici).
- **Task 3 (Build Analysis):** 8 JS chunks produced. Largest: vendor-react at 264.52kb. All under 500kb. Code splitting working as designed.
- **Task 4 (Runtime Performance):** LCP 382ms (target <2s), create-todo round-trip 22ms avg (target <200ms), API p95 9ms (target <300ms). All targets passed with significant margin.
- **Task 5 (Security Review Doc):** Created docs/security-review.md with 1 medium (remediated), 2 low, 2 info findings. Zero critical/high unaddressed.
- **Task 6 (Performance Baseline Doc):** Created docs/performance-baseline.md with NFR results, build output evidence, and runtime measurements.
- **Remediation:** Fixed docker-compose.yml FRONTEND_URL default from `http://localhost:80` to `http://localhost` (CORS mismatch).

### File List

- `docs/security-review.md` — NEW: Security review findings document
- `docs/performance-baseline.md` — NEW: Performance baseline measurements document
- `docker-compose.yml` — MODIFIED: Fixed FRONTEND_URL default (http://localhost:80 → http://localhost)

### Change Log

- 2026-03-24: Story implementation complete. Security audit conducted across backend, frontend, and Docker infrastructure. Performance baseline measured via Chrome DevTools and curl. One medium-severity CORS misconfiguration found and remediated. Two documentation files created.
