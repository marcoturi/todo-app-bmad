---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: 'complete'
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-todo-app-bmad-2026-03-07.md'
  - '_bmad-output/project-context.md'
briefCount: 1
researchCount: 0
brainstormingCount: 0
projectDocsCount: 1
workflowType: 'prd'
classification:
  projectType: 'web_app'
  domain: 'general'
  complexity: 'low'
  projectContext: 'brownfield'
---

# Product Requirements Document - todo-app-bmad

**Author:** Marco
**Date:** 2026-03-07

---

## Executive Summary

todo-app-bmad is a deliberately minimal but production-quality full-stack todo application for individual users who want to manage personal tasks with zero friction. It delivers exactly four operations — create, view, complete, delete — with no accounts, no configuration, and no onboarding. The product targets "Everyday Alex": someone who values the simplicity of a physical card system but needs the durability and persistence of a digital tool.

The application is built on a clean technical foundation — React/Redux frontend, Fastify/CQRS backend, PostgreSQL persistence — within a moon-managed TypeScript monorepo. Every layer of the stack reflects the same philosophy: minimal scope, maximal rigour.

### What Makes This Special

The core differentiator is the discipline of the build itself. Most todo applications are either over-engineered SaaS products or under-baked demo throwaway code. This one is neither. The scope is deliberately small — four operations, one user, no auth — but the foundation is production-grade: strict TypeScript, Clean Architecture with enforced layer boundaries, CQRS module isolation, spec-driven development with Cucumber E2E scenarios, and CI-enforced architecture validation.

This rigour is what makes the app valuable on both dimensions: "Everyday Alex" gets an app that feels reliable, fast, and finished — not a prototype — while developers get a full-stack reference that demonstrates how to build even simple things with intentionality. The insight at the core: **a small scope doesn't justify low standards**.

---

## Project Classification

| Attribute | Value |
|---|---|
| **Project Type** | Web App (React SPA + Fastify REST API) |
| **Domain** | General — Personal Productivity |
| **Complexity** | Low |
| **Project Context** | Brownfield (monorepo scaffolding, tech stack, and architecture patterns already established) |

---

## Success Criteria

### User Success

- First task added within 30 seconds of opening the app — zero onboarding friction confirmed
- All four core actions (create, view, complete, delete) completed in a single first session without guidance, errors, or confusion
- Tasks persist correctly across browser refresh and across sessions — the "trust moment" is achieved
- Completed todos are immediately visually distinguishable from active ones without any explanation needed
- Empty, loading, and error states are encountered and understood without confusion

### Business Success

- v1 delivers all four core operations with no critical gaps, broken states, or missing error handling — the product feels finished, not like a demo
- Any developer familiar with the stack can clone the repository, run it locally, understand the architecture, and extend it without asking questions
- Architecture is extensible: authentication, multi-user support, task priorities, and due dates can be added without structural rework of existing layers

### Technical Success

| KPI | Target |
|---|---|
| UI interaction response (add, complete, delete) | < 200ms perceived latency |
| API response time under normal conditions | < 300ms p95 |
| Page load to interactive (first visit) | < 2s on standard connection |
| Task persistence across session/refresh | 100% — zero data loss |
| API error rate under normal conditions | < 1% |
| Graceful error handling coverage | All API failure paths return user-visible feedback |
| Dependency-cruiser layer boundary violations | 0 — enforced in CI |
| TypeScript strict mode compliance | 0 errors on `tsc --noEmit` |
| Biome lint/format violations | 0 — enforced in pre-commit hook |
| E2E scenario coverage | All four core user actions covered by Cucumber scenarios |

### Measurable Outcomes

- A first-time user completes all four core actions without guidance or confusion on their first visit
- Zero data loss events across any session boundary or browser refresh
- All CI quality gates pass on every merge: dependency-cruiser, TypeScript, Biome, E2E scenarios
- Local developer setup completed end-to-end following only the README — no undocumented steps

---

## Product Scope

### MVP — Minimum Viable Product

Four user-facing operations, fully implemented with production-quality error handling, loading states, and persistence:

