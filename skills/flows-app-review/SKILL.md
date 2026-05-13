---
name: flows-app-review
description: >-
  Run a full Flows app platform review against a React/TypeScript CDF codebase.
  Produces three artifacts: review-files.md (per-file inventory), review-packages.md
  (dependency audit), and review-report.md (scored report with must/should/nice-fix
  items). Use when the user asks for a Flows app review, pre-submit review, approval
  review, app certification review, code quality audit, CDF platform review, or
  "run dune-review" on a codebase before submission.
allowed-tools: Read, Glob, Grep, Shell, Write
---

# Flows App Review

Review the **entire application codebase** against the Flows app platform scoring criteria below.
Produce three artifacts: `review-files.md`, `review-packages.md`, and `review-report.md`.

Write artifacts to `reviews/flows-app-review/feedback-round-<N>/`. If no prior round exists, use `feedback-round-1`. For reruns, increment N.

---

## Phase 1: Load ALL guidance before reviewing

**Complete this phase before any scoring or evaluation begins.**

### 1.1 Read the locally-installed skills

Read every applicable skill file from `.claude/skills/`. At minimum, always read:

- `.claude/skills/dm-limits-and-best-practices/SKILL.md` — DMS concurrency limits, QueuedTaskRunner/semaphore pattern, pagination, search vs filter, batching
- `.claude/skills/code-quality/SKILL.md` — linting, `any` types, component size, DRY, naming, dead code
- `.claude/skills/correctness-and-error-handling/SKILL.md` — ErrorBoundary, async error handling, loading/error/empty states, useEffect cleanup, edge cases
- `.claude/skills/security/SKILL.md` — XSS, credentials, dangerous DOM APIs, input validation, dependency audit
- `.claude/skills/performance/SKILL.md` — re-renders, CDF query optimization, virtualization, code splitting, bundle size
- `.claude/skills/design/SKILL.md` — Aura usage, component picking guidance
- `.claude/skills/setup-flows-auth/SKILL.md` — DuneAuthProvider, useDune hook, Vite config

Read others if the app touches their domain:
- `.claude/skills/integrate-atlas-chat/SKILL.md` — for AI agent apps
- `.claude/skills/dependencies-audit/SKILL.md` — for deep package health analysis

If a skill file is not installed (path does not exist), skip it and proceed.

### 1.2 Identify the app scope

Find the app root directory (the directory containing `package.json`). If it is a monorepo, identify which app is under review from the directory structure. State clearly which app directory you are reviewing.

### 1.3 Create a review checklist

Before starting, create tasks for every phase and step below to ensure nothing is skipped.

---

## Scoring criteria

Each criterion uses a **1–5** scale:

| Score | Meaning |
| ----- | ------- |
| **5** | Meets or exceeds expectations; nothing material to fix. |
| **4** | Solid; minor gaps, acceptable risk, or easy follow-ups. |
| **3** | Acceptable with explicit tracked follow-up. |
| **2** | Significant risk; should block release. |
| **1** | Unacceptable; must be addressed before any deployment. |

---

### Area 1: Protect the user and the customer

#### 1.1 No known bugs

**Check:** Open issues linked to the change set, obvious regressions, error paths untested, or "TODO: fix" in critical paths.

| Score | Why |
| ----- | --- |
| 5 | No known bugs; error paths tested; no TODO:fix in critical code. |
| 4 | Minor edge-case issues only; no user-impacting regressions. |
| 3 | One or two known issues with low user impact. |
| 2 | Known bug that affects core functionality or data correctness. |
| 1 | Critical bug — data loss, auth bypass, or crash on the happy path. |

#### 1.2 CDF access via Cognite SDK only

**Check:** All traffic to CDF goes through the official Cognite SDK. Flag any HTTP/WebSocket or other network call to CDF-like hosts that bypasses the SDK (hand-rolled `fetch`/`axios`/raw REST to CDF URLs, custom auth headers to CDF). Legitimate non-CDF calls (static assets, documented third-party APIs) should be explicit, documented, and expected — but CDF must be SDK-only.

