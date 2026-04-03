# AI Usage Report — todo-app-bmad

**Date:** 2026-04-03
**Project:** todo-app-bmad (Full-stack Todo Application)
**Scope:** 3 epics, 20 stories, full product lifecycle

---

## 1. Agent Usage: Tasks Completed with AI Assistance

### Agents Used Across Epics

| Epic | Stories | Agent |
|------|---------|-------|
| Epic 1 (Foundation) | 1.1–1.5 | Claude Sonnet 4.6 (via GitHub Copilot) |
| Epic 1 | 1.6 (Type Generation) | Claude Sonnet 4.6 |
| Epic 2 (View & Create) | 2.1–2.6 | Claude Sonnet 4.6 |
| Epic 3 | 3.1, 3.2, 3.5 | Claude Sonnet 4.6 |
| Epic 3 | 3.3, 3.4 | Claude Opus 4.6 |
| Epic 3 | 3.6, 3.7, 3.8 | Claude Opus 4.6 (1M context) |

### What AI Built

AI agents implemented the **entire codebase** under human supervision:

- **Backend:** Fastify REST API with CQRS architecture (Route → Handler → Domain → Repository), TypeBox validation schemas, PostgreSQL with DBMate migrations, Cucumber E2E tests
- **Frontend:** React 19 + Redux Toolkit + RTK Query, Tailwind CSS 4 + shadcn/ui components, Playwright E2E tests, axe-core accessibility tests
- **Infrastructure:** pnpm monorepo with moon orchestration, GitHub Actions CI/CD (3-job pipeline), Docker containerisation (nginx + Fastify + PostgreSQL), semantic-release automation
- **Quality:** 95.66% backend coverage, 93.42% frontend coverage, WCAG AA compliance, security review, performance baselines

### Prompts That Worked Best

1. **Structured story specs with explicit acceptance criteria** — Each story was a detailed markdown file with numbered ACs, dev notes, file locations, anti-patterns, and a "What Already Exists" table. This was the single most effective prompting strategy. Vague instructions produced vague code; pinned configuration values (`enforce exactly 70%`, not `enforce a minimum`) eliminated ambiguity.

2. **Dev Notes propagation** — Embedding gotchas and anti-patterns discovered in previous stories directly into subsequent story specs. Example: Story 3.1 included 8 "Critical Gotchas from Epic 2" that prevented the agent from repeating known mistakes. This worked better than expecting the agent to remember across sessions.

3. **❌ prohibition rules in project-context.md** — Framing rules as prohibitions (`❌ Never define response schemas in apps/api`) was more effective than advisory guidance (`prefer putting schemas in shared`). Structural enforcement > advisory rules — proven across all 3 epics.

4. **Vertical slice story decomposition** — Stories scoped as complete vertical slices (API endpoint + tests, or UI component + tests) worked better than horizontal slices. The agent could hold the full context of a feature without cross-story dependencies.

### Prompts That Did NOT Work Well

- **Advisory process rules** (e.g., "update the Status header when done") — drifted repeatedly across all 3 epics
- **Implicit architectural expectations** (e.g., "use shared types") without structural enforcement — agents took the path of least resistance and defined types locally
- **Standalone QA stories** separated from feature implementation — created false "done" signals

---

## 2. MCP Server Usage

### Chrome DevTools MCP

**Purpose:** Runtime verification of the running application in the browser.

**How it helped:**
- Verified API responses return correct data after implementation
- Confirmed UI rendering, layout, and interactive behavior
- Caught regressions that test suites missed (API returning wrong status codes, broken UI states)
- Validated accessibility fixes (contrast, focus indicators) visually

**Critical finding:** This MCP was added as **mandatory** after Epic 3 exposed that test suites passing ≠ working software. Stories were being marked "done" without anyone launching the app. Marco had to fix API regressions and CI breaks that agents missed. After mandating Chrome DevTools verification, this class of issue was eliminated.

### PostgreSQL MCP

**Purpose:** Direct database validation during story implementation.

**How it helped:**
- Verified table schemas and indexes after migration runs
- Validated data insertion and retrieval during E2E test development
- Confirmed postgres.js type conversions (e.g., `TIMESTAMPTZ` → `Date` objects)

### Context7 MCP

**Purpose:** Official library/framework documentation lookup.