| # | Feature | Description |
|---|---|---|
| 1 | **Create a todo** | User enters a text description and submits. Todo appears in the list immediately. |
| 2 | **View all todos** | On load, the full list of todos is displayed in creation order — active and completed. |
| 3 | **Complete a todo** | User toggles completion status. Completed todos are visually distinguished at a glance. |
| 4 | **Delete a todo** | User removes a todo permanently. List updates immediately. |

**UX requirements included in MVP:** empty state, loading state, error states for all API failures, mobile-responsive layout, sub-200ms interaction feedback.

**API surface included in MVP:**
- `GET /api/v1/todos` — retrieve all todos
- `POST /api/v1/todos` — create a new todo
- `PATCH /api/v1/todos/:id` — update completion status
- `DELETE /api/v1/todos/:id` — delete a todo

### Growth Features (Post-MVP)

Task metadata enrichment to support richer personal organisation:

- Task priorities (high / medium / low)
- Due dates and deadline tracking
- Labels or categories for grouping tasks
- Filtering and sorting by status, priority, or due date
- Display of creation and completion timestamps

### Vision (Future)

Platform evolution toward multi-user and ecosystem integration:

- User authentication and personal accounts
- Multi-user support and shared lists
- Third-party integrations (calendar, notifications, external apps)
- Bulk actions (e.g. delete all completed)
- Offline support

---

## User Journeys

### Journey 1 — Alex, First Visit (Happy Path)