| Score | Why |
| ----- | --- |
| 5 | All CDF calls via SDK; non-CDF calls are documented and expected. |
| 4 | SDK used throughout; one minor undocumented non-CDF call. |
| 3 | Mostly SDK; some auxiliary calls bypass it with low risk. |
| 2 | CDF endpoints called directly without SDK in meaningful paths. |
| 1 | Core functionality bypasses the SDK entirely. |

#### 1.3 Dependencies and packages

**Check:** `package.json` / lockfiles / transitive deps; unmaintained packages, duplicate majors, known CVEs, license issues, and scripts that run on install.

| Score | Why |
| ----- | --- |
| 5 | All deps healthy, up to date, no CVEs, no deprecated packages. |
| 4 | Minor version drift or one low-severity CVE; no blockers. |
| 3 | Some outdated deps or moderate CVE; tracked for follow-up. |
| 2 | High-severity CVE or significantly unmaintained dependency. |
| 1 | Critical CVE, license violation, or malicious install script. |

#### 1.4 Test coverage

**Check:** Unit and integration tests for critical logic, API contracts, and error handling; meaningful assertions; CI runs tests; coverage is adequate for risk.

**Hard gate:** Test coverage tooling **must** be configured and working (e.g. `vitest.config.ts` with a `coverage` section). The test suite must produce a coverage report, and **overall line coverage must be at least 80%** for the app to be approved. Apps below this threshold receive a score of 1–2 and are listed as **must fix**.

| Score | Why |
| ----- | --- |
| 5 | ≥80% coverage; tests cover critical paths and error states; CI green. |
| 4 | ≥80% coverage; a few non-critical paths untested. |
| 3 | Coverage tooling configured; coverage 60–79% with tracked gaps. |
| 2 | Coverage below 60% or critical paths untested. |
| 1 | No tests, no coverage tooling, or test suite does not run. |

#### 1.5 Dead code and maintainability

**Check:** Unused exports, unreachable branches, commented-out blocks, duplicate utilities, and features never referenced.

**Hard gate:** Unreachable pages, entirely unused files, and significant dead code blocks **must** be removed before approval. Apps with dead pages or large unused modules receive a score of 1–2 and are listed as **must fix**.

| Score | Why |
| ----- | --- |
| 5 | No dead code; clean, reachable dependency graph. |
| 4 | Minor unused exports or commented-out snippets; easy cleanup. |
| 3 | Some dead utilities or commented blocks; tracked for follow-up. |
| 2 | Significant dead code (unused pages, duplicate utilities). |
| 1 | Large sections of unreachable code or dead-linked pages. |

#### 1.6 Coding patterns and testability

**Check:** The codebase follows patterns that keep code testable, maintainable, and consistent. Three core patterns are expected:

1. **Dependency injection via React context** — hooks declare dependencies through a context type and consume them via `useContext`, not direct imports. This enables testing without module-level mocks.
2. **Interface-based services** — services implement explicit TypeScript interfaces.
3. **ViewModel separation** — page components delegate logic to a ViewModel hook rather than mixing data fetching with rendering.

**Hard gate:** Pervasive use of hard-coded dependencies with no DI path is a **must fix**.

| Score | Why |
| ----- | --- |
| 5 | All three patterns present; context injection throughout; no `vi.mock` overuse. |
| 4 | Mostly DI; one or two direct imports in non-critical hooks. |
| 3 | Partial DI; `vi.mock` used without justification in several places. |
| 2 | No DI pattern; all hooks import services directly; hard to test. |
| 1 | Completely untestable; no separation of concerns; no interfaces. |

---

### Area 2: Protect Cognite services

#### 2.1 Data Modeling query patterns (search / query vs heavier paths)

**Check:** For read-heavy workloads where filters and product semantics allow, prefer APIs that hit the search-appropriate path (`query` or `search` on instances) so work is pushed to Elasticsearch rather than overusing relational/list paths that stress Postgres unnecessarily. When the app writes or needs semantics only available on another endpoint, that choice should be justified.

