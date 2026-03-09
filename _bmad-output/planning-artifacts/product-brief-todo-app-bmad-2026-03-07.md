---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: ['_bmad-output/project-context.md']
date: '2026-03-07'
author: 'Marco'
status: 'complete'
---

# Product Brief: todo-app-bmad

<!-- Content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

todo-app-bmad is a simple, focused full-stack Todo application that enables individual users to manage personal tasks with clarity, reliability, and zero friction. Built on a clean technical foundation using modern TypeScript tooling across a React frontend and Fastify backend, the application deliberately prioritizes a polished core experience over feature breadth — delivering something that feels complete precisely because of what it leaves out.

The first version covers the full task lifecycle: create, view, complete, and delete. No accounts, no collaboration, no complexity. Just a fast, intuitive interface backed by a well-structured API, ready to be extended when the product evolves.

---

## Core Vision

### Problem Statement

Managing personal tasks shouldn't require onboarding, configuration, or cognitive overhead. Most todo tools either over-engineer the experience with features users don't need, or under-deliver on the fundamentals — slow updates, unclear states, broken experiences on refresh. There is no widely agreed "reference implementation" of what a minimal but production-quality todo app looks like across a modern full-stack architecture.

### Problem Impact

Users lose trust in tools that feel unstable across sessions, lag on simple interactions, or fail silently. Developers building new full-stack applications lack a clean, opinionated reference that shows how all the layers — UI, state, API, database — fit together without unnecessary ceremony.

### Why Existing Solutions Fall Short

- Consumer todo apps (Todoist, Things, etc.) are feature-rich but not instructive as architectural references and impose multi-user/account models from the start.
- Minimal demo apps (TodoMVC, etc.) demonstrate UI patterns only — they lack a real backend, persistence, error handling, and production-quality structure.
- Full-stack tutorials tend to cut corners on code quality, architecture, and UX polish in favour of brevity.

### Proposed Solution

A deliberately minimal but production-quality full-stack todo application that:

- Lets users create, view, complete, and delete tasks immediately — no login, no setup.
- Reflects all actions instantly in the UI with optimistic or fast-response updates.
- Persists data reliably across sessions via a clean REST API backed by PostgreSQL.
- Handles empty, loading, and error states gracefully on both client and server.
- Is built on an architecture that supports future extension (auth, multi-user, priorities) without requiring a rewrite.

### Key Differentiators

- **Production-grade foundation on a minimal scope**: Clean Architecture + CQRS on the backend, vertical slice + Redux on the frontend — patterns that scale, applied to something simple enough to understand completely.
- **Spec-driven development**: Built following the BMAD method with full planning artifacts, epics, and stories — demonstrating how to build even small apps with rigour and intentionality.
- **No shortcuts on UX**: Empty states, loading states, error states, and mobile responsiveness are first-class requirements, not afterthoughts.
- **Extensibility by design**: No auth today, but the architecture doesn't close the door on it — module boundaries and API structure anticipate future growth.

---

## Target Users

### Primary Users

**Persona: "Everyday Alex" — The Analog Task Manager Going Digital**

Alex is a professional or student in their 20s–40s who has relied on physical index cards, sticky notes, or a notepad to manage their daily tasks. They are not necessarily tech-averse — they simply found physical cards fast, tactile, and satisfying. However, physical cards are losable, not accessible across devices, and can't survive a coffee spill or a commute.

**Context:**

- Works primarily at a desk (home office or workplace)
- Manages a personal, individual task list — not a team backlog
- Needs something they can glance at, act on, and close the laptop without ceremony

**Motivations:**

- Keep the simplicity of a physical card system but gain durability and persistence
- See all their tasks at a glance without searching through notes or apps
- Complete and clear tasks with the same satisfying decisiveness as tearing up a card

**Current frustrations with physical cards:**

- Cards get lost, damaged, or left at home
- No persistence across sessions — "I left my stack at the office"
- Can't access the list on another device
- No record of what was completed

**Success vision:**

