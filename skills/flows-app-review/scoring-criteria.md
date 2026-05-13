# Flows App Review — Scoring Criteria

Each criterion uses a **1–5** scale:

| Score | Meaning |
| ----- | ------- |
| **5** | Meets or exceeds expectations; nothing material to fix. |
| **4** | Solid; minor gaps, acceptable risk, or easy follow-ups. |
| **3** | Acceptable with explicit tracked follow-up. |
| **2** | Significant risk; should block release. |
| **1** | Unacceptable; must be addressed before any deployment. |

---

## Area 1: Protect the user and the customer

### 1.1 No known bugs

**Check:** Open issues linked to the change set, obvious regressions, error paths untested, or "TODO: fix" in critical paths.

| Score | Why |
| ----- | --- |
| 5 | No known bugs; error paths tested; no TODO:fix in critical code. |
| 4 | Minor edge-case issues only; no user-impacting regressions. |
| 3 | One or two known issues with low user impact. |
| 2 | Known bug that affects core functionality or data correctness. |
| 1 | Critical bug — data loss, auth bypass, or crash on the happy path. |

### 1.2 CDF access via Cognite SDK only

**Check:** All traffic to CDF goes through the official Cognite SDK. Flag any HTTP/WebSocket or network call to CDF-like hosts that bypasses the SDK (hand-rolled `fetch`/`axios`/raw REST to CDF URLs, custom auth headers to CDF). Legitimate non-CDF calls (static assets, documented third-party APIs) should be explicit, documented, and expected.

| Score | Why |
| ----- | --- |
| 5 | All CDF calls via SDK; non-CDF calls are documented and expected. |
| 4 | SDK used throughout; one minor undocumented non-CDF call. |
| 3 | Mostly SDK; some auxiliary calls bypass it with low risk. |
| 2 | CDF endpoints called directly without SDK in meaningful paths. |
| 1 | Core functionality bypasses the SDK entirely. |

### 1.3 Dependencies and packages

**Check:** `package.json` / lockfiles / transitive deps; unmaintained packages, duplicate majors, known CVEs, license issues, and scripts that run on install.

Package health thresholds:
- **Pass**: >100k weekly downloads, updated within 12 months, not deprecated, version near-current
- **Warn**: 10k–100k downloads, or >12 months since last publish, or >1 major version behind
- **Fail**: <10k downloads, or no update in 2+ years, or deprecated, or any known CVE

| Score | Why |
| ----- | --- |
| 5 | All deps healthy, up to date, no CVEs, no deprecated packages. |
| 4 | Minor version drift or one low-severity CVE; no blockers. |
| 3 | Some outdated deps or moderate CVE; tracked for follow-up. |
| 2 | High-severity CVE or significantly unmaintained dependency. |
| 1 | Critical CVE, license violation, or malicious install script. |

### 1.4 Test coverage

**Check:** Unit and integration tests for critical logic, API contracts, and error handling; meaningful assertions; CI runs tests; coverage adequate for risk.

**Hard gate:** Coverage tooling **must** be configured and working. The test suite must produce a coverage report and **overall line coverage must be ≥80%**. Apps below this threshold receive a score of 1–2 and are listed as **must fix**.

| Score | Why |
| ----- | --- |
| 5 | ≥80% coverage; critical paths and error states tested; CI green. |
| 4 | ≥80% coverage; a few non-critical paths untested. |
| 3 | Coverage tooling configured; coverage 60–79% with tracked gaps. |
| 2 | Coverage below 60% or critical paths untested. |
| 1 | No tests, no coverage tooling, or test suite does not run. |

### 1.5 Dead code and maintainability

**Check:** Unused exports, unreachable branches, commented-out blocks, duplicate utilities, and features never referenced.

**Hard gate:** Unreachable pages, entirely unused files, and significant dead code blocks **must** be removed before approval. Apps with dead pages or large unused modules receive a score of 1–2 and are listed as **must fix**.

| Score | Why |
| ----- | --- |
| 5 | No dead code; clean, reachable dependency graph. |
| 4 | Minor unused exports or commented-out snippets; easy cleanup. |
| 3 | Some dead utilities or commented blocks; tracked for follow-up. |
| 2 | Significant dead code (unused pages, duplicate utilities). |
| 1 | Large sections of unreachable code or dead-linked pages. |

### 1.6 Coding patterns and testability

**Check:** Three core patterns are expected:

1. **Dependency injection via React context** — hooks declare dependencies via `useContext`, not direct imports. Enables testing without module-level mocks.
2. **Interface-based services** — services implement explicit TypeScript interfaces.
3. **ViewModel separation** — page components delegate logic to a ViewModel hook; no data fetching mixed with rendering.

**Hard gate:** Pervasive use of hard-coded dependencies with no DI path is a **must fix**.