| Score | Why |
| ----- | --- |
| 5 | Search/query used appropriately; path choices match data semantics. |
| 4 | Mostly correct path selection; one minor suboptimal choice. |
| 3 | Some cases where list is used where search/query would be correct. |
| 2 | Consistent misuse of list for text-search workloads; Postgres risk. |
| 1 | All reads go through list regardless of workload type. |

#### 2.2 Server-side filtering; avoid bulk fetch-and-filter on the client

**Check:** Filters, limits, and projections are applied in the API request where possible — not by downloading large result sets and filtering in the browser.

| Score | Why |
| ----- | --- |
| 5 | All filtering pushed to API; projections used; no client-side bulk scans. |
| 4 | Mostly server-side; one minor client-side filter on a small dataset. |
| 3 | Some client-side filtering on medium datasets; acceptable risk. |
| 2 | Significant client-side filtering; large result sets loaded unnecessarily. |
| 1 | All filtering done client-side; full collections downloaded on load. |

#### 2.3 Limits, pagination, and prefetch

**Check:** Low, explicit limits; cursor- or page-based retrieval; no aggressive prefetch of pages the user may never need; avoid loading "everything" up front.

| Score | Why |
| ----- | --- |
| 5 | All lists paginated; explicit limits; no unbounded prefetch. |
| 4 | Pagination present; one or two high-but-bounded limits. |
| 3 | Pagination missing on a low-traffic path; noted for follow-up. |
| 2 | Key paths load all data without pagination; scalability risk. |
| 1 | No pagination anywhere; loads entire collections on render. |

#### 2.4 Rate of calls — do not hammer DMS

**Check:** Debouncing, batching, caching (where correct), avoiding tight loops of identical requests, and not re-fetching on every render without need.

| Score | Why |
| ----- | --- |
| 5 | Request rate is proportional to user intent; caching and deduplication where appropriate. |
| 4 | Mostly fine; a hot path could batch or debounce slightly. |
| 3 | Chatty UI or polling without backoff; risk under concurrent users. |
| 2 | Clear risk of overwhelming DMS or shared quotas. |
| 1 | Tight loops, runaway polling, or duplicate parallel identical calls. |

#### 2.5 Throttling and 429 responses — backoff with jitter

**Check:** On 429 (or similar rate-limit signals), clients use exponential backoff with jitter, respect `Retry-After` when present, and avoid synchronized retries that amplify load.

| Score | Why |
| ----- | --- |
| 5 | Backoff + jitter implemented; retries are bounded; user-visible behavior degrades gracefully. |
| 4 | Backoff exists; jitter or caps could be improved. |
| 3 | Naive fixed-interval retries or missing handling for throttling. |
| 2 | Aggressive retries on 429; thundering herd risk. |
| 1 | No handling; infinite or immediate tight retries on errors. |

---

### Area 3: Protect the brand

#### 3.1 Aura design system

**Check:** Prefer Aura components and tokens for layout, forms, tables, feedback, and typography when they fit the use case; custom UI should still align with Aura spacing, color, and interaction patterns where applicable.

| Score | Why |
| ----- | --- |
| 5 | Aura used consistently; custom pieces match design language. |
| 4 | Mostly Aura; isolated custom widgets with acceptable alignment. |
| 3 | Mix of ad-hoc UI and Aura; some inconsistency for users. |
| 2 | Largely non-Aura; visually disconnected from platform. |
| 1 | Clashing patterns, inaccessible controls, or no alignment with Aura when feasible. |

**Reviewer note:** A score of 3 does **not** block initial approval. Accessibility gaps (missing `aria-label`, unlabeled form inputs) should be escalated to **Should fix** items. Full Aura migration is a "Nice to fix" follow-up unless the app is replacing an existing Aura-based UI.

---

## Phase 2: Perform the review