**How it helped:**
- Resolved RTK Query configuration questions (endpoint path formatting, `injectEndpoints` vs `createApi`)
- Clarified React 19 concurrent mode behavior for E2E test strategies
- Verified Fastify 5.x plugin registration patterns
- Looked up Tailwind CSS 4 configuration and shadcn/ui component APIs
- Confirmed Playwright assertion patterns and axe-core integration

### Serena MCP

**Purpose:** Semantic code navigation and symbol-level editing.

**How it helped:**
- Located definitions, references, and symbol relationships across the monorepo
- Made precise, targeted edits to specific symbols without reading entire files
- Navigated the CQRS layer architecture efficiently (finding handlers, repositories, domain types)

---

## 3. Test Generation

### How AI Assisted

AI agents generated **all tests** in this project:

- **Backend unit tests** (node:test): Repository tests, handler tests, domain logic tests — 95.66% statement coverage
- **Backend E2E tests** (Cucumber/Gherkin): 8+ scenarios covering CRUD operations against a live PostgreSQL database
- **Frontend unit tests** (Vitest + Testing Library): Component rendering, Redux store integration, RTK Query cache behavior — 93.42% statement coverage
- **Frontend E2E tests** (Playwright): Full user flow tests with Page Object pattern (`TodoPage.ts`)
- **Accessibility tests** (Playwright + axe-core): WCAG AA compliance verification, zero violations
- **Load tests** (k6): Performance baseline scripts

### What Worked

- **Tests as acceptance criteria** in feature stories produced higher coverage organically (93-96%) than dedicated testing stories would have
- **Page Object pattern** for Playwright was adopted early and kept E2E tests maintainable
- **Cucumber/Gherkin scenarios** provided readable, behavior-driven test descriptions

### What AI Missed

1. **Test assertion completeness** — Consistently insufficient on first pass across Stories 3.1, 3.3, 3.4. Missing symmetric assertions (if you test create, also test that the created item appears), unverified payload values, and inadequate DOM stability guards. Required code review to catch.

2. **React 19 concurrent mode E2E assumptions** — Used `waitForLoadState('networkidle')` which fires before React 19 commits DOM updates. Tests measured stale DOM state. Required switching to Playwright auto-retry assertions. The agent did not anticipate this framework-specific behavior change.

3. **Integration boundary gaps** — 93% unit test coverage didn't prevent real API regressions. Tests verified components in isolation but missed integration failures between layers. The agent over-relied on mocked boundaries.

4. **Timing-sensitive assertions** — Required explicit 10ms delays between DB inserts in E2E tests to ensure distinct `created_at` timestamps for ordering assertions. The agent didn't account for database timestamp granularity.

5. **Dev tooling interference** — MSW service workers intercepted Playwright accessibility tests. Vitest picked up Playwright spec files. `vite-tsconfig-paths` didn't resolve aliases for excluded spec files. These cross-tool interactions were not anticipated.

---

## 4. Debugging with AI

### Case 1: React 19 Concurrent Mode E2E Failures (Story 3.3)

**Problem:** Playwright E2E tests intermittently failed — assertions ran against stale DOM.
**AI diagnosis:** Identified that React 19's concurrent rendering model means `networkidle` fires before React commits DOM updates. The traditional "wait for network silence" approach is unreliable.
**AI fix:** Switched all E2E assertions to Playwright auto-retry assertions (`expect(locator).toHaveText()`) that poll the DOM until the condition is met or timeout.

### Case 2: Monorepo Docker Build Failures (Story 3.5)

**Problem:** pnpm workspace resolution broke inside Docker multi-stage builds. Node 24's native TypeScript type stripping doesn't work for `node_modules` code.
**AI diagnosis:** Identified that pnpm's workspace protocol (`workspace:*`) doesn't resolve in isolated Docker build contexts, and that the `@todo-app/shared` package needed compilation since Node's type stripping doesn't apply to dependencies.
**AI fix:** Rewrote the Dockerfile with proper workspace dependency management, added helper scripts for shared package compilation, and restructured the multi-stage build.

### Case 3: Pre-existing Regressions Surfaced During Docker Build (Story 3.5)

**Problem:** Docker build exposed multiple latent issues: `<Text as="h1">` invalid in Radix UI, broken imports from spec files leaking into production bundle, PointerEvent mock cast issues.
**AI diagnosis:** Traced each error through the build output, identifying that these were pre-existing issues masked by the development server's more lenient behavior.
**AI fix:** Fixed Radix UI component usage, cleaned up spec file imports, corrected PointerEvent typing.