| Score | Why |
| ----- | --- |
| 5 | All three patterns present; context injection throughout; no `vi.mock` overuse. |
| 4 | Mostly DI; one or two direct imports in non-critical hooks. |
| 3 | Partial DI; `vi.mock` used without justification in several places. |
| 2 | No DI pattern; all hooks import services directly; hard to test. |
| 1 | Completely untestable; no separation of concerns; no interfaces. |

---

## Area 2: Protect Cognite services

### 2.1 Data Modeling query patterns

**Check:** Prefer `query` or `search` on instances for read-heavy workloads so work is pushed to Elasticsearch rather than overusing `list` paths that stress Postgres. Justify any choice to use a heavier path.

| Score | Why |
| ----- | --- |
| 5 | Search/query used appropriately; path choices match data semantics. |
| 4 | Mostly correct; one minor suboptimal choice. |
| 3 | Some cases where `list` is used where `search`/`query` would be correct. |
| 2 | Consistent misuse of `list` for text-search workloads; Postgres risk. |
| 1 | All reads go through `list` regardless of workload type. |

### 2.2 Server-side filtering

**Check:** Filters, limits, and projections are applied in the API request — not by downloading large result sets and filtering in the browser.

| Score | Why |
| ----- | --- |
| 5 | All filtering pushed to API; projections used; no client-side bulk scans. |
| 4 | Mostly server-side; one minor client-side filter on a small dataset. |
| 3 | Some client-side filtering on medium datasets; acceptable risk. |
| 2 | Significant client-side filtering; large result sets loaded unnecessarily. |
| 1 | All filtering done client-side; full collections downloaded on load. |

### 2.3 Limits, pagination, and prefetch

**Check:** Low, explicit limits; cursor- or page-based retrieval; no aggressive prefetch; avoid loading "everything" up front.

| Score | Why |
| ----- | --- |
| 5 | All lists paginated; explicit limits; no unbounded prefetch. |
| 4 | Pagination present; one or two high-but-bounded limits. |
| 3 | Pagination missing on a low-traffic path; noted for follow-up. |
| 2 | Key paths load all data without pagination; scalability risk. |
| 1 | No pagination anywhere; loads entire collections on render. |

### 2.4 Rate of calls

**Check:** Debouncing, batching, caching, avoiding tight loops of identical requests, not re-fetching on every render.

| Score | Why |
| ----- | --- |
| 5 | Request rate proportional to user intent; caching and deduplication where appropriate. |
| 4 | Mostly fine; a hot path could batch or debounce slightly. |
| 3 | Chatty UI or polling without backoff; risk under concurrent users. |
| 2 | Clear risk of overwhelming DMS or shared quotas. |
| 1 | Tight loops, runaway polling, or duplicate parallel identical calls. |

### 2.5 Throttling and 429 responses

**Check:** On 429, clients use exponential backoff with jitter, respect `Retry-After` when present, and avoid synchronized retries.

| Score | Why |
| ----- | --- |
| 5 | Backoff + jitter implemented; retries bounded; behavior degrades gracefully. |
| 4 | Backoff exists; jitter or caps could be improved. |
| 3 | Naive fixed-interval retries or missing throttling handling. |
| 2 | Aggressive retries on 429; thundering herd risk. |
| 1 | No handling; infinite or immediate tight retries on errors. |

---

## Area 3: Protect the brand

### 3.1 Aura design system

**Check:** Prefer Aura components and tokens for layout, forms, tables, feedback, and typography. Custom UI should still align with Aura spacing, color, and interaction patterns.

| Score | Why |
| ----- | --- |
| 5 | Aura used consistently; custom pieces match design language. |
| 4 | Mostly Aura; isolated custom widgets with acceptable alignment. |
| 3 | Mix of ad-hoc UI and Aura; some inconsistency for users. |
| 2 | Largely non-Aura; visually disconnected from platform. |
| 1 | Clashing patterns, inaccessible controls, or no alignment with Aura when feasible. |

**Reviewer note:** A score of 3 does **not** block initial approval. Accessibility gaps (missing `aria-label`, unlabeled form inputs) should be escalated to **Should fix** regardless. Full Aura migration is a "Nice to fix" follow-up unless the app is replacing an existing Aura-based UI.

---

## Categorization guidance

- **Must fix** (score 1–2): security issues, data corruption risks, broken core flows, unbounded API calls, missing SDK usage for CDF, test coverage below 80% or coverage tooling not configured, unreachable pages or significant dead code, pervasive hard-coded dependencies with no DI path. Include a one-sentence **`_Impact:_`** note on the user-visible or customer consequence for every must-fix item.
- **Should fix** (score 3): missing test files for non-trivial services/hooks/utils, client-side filtering of large datasets, missing backoff/retry, accessibility gaps, `vi.mock` overuse without justification.
- **Nice to fix** (score 4 gaps): minor Aura inconsistencies, small cleanup opportunities, non-critical package updates, minor dead exports.