### Step 1: Build the file inventory (`review-files.md`)

List **all `.ts` and `.tsx` files** in the app. For each file, assess:

- **Structure** (1–5): file size, single responsibility, clear organization, no mixed concerns
- **Quality** (1–5): type safety, no `any`/`unknown` casts, proper error handling, no dead code, clean naming
- **Patterns** (1–5 or N/A): DI/testability, correct platform patterns (SDK usage, DMS query style), no anti-patterns; `N/A` for pure utils/types with no external dependencies
- **Tests**: `✓` adequate coverage | `⚠` has tests but with meaningful gaps | `✗` missing test file | `N/A` presentational-only or barrel export

Include criterion refs (e.g. `1.4`, `2.3`) in Notes where relevant.

While building the inventory, note for each non-trivial file:
- **Test file exists?** — `.test.ts` / `.spec.ts` counterpart?
- **Context injection?** — does the hook declare dependencies via context or import directly?
- **Interface-based?** — does the service implement an explicit TypeScript interface?
- **ViewModel separation?** — does the page component delegate logic to a ViewModel hook?

### Step 2: Build the package inventory (`review-packages.md`)

List every package from `package.json` (`dependencies` and `devDependencies`). For each package, look up:
- **Weekly downloads** from npm (`npm view <pkg> --json`)
- **Latest version** vs the version used
- **Last publish date**
- **Deprecated** status

Assign health: **Pass** (popular, recent, not deprecated, near-current) / **Warn** (10k–100k downloads, or >12 months old, or >1 major behind) / **Fail** (<10k downloads, or no update in 2+ years, or deprecated, or known CVE).

Run `npm audit --json` (or `pnpm audit --json`) for CVEs. Any CVE = automatic Fail.

### Step 3: Assess test coverage

Run the test suite with coverage:
```bash
npx vitest run --coverage   # Vite/Vitest projects
npx jest --coverage         # Jest projects
npm test -- --coverage      # generic fallback
```

Record: framework, tests run (pass/fail/skip), coverage percentages (statements/branches/functions/lines). If tests fail to run or no framework is configured, note that explicitly — **absence of a working test setup is a finding for criterion 1.4**.

### Step 4: File-by-file evaluation

Go through `review-files.md` file by file. For each file, evaluate the applicable criteria from the scoring sections above and apply the checklists from the skills read in Phase 1:

- DM limits checklist (QueuedTaskRunner, pagination, search vs filter, batching)
- Correctness checklist (ErrorBoundary, isError/isLoading/empty handling, useEffect cleanup, null safety)
- Security checklist (dangerouslySetInnerHTML, credentials, input validation)
- Code quality checklist (`any` types, component size, dead code, naming)
- Performance checklist (re-renders, unbounded queries, missing virtualization)

### Step 5: Aggregate into the review report (`review-report.md`)

Produce the final report following the template below. Ensure:
- All 12 criteria are scored
- Every must-fix item has an `_Impact:_` note
- Categorization follows the guidance below (score 1–2 = must fix, 3 = should fix, 4 = nice to fix)

---

## Output artifact templates

### `review-files.md`

```markdown
## File inventory: [app name]

| File | Structure | Quality | Patterns | Tests | Notes |
| ---- | --------- | ------- | -------- | ----- | ----- |
| src/main.tsx | 5 | 5 | N/A | N/A | Clean entry point |
| src/services/cdfHelper.ts | 3 | 2 | 2 | ✗ | No DI; raw SDK calls; no test file (1.2, 1.6, 2.5) |
| src/hooks/useData.ts | 4 | 3 | 3 | ⚠ | Direct import; 4 tests but no error path (1.4, 1.6, 2.3) |
| src/utils/chunking.ts | 5 | 5 | N/A | ✓ | Pure functions; full coverage |
| src/contexts/index.ts | 5 | 5 | N/A | N/A | Barrel re-export only |
```

### `review-packages.md`

