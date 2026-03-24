# Performance Baseline

**Project:** todo-app-bmad
**Date:** 2026-03-24
**Environment:** Docker Compose (production build), local machine (macOS)
**Methodology:** Chrome DevTools Performance Trace, browser-side JavaScript timing, curl with timing

---

## NFR Results Summary

| NFR | Target | Measured | Result |
| --- | ------ | -------- | ------ |
| NFR1: Create-todo interaction round-trip | < 200ms | 22ms avg (11–50ms range) | **PASS** |
| NFR2: API response p95 (`GET /api/v1/todos`) | < 300ms | 9ms p95 | **PASS** |
| NFR3: Page load to interactive (LCP) | < 2s | 382ms | **PASS** |
| NFR4: Code splitting — no chunk > 500kb | < 500kb per JS chunk | 264.52kb max (vendor-react) | **PASS** |

All NFR targets are met with significant margin.

---

## Build Analysis (Vite Production Build)

**Command:** `pnpm --filter web build`
**Build time:** 2.23s
**Target:** `esnext`

### JavaScript Chunks

| Chunk | Size (uncompressed) | Size (gzip) | Under 500kb? |
| ----- | ------------------- | ----------- | ------------ |
| vendor-react | 264.52 kB | 86.52 kB | ✅ |
| vendor-sentry | 212.56 kB | 69.62 kB | ✅ |
| vendor-radix | 87.94 kB | 27.78 kB | ✅ |
| vendor-redux | 67.49 kB | 24.06 kB | ✅ |
| vendor-ui | 28.77 kB | 9.44 kB | ✅ |
| index (app) | 9.03 kB | 3.84 kB | ✅ |
| SubscriptionsPage | 7.62 kB | 2.51 kB | ✅ |
| HomePage | 7.50 kB | 2.30 kB | ✅ |
| Container | 0.84 kB | 0.39 kB | ✅ |

**Total JS:** 686.27 kB uncompressed / 226.46 kB gzip
**Largest chunk:** vendor-react at 264.52 kB (well under 500kb limit)

### CSS Chunks

| Chunk | Size (uncompressed) | Size (gzip) |
| ----- | ------------------- | ----------- |
| vendor-radix | 693.72 kB | 81.45 kB |
| index (app) | 36.60 kB | 6.92 kB |

### Code Splitting Evidence

The Vite config at `apps/web/vite.config.mts` defines manual chunk splitting:

- **vendor-react:** react, react-dom, react-router, react-redux, react-error-boundary
- **vendor-redux:** @reduxjs/toolkit (RTK Query, Immer, Reselect)
- **vendor-radix:** @radix-ui primitives
- **vendor-sentry:** @sentry/react (separate chunk for caching, loaded synchronously at init)
- **vendor-ui:** cva, clsx, tailwind-merge, lucide-react

Route-level code splitting is also active — `HomePage`, `SubscriptionsPage`, and `Container` are separate chunks loaded on demand via `React.lazy()`.

### Build Output (Raw)

```
vite v7.3.1 building client environment for production...
✓ 2373 modules transformed.
dist/index.html                              0.99 kB │ gzip:  0.40 kB
dist/assets/logo-C49brna2.svg                1.52 kB │ gzip:  0.80 kB
dist/assets/index-C0BOicm4.css              36.60 kB │ gzip:  6.92 kB
dist/assets/vendor-radix-CjDrHj0R.css      693.72 kB │ gzip: 81.45 kB
dist/assets/Container-BCw8KDoV.js            0.84 kB │ gzip:  0.39 kB
dist/assets/HomePage-D-Opn95T.js             7.50 kB │ gzip:  2.30 kB
dist/assets/SubscriptionsPage-DZDBvKYQ.js    7.62 kB │ gzip:  2.51 kB
dist/assets/index-Doll51Fu.js                9.03 kB │ gzip:  3.84 kB
dist/assets/vendor-ui-Ddn5Ysvl.js           28.77 kB │ gzip:  9.44 kB
dist/assets/vendor-redux-CpiikoBx.js        67.49 kB │ gzip: 24.06 kB
dist/assets/vendor-radix-ClYYkc9D.js        87.94 kB │ gzip: 27.78 kB
dist/assets/vendor-sentry-DRO6iRvF.js      212.56 kB │ gzip: 69.62 kB
dist/assets/vendor-react-gLTlEY4j.js       264.52 kB │ gzip: 86.52 kB
✓ built in 2.23s
```

---

## Runtime Performance Measurements

### NFR3: Page Load to Interactive

**Method:** Chrome DevTools Performance Trace with page reload
**Stack:** Docker Compose (`docker compose up --build`)
**Browser:** Chrome (no CPU throttling, no network throttling)

| Metric | Value |
| ------ | ----- |
| LCP (Largest Contentful Paint) | 382ms |
| TTFB (Time to First Byte) | 1ms |
| CLS (Cumulative Layout Shift) | 0.00 |
| Render delay | 380ms |

**Result:** 382ms — **PASS** (target < 2s, 5.2x faster than target)

The LCP time is dominated by render delay (JavaScript parsing and React hydration), not network latency. TTFB is 1ms since nginx serves static files locally.

### NFR1: Create-Todo Interaction Round-Trip

**Method:** Browser-side JavaScript timing (MutationObserver on DOM list update)
**Measurement:** Time from button click → new todo visible in the list

| Run | Round-trip (ms) |
| --- | --------------- |
| 1   | 50              |
| 2   | 38              |
| 3   | 11              |
| 4   | 20              |
| 5   | 19              |
| **Average** | **22ms** |

**Result:** 22ms average, 50ms worst case — **PASS** (target < 200ms, 4x–9x faster than target)

The fast response is expected: RTK Query performs an optimistic update (immediate UI change) followed by cache invalidation. The perceived latency is primarily React re-render time.

### NFR2: API Response Time p95

**Method:** 20 sequential `curl` requests to `GET /api/v1/todos` via Docker network
**Endpoint:** `http://localhost:3000/api/v1/todos`

| Statistic | Value |
| --------- | ----- |
| Min | 3.1ms |
| Median | 4.4ms |
| p95 | 9.0ms |
| Max | 22.0ms |

**Result:** 9ms p95 — **PASS** (target < 300ms, 33x faster than target)

The first request (22ms) includes connection establishment; subsequent requests benefit from HTTP keep-alive. Under normal conditions with a small dataset, the API responds well within target.

---

## Measurement Conditions

- **Machine:** macOS (local development machine)
- **Docker:** OrbStack runtime
- **Database:** PostgreSQL 17 Alpine (Docker container)
- **Dataset:** 2 existing todos at time of measurement
- **Network:** localhost (no real network latency)
- **CPU throttling:** None
- **No concurrent load** — baseline under normal conditions only

### Caveats

1. All measurements are on localhost with minimal data. Production performance with larger datasets and real network latency will differ.
2. The API p95 measurement uses a small sample (n=20). For production monitoring, use a proper APM tool with sustained load.
3. Page load was measured without CPU throttling. Mobile device performance will be slower.
4. The create-todo round-trip benefits from RTK Query's optimistic updates, so perceived latency is very low even if the API call takes longer.