Alex opens the app on their first day, sees a clean empty state that invites action, types their first task, and hits enter. It appears instantly. They complete it — and it feels just as satisfying as crossing something off a card. No signup. No tutorial. No configuration. Just tasks.

**The "aha!" moment:**

The first time Alex refreshes the page and their tasks are still there — persistent, reliable, exactly as they left them. That's when physical cards lose.

---

### Secondary Users

Not applicable for v1. The application targets individual users only, with no multi-user, sharing, or collaboration features in scope.

---

### User Journey

**Stage 1 — Discovery**

Alex hears about or finds the app. No marketing friction — they simply open the URL. There is no landing page, no sign-up wall, no pricing page. The app *is* the experience.

**Stage 2 — First Use (Zero Onboarding)**

Alex lands directly on the todo list. The state is empty with a clear, inviting prompt to add the first task. No tutorial, tooltip carousel, or welcome modal. The UI communicates its own affordances.

**Stage 3 — Core Loop**

Alex types a task description and submits it. It appears in the list immediately. Over the course of their day they add more tasks, mark some complete (visually distinguished from active ones), and delete ones they no longer need.

**Stage 4 — The Trust Moment**

Alex closes the browser and returns later — on the same device or a different one. Their tasks are still there, exactly as they left them. This is the moment the app earns Alex's trust over physical cards.

**Stage 5 — Daily Habit**

The app becomes Alex's default task surface. They open it at the start of their day, work through their list, and close it when done. The experience is fast enough and simple enough that it never gets in the way.

---

## Success Metrics

Success for todo-app-bmad is measured across two complementary dimensions: the end-user experience and the technical/project quality bar. Both are equally important — the product must work well for Alex *and* be built well for future developers.

### User Success Metrics

**Primary success indicator:**
A user can complete all four core task-management actions — create, view, complete, and delete — without guidance, errors, or confusion on their first visit.

**Behavioural signals of success:**

- User adds their first task within 30 seconds of opening the app (zero onboarding friction confirmed)
- User completes and deletes tasks in a single session without encountering an error state
- Tasks persist correctly across browser refresh and across sessions — the "trust moment" is achieved
- Completed tasks are immediately visually distinguishable from active ones without any explanation needed
- Empty, loading, and error states are encountered and understood without confusion

**Anti-metrics (signals of failure):**

- User hesitates or looks for a help prompt before taking their first action
- User loses tasks due to a refresh or session boundary
- UI feels laggy or unresponsive on any core interaction

---

### Business Objectives

As a focused personal productivity tool and spec-driven development reference, business objectives are framed around product quality and demonstrable value rather than commercial growth metrics.

**Objective 1 — Deliver a complete, usable core experience**
The v1 release covers the full task lifecycle (create, view, complete, delete) with no critical gaps, broken states, or missing error handling. The product feels finished, not like a demo.

**Objective 2 — Establish a clean, extensible architecture**
The codebase is structured so that future features (authentication, multi-user support, task priorities, deadlines) can be added without architectural rework. Layer boundaries are respected and validated by tooling.

**Objective 3 — Serve as a reproducible full-stack reference**
Any developer familiar with the stack can clone the repository, run it locally, understand the architecture, and extend it — without needing to ask questions.

---

### Key Performance Indicators

**Performance**

| KPI | Target |
|---|---|
| UI interaction response (add, complete, delete) | < 200ms perceived latency |
| API response time under normal conditions | < 300ms p95 |
| Page load to interactive (first visit) | < 2s on standard connection |

**Reliability**

| KPI | Target |
|---|---|
| Task persistence across session/refresh | 100% — zero data loss |
| API error rate under normal conditions | < 1% |
| Graceful error handling coverage | All API failure paths return user-visible feedback |

**Architecture Conformance**

| KPI | Target |
|---|---|
| Dependency-cruiser layer boundary violations | 0 — enforced in CI |
| TypeScript strict mode compliance | 0 type errors on `tsc --noEmit` |
| Biome lint/format violations | 0 — enforced in pre-commit hook |
| Test coverage — backend unit/integration | Core domain and handlers covered |
| E2E scenario coverage | All four core user actions covered by Cucumber scenarios |