```markdown
## Package audit: [app name]

### Dependencies

| Package | Used version | Latest | Weekly downloads | Last published | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------------- | -------------- | ---------- | ---- | ------ |
| react | ^18.2.0 | 18.3.1 | 25M | 2024-04-26 | No | 0 | Pass |
| some-old-lib | ^1.0.0 | 1.0.3 | 5k | 2021-03-15 | No | 0 | Fail |

### Security audit

| Severity | Count |
| -------- | ----- |
| Critical | 0 |
| High | 0 |
| Moderate | 0 |
| Low | 0 |

#### Vulnerabilities

| Package | Severity | Title | Patched in | Advisory |
| ------- | -------- | ----- | ---------- | -------- |
```

### `review-report.md`

```markdown
# [App name] — Flows app review

This document is the platform review for [App name], conducted as part of the Flows app approval process.

## What this review covers

Flows apps run inside Cognite Data Fusion and are distributed to customers. The review checks three areas:

- **Protect the user and the customer** — no known bugs, correct SDK usage, healthy dependencies, adequate test coverage, and a clean codebase.
- **Protect Cognite services** — efficient DMS query patterns, server-side filtering, bounded pagination, and graceful rate-limit handling.
- **Protect the brand** — UI consistency with the Aura design system.

Scores are 1–5. A score of **1–2** on any criterion is a blocker. Score 3 is acceptable for approval with tracked follow-up. Scores 4–5 are good.

## Path to approval

This review found **[N] must-fix item(s)** that block approval. [One sentence on should-fix count and overall state.] Once the must-fix items are addressed, please request a re-review.

---

## Review details

### Summary
[2–4 sentences: positives first, then a clear statement of blocking issues]

### Reviewed commit
`<full SHA>` ([link to commit on GitHub if available, otherwise local path])

### Test coverage
- **Framework:** [Vitest / Jest / None]
- **Tests run:** [N passed, N failed, N skipped — or "no tests found"]
- **Coverage:** [Statements: X% | Branches: X% | Functions: X% | Lines: X%]
- **Notable gaps:** [uncovered critical paths, or "N/A"]

### Package & security summary
- **Total packages:** [N] dependencies, [N] devDependencies
- **Health:** [N] pass, [N] warn, [N] fail
- **Vulnerabilities:** [N] critical, [N] high, [N] moderate, [N] low
- **Notable issues:** [brief list, or "None"]
- Full details: see `review-packages.md`

### Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | /5 | |
| User & customer | 1.2 CDF via SDK | /5 | |
| User & customer | 1.3 Packages | /5 | |
| User & customer | 1.4 Tests & coverage | /5 | |
| User & customer | 1.5 Dead code | /5 | |
| User & customer | 1.6 Patterns & testability | /5 | |
| Cognite services | 2.1 DMS query patterns | /5 | |
| Cognite services | 2.2 Server-side filter | /5 | |
| Cognite services | 2.3 Limits & pages | /5 | |
| Cognite services | 2.4 Call rate | /5 | |
| Cognite services | 2.5 429 backoff | /5 | |
| Brand | 3.1 Aura | /5 | |

### Must fix before deploy
- [ ] [description] — [file:line] — [criterion ref]
  _Impact: [user-visible or customer consequence]_

### Should fix before deploy
- [ ] [description] — [file:line] — [criterion ref]

### Nice to fix before deploy
- [ ] [description] — [file:line] — [criterion ref]
```

---

## Categorization guidance

- **Must fix** (score 1–2): security issues, data corruption risks, broken core flows, unbounded API calls, missing SDK usage for CDF, test coverage below 80% or coverage tooling not configured, unreachable pages or significant dead code, pervasive hard-coded dependencies with no DI path. For each must-fix item, include a one-sentence **`_Impact:_`** note explaining the user-visible or customer consequence.
- **Should fix** (score 3): missing test files for non-trivial services/hooks/utils, missing tests for critical paths, client-side filtering of large datasets, missing backoff/retry, accessibility gaps, `vi.mock` overuse without justification.
- **Nice to fix** (score 4 gaps): minor Aura inconsistencies, small cleanup opportunities, non-critical package updates, minor dead exports.