Alex hears about the app and opens the URL. There is no landing page, no login screen, no onboarding modal — just a clean empty state with a clear, inviting prompt to add the first task. Alex types a description and hits enter. The todo appears in the list instantly. They add three more, mark one done (it's immediately visually distinct), and delete one they no longer need. At the end of the day they close the browser.

The next morning Alex opens the app on the same device. Every task is exactly as they left it. That is the moment physical cards lose — the "trust moment" that converts a first-time visitor into a daily habit.

**Capabilities revealed:** immediate UI feedback on all actions, persistent storage across sessions, clear empty state, visual distinction between active and completed todos, mobile-responsive layout.

### Journey 2 — Alex, Something Goes Wrong (Error Recovery)

Alex is adding a task on a flaky connection. They submit — and nothing happens. No spinner that never ends, no silent failure — instead a clear, non-alarming error message appears. The text they typed is still in the input field. They retry and it succeeds.

Later, Alex tries to delete a completed task. The request fails. The task stays in the list — it has not silently disappeared. A brief error message explains the problem. Alex tries again; this time it works. Nothing is lost, nothing is mysterious.

**Capabilities revealed:** error states for all API failure paths (create, complete, delete), input preservation on failure, retry affordance, user-visible feedback for every failure scenario, zero silent failures.

### Journey 3 — Developer, Setup & Extension (Reference Use)

A developer encounters the repository and wants to understand the stack. They clone the repo, follow the README, run `docker compose up` at the monorepo root and start the dev server. The app is running locally in under 10 minutes with no undocumented steps.

They browse the codebase: the vertical slice structure on the frontend and the CQRS module structure on the backend are immediately navigable. They run `pnpm test` — all green. They run `pnpm deps:validate` — no boundary violations. When they want to add a "priority" field to todos, they find that the change is purely additive: a new command, a new query, a new schema field, a migration. No existing handlers or routes need to be modified. The architecture earns their trust.

**Capabilities revealed:** README-driven setup (Docker Compose, env vars, migrations, dev server), passing test suite out of the box, dependency-cruiser validation, clean module boundaries that make extension additive rather than disruptive.

### Journey Requirements Summary

| Journey | Key Capabilities Required |
|---|---|
| Alex — Happy Path | Immediate UI feedback, persistent storage, empty/loading states, visual completion distinction, mobile layout |
| Alex — Error Recovery | Per-action error states (create, complete, delete), input preservation, retry affordance, zero silent failures |
| Developer — Setup & Extension | README-driven local setup, green test suite, architecture validation, additive CQRS module structure |

---

## Web App Specific Requirements

### Project-Type Overview

todo-app-bmad is a single-page application (SPA) served from a static build and backed by a versioned REST API. There is no server-side rendering, no multi-page navigation with full reloads, and no SEO or discoverability requirements. The entire user experience is client-side, with the backend responsible solely for data persistence and retrieval.

### Browser Matrix

| Browser | Support Target |
|---|---|
| Chrome | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | Latest 2 versions |
| Edge | Latest 2 versions |

No support required for Internet Explorer or legacy browsers. No polyfills for older runtimes.

### Responsive Design

The application must be fully usable on both desktop and mobile viewports without a separate mobile build or native app. Layout adapts fluidly using Tailwind CSS utility classes. Touch interactions (tap, scroll) must work correctly on mobile. No fixed pixel breakpoints that break on intermediate screen sizes.

### SEO Strategy

Not applicable. The application is a personal task manager with no public-facing content, no shareable URLs, and no discoverability requirements. No `<meta>` SEO tags, sitemap, or structured data are needed.

### Implementation Considerations

- **No real-time / WebSockets:** All state changes are user-initiated. No polling, no live sync, no push notifications required for v1.
- **State management:** Redux Toolkit manages all client-side state. RTK Query handles API communication, caching, and loading/error states.
- **API communication:** REST only via RTK Query base API defined in `src/shared/store/api.ts`. Base URL sourced from `src/shared/config/env.ts` (`VITE_API_URL`).
- **Error boundaries:** React error boundaries wrap the application to catch unexpected render errors and display a graceful fallback.
- **MSW for development and testing:** API mocking via MSW ensures the frontend can be developed and tested independently of the backend.

---

## Project Scoping & Risk

### MVP Strategy

**MVP Approach:** Experience MVP — the minimum that delivers a complete, trustworthy, polished feel. Not a proof-of-concept prototype, but a finished v1 that earns daily use. The bar is not "does it work?" but "does it feel finished?"

**Resource:** Single full-stack developer. Moon-managed monorepo and lean scope keep tooling and coordination overhead minimal.

**Core Journeys Supported by MVP:**
- Alex — First Visit (Happy Path): full create → view → complete → delete loop
- Alex — Error Recovery: all API failure paths handled with user-visible feedback and zero silent failures

### Risk Mitigation

**Technical Risks:**

| Risk | Likelihood | Mitigation |
|---|---|---|
| Architecture boundary violations creeping in | Low | dependency-cruiser enforced in CI from day one — violations block merge |
| E2E tests flaky in CI | Medium | Playwright configured with retries; test isolation via DB seeding and cleanup between scenarios |
| TypeScript strict mode regressions | Low | `tsc --noEmit` runs in CI on every PR |

**Scope Risks:**

| Risk | Likelihood | Mitigation |
|---|---|---|
| "Just one more feature" scope creep | Low | PRD and brief explicitly document deferred items with rationale — any addition requires a deliberate decision |
| Product feels incomplete without auth | Low | Single-user, no-auth is a deliberate design decision; the empty state UX compensates |

**Resource Risks:**

| Risk | Likelihood | Mitigation |
|---|---|---|
| Single developer bottleneck | Low | Lean scope and vertical slice architecture allow all four features to be delivered sequentially without blockers |
| Setup complexity blocking contributors | Low | README-driven setup with Docker Compose is a first-class MVP requirement, not an afterthought |

---

## Functional Requirements

The following capabilities constitute the complete contract for v1. UX design, architecture, and epic breakdown are scoped to these requirements — nothing more, nothing less.

### Todo Management

- **FR1:** A user can create a todo by providing a text description
- **FR2:** A user can view the complete list of all todos in creation order
- **FR3:** A user can mark a todo as complete, toggling its completion status
- **FR4:** A user can mark a completed todo as incomplete, toggling its status back
- **FR5:** A user can permanently delete a todo from the list
- **FR6:** A user can distinguish completed todos from active todos at a glance without any explanation

### Data Persistence

- **FR7:** All todos are persisted across browser sessions — closing and reopening the browser does not result in data loss
- **FR8:** All todos are persisted across browser refreshes — reloading the page does not result in data loss
- **FR9:** The system assigns a creation timestamp to each todo at the moment of creation
- **FR10:** Each todo stores a unique identifier, a text description, a completion status, and a creation timestamp

### Application States

- **FR11:** The application displays a distinct empty state when no todos exist, with a clear prompt inviting the user to add their first task
- **FR12:** The application displays a loading state while the todo list is being fetched from the server
- **FR13:** The application displays a user-visible error message when a create operation fails
- **FR14:** The application displays a user-visible error message when a complete/uncomplete operation fails
- **FR15:** The application displays a user-visible error message when a delete operation fails
- **FR16:** On any API failure, the application preserves the current list state — no partial or silent mutations occur

### User Input & Interaction

- **FR17:** A user can submit a new todo by pressing Enter or activating a submit control
- **FR18:** After a successful create, the input field is cleared and ready for the next entry
- **FR19:** On a failed create, the user's input text is preserved in the input field
- **FR20:** All interactive controls (input, buttons, checkboxes) are operable via keyboard alone

### API Contract

- **FR21:** The system exposes an endpoint to retrieve all todos
- **FR22:** The system exposes an endpoint to create a new todo
- **FR23:** The system exposes an endpoint to update the completion status of a specific todo
- **FR24:** The system exposes an endpoint to delete a specific todo
- **FR25:** All API endpoints are versioned under `/api/v1/`

### Developer & Operational

- **FR26:** A developer can run the full application locally by following only the README — no undocumented steps required
- **FR27:** The database dependency starts via a single `docker compose` command at the monorepo root
- **FR28:** The test suite executes with a single command and produces a deterministic pass/fail result
- **FR29:** Architecture layer boundaries are validated automatically as part of the CI process

---

## Non-Functional Requirements

### Performance

- **NFR1:** All user-initiated operations (create, complete, delete) must reflect in the UI within 200ms perceived latency under normal network conditions
- **NFR2:** API responses for all todo endpoints must complete within 300ms at the 95th percentile under normal load
- **NFR3:** The application must reach an interactive state within 2 seconds on a standard broadband connection on first visit
- **NFR4:** The Vite production build must apply code splitting and tree-shaking — no unbounded bundle sizes

### Security

- **NFR5:** All client-server communication must occur over HTTPS in production
- **NFR6:** All database queries must use parameterised statements — no string-interpolated SQL
- **NFR7:** No sensitive configuration (database credentials, secrets) may be committed to the repository — environment variables only

### Accessibility

- **NFR8:** The application must conform to WCAG 2.1 Level AA
- **NFR9:** All interactive elements must be keyboard-navigable with visible focus indicators
- **NFR10:** Colour contrast ratios must meet WCAG AA minimums (4.5:1 for normal text, 3:1 for large text)
- **NFR11:** Dynamic state changes (empty state, loading state, error messages) must be communicated to assistive technologies via appropriate ARIA roles or live regions
- **NFR12:** The application must respect the `prefers-reduced-motion` media query — no motion that could trigger vestibular disorders

### Reliability

- **NFR13:** Task persistence must achieve 100% reliability across session boundaries and browser refreshes — zero data loss is a product-level guarantee
- **NFR14:** All API failure paths must result in user-visible feedback — zero silent failures
- **NFR15:** The application must never enter an unrecoverable UI state — all error states must be dismissible or retryable

### Maintainability

- **NFR16:** The codebase must have zero TypeScript errors under `tsc --noEmit` at all times
- **NFR17:** The codebase must have zero Biome lint or format violations — enforced via pre-commit hook
- **NFR18:** Architecture layer boundaries (Route → Handler → Domain → Repository) must have zero violations as validated by dependency-cruiser in CI
- **NFR19:** All source files must use kebab-case naming and follow the monorepo's established folder conventions

### Testability

- **NFR20:** All four core user actions must be covered by passing Cucumber E2E scenarios before any release
- **NFR21:** Backend domain logic and handlers must have unit/integration test coverage for the core CRUD operations
- **NFR22:** The test suite must be executable with a single command and produce a deterministic pass/fail result