---

## MVP Scope

### Core Features

The MVP delivers exactly four user-facing capabilities — no more, no less. Every feature maps directly to a step in Alex's core task-management loop.

| # | Feature | Description |
|---|---|---|
| 1 | **Create a todo** | User enters a short text description and submits. The todo appears in the list immediately. |
| 2 | **View all todos** | On load, the full list of todos is displayed — active and completed — in creation order. |
| 3 | **Complete a todo** | User toggles a todo's completion status. Completed todos are visually distinguished from active ones at a glance. |
| 4 | **Delete a todo** | User removes a todo permanently. The list updates immediately. |

**Todo data model (v1):**
Each todo contains exactly three fields:

- `description` — short text entered by the user
- `completed` — boolean status, toggled by the user
- `createdAt` — server-assigned timestamp (metadata, not displayed to the user in v1)

**UX requirements included in MVP:**

- Empty state — clear, inviting prompt when no todos exist
- Loading state — visible feedback while the list is being fetched
- Error states — user-visible feedback for any API failure (create, complete, delete)
- Mobile-responsive layout — usable on both desktop and mobile viewports
- Instant feedback — all interactions reflect in the UI under 200ms

**API surface included in MVP:**

- `GET /api/v1/todos` — retrieve all todos
- `POST /api/v1/todos` — create a new todo
- `PATCH /api/v1/todos/:id` — update completion status
- `DELETE /api/v1/todos/:id` — delete a todo

---

### Out of Scope for MVP

The following are explicitly deferred. They are not "maybe later" — they are deliberate decisions to protect focus and delivery quality for v1.

| Excluded Feature | Rationale |
|---|---|
| User accounts / authentication | Not needed for single-user personal use; architecture supports adding later |
| Multi-user / collaboration | Out of scope by design for v1 |
| Filtering or hiding completed todos | Adds UI complexity without solving the core problem |
| Editing a todo description | Delete and re-create is acceptable for v1; editing adds form complexity |
| Bulk actions (e.g. delete all completed) | Nice-to-have, not essential for the core loop |
| Manual reordering of todos | Creation order is sufficient for v1 |
| Displaying creation timestamp to the user | Stored in metadata but not surfaced in the UI |
| Task priorities, labels, or categories | Reserved for future richer metadata iteration |
| Due dates or deadlines | Reserved for future richer metadata iteration |
| Notifications or reminders | Reserved for future iteration |
| Offline support | Out of scope for v1 |

---

### MVP Success Criteria

The MVP is considered successful when:

1. A first-time user completes all four core actions (create, view, complete, delete) without guidance or confusion.
2. Tasks persist reliably across browser refreshes and sessions — zero data loss.
3. All UI interactions respond within 200ms under normal conditions.
4. All four core user actions are covered by passing Cucumber E2E scenarios.
5. Zero dependency-cruiser architecture boundary violations in CI.
6. Zero TypeScript or Biome errors — codebase is clean and lintable.
7. The application can be run locally by any developer with a single README-guided setup sequence.

---

### Future Vision

The natural evolution of todo-app-bmad is **richer task metadata** — building on the clean data model and API structure established in v1.

**Likely v2 additions (richer task metadata):**

- Task priorities (high / medium / low)
- Due dates and deadline tracking
- Labels or categories for grouping tasks
- Display of creation timestamp and completion timestamp
- Filtering and sorting by status, priority, or due date

**Architectural readiness for v2:**

- The `todos` database table is designed with extensible columns in mind
- The REST API uses versioned routes (`/api/v1/`) — v2 endpoints can be added without breaking existing clients
- The CQRS module structure makes adding new commands and queries additive, not disruptive
- The Redux feature slice on the frontend can absorb new task fields and filter/sort state without structural changes

**Longer-term possibilities (v3+):**

- User authentication and personal accounts (multi-user support)
- Collaboration and shared lists
- Integrations (calendar, notifications, third-party apps)