---

## Phase 3: Verify

After writing all three artifacts, independently verify the review is complete and accurate. **Do not trust the review at face value — verify claims by reading the actual source code.**

### Format compliance

**review-report.md:**
- [ ] Title: `# [App name] — Flows app review`
- [ ] "What this review covers" section present
- [ ] "Path to approval" with must-fix count + one sentence on should-fix
- [ ] Summary section (2–4 sentences, positives first)
- [ ] Test coverage section: Framework, Tests run, Coverage (or explanation), Notable gaps
- [ ] Package & security summary present
- [ ] Scores table has **all 12 criteria** (1.1–1.6, 2.1–2.5, 3.1)
- [ ] Must fix / Should fix / Nice to fix sections present
- [ ] Every must-fix item has an **`_Impact:_`** note
- [ ] Must-fix count in "Path to approval" matches actual must-fix items

**review-files.md:**
- [ ] All columns present: File, Structure, Quality, Patterns, Tests, Notes
- [ ] Every `.ts`/`.tsx` file in the app is listed
- [ ] Criterion refs in Notes where relevant
- [ ] Non-trivial files without tests marked `✗`

**review-packages.md:**
- [ ] All columns present: Package, Used version, Latest, Weekly downloads, Last published, Deprecated, CVEs, Health
- [ ] Every package from both `dependencies` and `devDependencies` listed
- [ ] Security audit summary table present
- [ ] Health summary with pass/warn/fail counts

### Score accuracy

For each of the 12 criteria, verify the score matches the rubric:
- [ ] Does the Notes evidence actually support this score level?
- [ ] Is a score of 1–2 reflected as a must-fix item?
- [ ] Is a score of 3 reflected as a should-fix item?
- [ ] Are there findings in the file inventory that contradict the score?

### Skill checklist verification

**dm-limits-and-best-practices:**
- [ ] Checked for QueuedTaskRunner/semaphore usage
- [ ] Checked all `instances.list` calls for cursor pagination
- [ ] Checked that `instances.search` is used for text matching (not `list`)
- [ ] Checked write operations are batched ≤1000
- [ ] Checked for unbounded `Promise.all` on raw API calls

**correctness-and-error-handling:**
- [ ] Checked for a top-level ErrorBoundary
- [ ] Checked that data-consuming components handle isLoading/isError/empty
- [ ] Checked useEffect cleanup (timers, listeners, async)
- [ ] Checked for null/undefined safety on CDF data access

**security:**
- [ ] Checked for hardcoded secrets
- [ ] Checked `dangerouslySetInnerHTML` is sanitized
- [ ] Checked for `eval`/`new Function`
- [ ] Ran or referenced a dependency audit

**code-quality:**
- [ ] Flagged `any` types
- [ ] Flagged components >150 lines
- [ ] Checked for dead code and commented-out blocks

**design (Aura):**
- [ ] Assessed Aura usage vs custom UI
- [ ] Aura score of 3 does not block approval (reviewer note applied)

### Spot-check findings

Pick **3 must-fix items** and **2 should-fix items**. For each:
1. Read the cited file and line number
2. Verify the issue actually exists as described
3. Verify the criterion reference is correct
4. Verify the categorization follows the guidance above

Pick **2 files scored 5/5** in the file inventory. Read them and verify nothing was missed.

### Verdict

Produce a brief verification summary at the end of `review-report.md`:

```
---
## Verification

**Format compliance:** [PASS / issues listed]
**Score accuracy:** [PASS / mismatches listed]
**Checklist coverage:** [PASS / gaps listed]
**Spot-checks:** [PASS / FAIL with explanation]

**Verdict:** [PASS | PASS WITH NOTES — minor gaps listed | FAIL — items to fix listed]
```

If the verdict is FAIL, fix the issues in the artifacts before declaring the review complete.