### Case 4: Biome Quote Style Violations (Recurring, 7/20 stories)

**Problem:** AI-generated code consistently used double quotes when the project enforced single quotes via Biome.
**AI diagnosis:** The `edit_file` tool's default behavior introduced double-quoted strings.
**Resolution:** Required running `check:fix` after every edit. Caught in code review in 4/8 Epic 3 stories. Never fully self-corrected — a persistent AI limitation.

### Case 5: Coverage Gate CI Failure (Post-Epic 1)

**Problem:** Web coverage gate failing in CI pipeline after Epic 1 completion.
**AI diagnosis:** Identified that scaffold type files with zero coverage were pulling the percentage below the 10% threshold, and `vite.config.mts` coverage exclude patterns weren't covering them.
**AI fix:** Tightened exclude patterns in coverage configuration to exclude scaffold files from coverage calculation.

---

## 5. Limitations Encountered

### What AI Could NOT Do Well

1. **Runtime verification** — The most critical limitation. AI agents could not independently verify that the running application worked. They relied on test suites as a proxy, which repeatedly proved insufficient. Marco had to fix API regressions and broken CI pipelines that agents marked as "done." This led to the mandatory Chrome DevTools MCP verification rule.

2. **Process discipline** — Advisory rules (update status headers, check CI before marking done) were consistently ignored or forgotten. Only structural enforcement via ❌ rules in `project-context.md` was reliable. The agent optimizes for task completion, not process compliance.

3. **Tooling configuration details** — Configuration constraints (coverage thresholds, CI permissions blocks, Biome formatting rules) were the blind spot in 4/5 Epic 1 stories. The agent wrote functionally correct code but missed configuration precision. Required explicit pinned values in specs.

4. **Cross-tool interaction awareness** — The agent did not anticipate interference between dev tools (MSW vs Playwright, Vitest vs Playwright spec files, vite-tsconfig-paths aliasing). These required human debugging or very specific story dev notes.

5. **Architectural judgment** — The agent followed the path of least resistance (define types locally) rather than the architecturally correct pattern (define in shared package first). Required structural enforcement, not just guidance.

6. **Formatting consistency** — Biome single-quote violations appeared in 7/20 stories. The agent never fully internalized this project convention despite repeated corrections.

### Where Human Expertise Was Critical

1. **Architectural decisions** — Marco identified that hand-authored types were the wrong pattern and that a type generation pipeline (TypeBox → OpenAPI → openapi-typescript → shared package) was needed. This was a spec quality insight, not an implementation insight.

2. **Process design** — The shift from standalone QA stories to tests-as-ACs, the mandate for runtime verification, and the principle of structural enforcement over advisory rules — all originated from Marco's retrospective analysis.

3. **Quality gate enforcement** — Marco caught API regressions, broken pipelines, and incomplete test assertions that passed AI code review. The human served as the final quality gate.

4. **Risk identification** — Recognizing that 93% test coverage didn't prevent real failures, and that "test suites passing ≠ working software" was a fundamental process gap.

5. **Boilerplate auditing** — Stale GraphQL files, conflicting `packageManager` versions, orphaned dependencies — the agent didn't question existing boilerplate, it built on top of it. Human review caught these landmines.

---

## Summary

| Dimension | AI Strength | AI Limitation |
|-----------|-------------|---------------|
| Code implementation | Generated entire codebase across backend, frontend, and infrastructure | Configuration precision and tooling details were blind spots |
| Testing | Produced 93-96% coverage organically | Assertion completeness, integration boundaries, and framework-specific edge cases missed on first pass |
| Debugging | Effective at diagnosing known error patterns and framework migration issues | Could not detect regressions without explicit runtime verification tooling |
| Architecture | Followed established patterns reliably when structurally enforced | Took path of least resistance without enforcement; didn't propose architectural improvements |
| Process | Executed detailed story specs faithfully | Advisory process rules drifted; only structural enforcement was reliable |
| Quality | Produced zero critical security findings, WCAG AA compliance | Required human oversight for integration correctness and final quality gate |

**Key takeaway:** AI agents were highly effective as implementation engines when given precise, structurally enforced specifications. Human expertise was critical for architectural judgment, process design, quality enforcement, and runtime verification. The combination — human as architect/reviewer, AI as implementor — delivered 20 stories with zero production incidents.
