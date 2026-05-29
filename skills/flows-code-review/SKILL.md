---
name: flows-code-review
description: >-
  Run the technical (code) review step of Flows app certification. Produces three
  artifacts under reviews/code-review/feedback-round-<N>/: review-files.md
  (per-file inventory), review-packages.md (dependency audit), and
  code-review-report.md (scored report with Must Fix / Should Fix / Nice Fix
  items). Use when the user asks for a Flows code review, technical review,
  pre-submit review, app certification code review, or "run flows-code-review".
  Re-run until 0 open Must Fix items remain before moving on to flows-design-review.
allowed-tools: Read, Glob, Grep, Bash, Write
---

# Flows Code Review

This skill is the **technical review** step of the Flows app certification flow:

```
flows-app-brief  →  build  →  flows-code-review (this skill, repeat until clean)  →  flows-design-review  →  flows-external-app-submit
```

## Pre-checks

Before starting, confirm:
- `package.json` exists (Node/TS project)
- We are inside a git repository (`git rev-parse --git-dir`)
- If `App-Brief.md` is missing at repo root, warn the user that `flows-app-brief` should be run first, but continue.

Determine the feedback round: look at `reviews/code-review/`. If it doesn't exist, use `feedback-round-1/`. Otherwise increment to the next missing round number.

## Step 1 — Load review guidance

Before any scoring, read all relevant skill files. The skills ship alongside this skill in the same repo and are available locally. For each skill below, `Glob '**/skills/<name>/SKILL.md'` and `Read` the first match.

**Required reads (always):**

| Skill | Informs criteria |
| --- | --- |
| `correctness-and-error-handling` | 1.1 (bugs), 1.4 (tests), plus error-state patterns |
| `security` | 1.2 (CDF via SDK), 1.3 (dependencies, CVEs) |
| `dependencies-audit` | 1.3 (packages audit) |
| `test-coverage` | 1.4 (coverage gate), 1.6 (testability) |
| `code-quality` | 1.5 (dead code), 1.6 (patterns) |
| `dm-limits-and-best-practices` | 2.1–2.5 (DMS query patterns, limits, rate) |
| `performance` | 2.3–2.4 (pagination, call rate) |
| `design` | 3.1 (Aura consistency) |

**Conditional read:**
- `setup-flows-auth` — read if the app imports `connectToHostApp`, `useHostApp`, or configures OAuth in Vite.

**Note on DMS patterns:** the `dm-limits-and-best-practices` skill is the canonical local reference for search vs joins, cardinality, and query-time semantics — no external `semantic-knowledge/` submodule is needed.

Do not proceed to scoring until all skill reads are complete.

## Step 2 — Build the file inventory (`review-files.md`)

List **all `.ts` and `.tsx` files** in the app (exclude `node_modules`, `dist`, `.cognite-bundles`). For each file assess:

- **Structure** (1–5): file size, single responsibility, clear organization
- **Quality** (1–5): type safety, no `any`/`unknown` casts, proper error handling, no dead code, clean naming
- **Patterns** (1–5 or N/A): DI/testability, correct platform patterns, no anti-patterns; `N/A` for pure utils/types
- **Tests**: `✓` adequate | `⚠` has tests with meaningful gaps | `✗` no test file | `N/A` (presentational-only or barrel)

Write to `reviews/code-review/feedback-round-<N>/review-files.md`:

```markdown
## File inventory: [app name]

| File | Structure | Quality | Patterns | Tests | Notes |
| ---- | --------- | ------- | -------- | ----- | ----- |
| src/main.tsx | 5 | 5 | N/A | N/A | Clean entry point |
| src/services/cdfHelper.ts | 3 | 2 | 2 | ✗ | No DI; raw sdk.get/post; no test file (1.2, 1.6, 2.5) |
| ... | ... | ... | ... | ... | ... |
```

## Step 3 — Build the package inventory (`review-packages.md`)

Gather dependency state with two one-shot commands — do **not** loop per package (`npm view <pkg>` is one network call per package; 40–80 calls = 2–4 minutes):

```bash
npm outdated --json 2>/dev/null || true   # exits 1 when outdated packages exist — normal; parse stdout regardless
npm audit --json 2>/dev/null || true       # exits 1 when vulnerabilities exist — parse stdout regardless
```

From `npm outdated --json`: packages absent from the output are up-to-date; packages present show `current` / `wanted` / `latest`. Flag any in `dependencies` (not `devDependencies`) that are ≥ 1 major behind.

From `npm audit --json`: parse severity counts and per-package advisory details.

**Deprecated status:** `npm outdated` does not report this. Only spot-check with `npm view <pkg> deprecated` for packages that already triggered another flag (≥ 1 major behind, in audit advisories, or unfamiliar name).

Assign health: **Pass** (up-to-date or ≤ 1 minor behind, 0 critical/high CVEs) | **Warn** (1 major behind in `dependencies`, or moderate CVE) | **Fail** (≥ 2 majors behind, or high/critical CVE, or deprecated).

Write to `reviews/code-review/feedback-round-<N>/review-packages.md`:

```markdown
## Package audit: [app name]

### Dependencies

| Package | Used version | Latest | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------- | ---- | ------ |
| react | ^18.2.0 | 18.3.1 | No | 0 | Pass |
| some-old-lib | ^1.0.0 | 1.0.3 | No | 0 | Fail |
| ... | ... | ... | ... | ... | ... |

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
| example-pkg | High | Prototype pollution | >=2.1.0 | https://github.com/advisories/GHSA-xxxx |
```

## Step 4 — Assess test coverage

Run the test suite with coverage:

```bash
npx vitest run --coverage   # Vite/Vitest projects
npx jest --coverage          # Jest projects
npm test -- --coverage       # generic fallback
```

Record the output: framework, pass/fail counts, statement/branch/function/line percentages. If the test suite fails to run or no framework is configured, note explicitly — **absence of a working test setup is itself a finding for criterion 1.4**.

**Hard gate:** Overall line coverage must be **≥ 80%** for the app to be approved. Coverage applies to all `.ts`/`.tsx` files under `src/` (excluding test files, type declarations, and `main.tsx`). Apps that exclude production files from coverage measurement must be re-measured at full scope. Coverage exclusions hiding untested code are themselves a finding.

Also note per each non-trivial file: is there a corresponding `.test.ts` / `.spec.ts`? If not, mark `Tests: ✗` in the file inventory. Assess whether hooks and services use **dependency injection via React context** rather than direct imports (`vi.mock` usage is a red flag unless justified with a comment).

## Step 5 — Score the 12 criteria

Evaluate all 12 criteria using the rubric below. For each, state the score and one or two sentences of evidence (file paths, patterns observed, or gaps). Mark **N/A** with explanation if a criterion is not applicable.

### 1.1 No known bugs

**Check:** Open issues, obvious regressions, error paths untested, or `TODO: fix` in critical paths.

| Score | Why |
| ----- | --- |
| 5 | No known defects; edge cases handled or explicitly out of scope with safe failure modes. |
| 4 | Minor issues only; none affect core user flows or data integrity. |
| 3 | Some known bugs or rough edges; workarounds exist or impact is limited. |
| 2 | Material bugs, unreliable flows, or silent failures; users or data could be harmed. |
| 1 | Broken primary flows, data corruption risk, or security-adjacent defects. |

### 1.2 CDF access via Cognite SDK only

**Check:** All traffic to CDF goes through the official Cognite SDK. Flag any `fetch`/`axios`/raw REST to CDF-like URLs that bypasses the SDK.

| Score | Why |
| ----- | --- |
| 5 | CDF usage is exclusively via the SDK; non-CDF calls are minimal and intentional. |
| 4 | SDK used for CDF; one borderline or legacy call worth confirming. |
| 3 | Mix of SDK and direct calls with weak justification. |
| 2 | Repeated or critical paths use raw CDF HTTP instead of the SDK. |
| 1 | Custom CDF clients, token handling outside SDK patterns, or undisclosed CDF endpoints. |

### 1.3 Dependencies and packages

**Check:** `package.json` / lockfiles; unmaintained packages, duplicate majors, known CVEs, license issues, install scripts.

| Score | Why |
| ----- | --- |
| 5 | Dependencies are current, trustworthy, and scanned; no red flags. |
| 4 | Small updates or pinning tweaks needed; no serious supply-chain signals. |
| 3 | Outdated or heavy deps; plan to upgrade documented. |
| 2 | High-risk packages, excessive bundle, or unclear provenance. |
| 1 | Known-vulnerable, deprecated, or malicious-adjacent dependency usage. |

### 1.4 Test coverage

**Check:** Unit and integration tests for critical logic, API contracts, and error handling; CI runs tests; coverage adequate for risk.

**Hard gate:** Coverage tooling must be configured and working. Overall line coverage must be ≥ 80%.

| Score | Why |
| ----- | --- |
| 5 | Critical paths well covered; ≥ 80% line coverage; failures easy to localize. |
| 4 | Good coverage (≥ 80%) with a few gaps in secondary modules. |
| 3 | Core flows partially tested; coverage below 80% or important branches missing. |
| 2 | Sparse tests; coverage well below 80%; refactors would be unsafe. |
| 1 | No meaningful automated tests, or coverage tooling not configured. |

### 1.5 Dead code and maintainability

**Check:** Unused exports, unreachable branches, commented-out blocks, duplicate utilities.

**Hard gate:** Unreachable pages, entirely unused files, and significant dead code blocks **must** be removed before approval (score 1–2, must fix).

| Score | Why |
| ----- | --- |
| 5 | Codebase is lean; dead paths removed or clearly feature-flagged with owners. |
| 4 | Minor cruft; quick cleanup possible. |
| 3 | Noticeable dead code or duplication; increases review and bug surface. |
| 2 | Large unused areas or confusing structure; hard to reason about behavior. |
| 1 | Unmaintainable tangle; dead code masks real execution paths. |

### 1.6 Coding patterns and testability

**Check:** Dependency injection via React context; interface-based services; ViewModel pattern for pages.

```typescript
// Preferred: injectable via context
const defaultDependencies = { useDataSource, useAnalytics };
export type UseMyHookContextType = typeof defaultDependencies;
export const UseMyHookContext = createContext<UseMyHookContextType>(defaultDependencies);
export function useMyHook() {
  const { useDataSource } = useContext(UseMyHookContext);
}
```

| Score | Why |
| ----- | --- |
| 5 | DI via context throughout; interface-based services; ViewModel hooks for pages; type-safe mocks. |
| 4 | Mostly good patterns; one or two hooks import directly but still testable. |
| 3 | Mixed: some injectable, others import directly; `vi.mock` used frequently. |
| 2 | Most hooks hard-code dependencies; tests rely on module mocking throughout. |
| 1 | No DI; global singletons or direct SDK calls throughout. |

### 2.1 DMS query patterns (search / query vs heavier paths)

**Check:** For read-heavy workloads where filters allow, prefer APIs that hit Elasticsearch (`query` or `search` on instances) rather than overusing list paths that stress Postgres.

| Score | Why |
| ----- | --- |
| 5 | Read paths use the lightest suitable DMS API; writes and exceptions are documented. |
| 4 | Mostly correct; one or two calls could move to query/search. |
| 3 | Mix of appropriate and heavy reads; performance risk under load. |
| 2 | Default pattern is heavier than needed; likely to stress Postgres or DMS. |
| 1 | Systematic misuse of APIs contrary to platform guidance. |

### 2.2 Server-side filtering

**Check:** Filters, limits, and projections applied in the API request — not by downloading large result sets and filtering in the browser.

| Score | Why |
| ----- | --- |
| 5 | Payloads are tight; filtering expressed in queries; pagination is real, not simulated. |
| 4 | Minor over-fetch; easy to tighten. |
| 3 | Repeated patterns of client-side filtering on medium result sets. |
| 2 | Large downloads with in-memory filtering; obvious scalability issue. |
| 1 | Unbounded or near-unbounded reads with client-side reduction. |

### 2.3 Limits, pagination, and prefetch

**Check:** Low, explicit limits; cursor- or page-based retrieval; no aggressive prefetch of pages the user may never need.

| Score | Why |
| ----- | --- |
| 5 | Limits and paging match UX; no wasteful speculative loading. |
| 4 | Reasonable; small tuning opportunities. |
| 3 | Occasional high limits or redundant page fetches. |
| 2 | Frequent large pages or prefetch storms. |
| 1 | Unbounded lists, deep prefetch chains, or N+1 DMS patterns. |

### 2.4 Rate of calls — do not hammer DMS

**Check:** Debouncing, batching, caching; no tight loops of identical requests; no re-fetching on every render without need.

| Score | Why |
| ----- | --- |
| 5 | Request rate proportional to user intent; caching and deduplication in place. |
| 4 | Mostly fine; a hot path could batch or debounce slightly. |
| 3 | Chatty UI or polling without backoff; risk under concurrent users. |
| 2 | Clear risk of overwhelming DMS or shared quotas. |
| 1 | Tight loops, runaway polling, or duplicate parallel identical calls. |

### 2.5 Throttling and 429 responses — backoff with jitter

**Check:** On 429 (or similar rate-limit signals), clients use exponential backoff with jitter, respect `Retry-After`, and avoid synchronized retries.

| Score | Why |
| ----- | --- |
| 5 | Backoff + jitter implemented; retries bounded; behavior degrades gracefully. |
| 4 | Backoff exists; jitter or caps could be improved. |
| 3 | Naive fixed-interval retries or missing handling for throttling. |
| 2 | Aggressive retries on 429; thundering herd risk. |
| 1 | No handling; infinite or immediate tight retries on errors. |

### 3.1 Aura design system

**Check:** Prefer Aura components and tokens for layout, forms, tables, feedback, and typography; custom UI should align with Aura spacing, color, and interaction patterns.

| Score | Why |
| ----- | --- |
| 5 | Aura used consistently; custom pieces match design language. |
| 4 | Mostly Aura; isolated custom widgets with acceptable alignment. |
| 3 | Mix of ad-hoc UI and Aura; some inconsistency for users. |
| 2 | Largely non-Aura; visually disconnected from platform. |
| 1 | Clashing patterns, inaccessible controls, or no alignment with Aura when feasible. |

*Note: a score of 3 does not block initial approval. Accessibility gaps (missing `aria-label`, unlabeled inputs) should be escalated to Should Fix regardless of the Aura score.*

## Step 6 — Write `code-review-report.md`

Write `reviews/code-review/feedback-round-<N>/code-review-report.md` following this template:

```markdown
# [App name] — Flows code review

This document is the platform review for [App name], conducted as part of the Cognite Flows app certification process.

## What this review covers

- **Protect the user and the customer** — no known bugs, correct SDK usage, healthy dependencies, adequate test coverage, and a clean codebase.
- **Protect Cognite services** — efficient DMS query patterns, server-side filtering, bounded pagination, and graceful rate-limit handling.
- **Protect the brand** — UI consistency with the Aura design system.

Scores are 1–5. A score of 1–2 on any criterion blocks approval. Score 3 is acceptable with tracked follow-up. Scores 4–5 are good.

## Path to approval

This review found **[N] must-fix item(s)** that block approval. [One sentence on should-fix count and overall state.] Once the must-fix items are addressed, re-run `flows-code-review`.

---

## Review details

### Summary
[2–4 sentences: positives first, then a clear statement of how many blocking issues and what they are]

### Reviewed commit
`<full SHA>`

### Test coverage
- **Framework:** [Vitest / Jest / None]
- **Tests run:** [N passed, N failed, N skipped]
- **Coverage:** [Statements: X% | Branches: X% | Functions: X% | Lines: X%]
- **Notable gaps:** [uncovered critical paths, or "N/A"]

### Package & security summary
- **Total packages:** [N] dependencies, [N] devDependencies
- **Health:** [N] pass, [N] warn, [N] fail
- **Vulnerabilities:** [N] critical, [N] high, [N] moderate, [N] low
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
  _Impact:_ [one sentence explaining the user/customer consequence]

### Should fix before deploy
- [ ] [description] — [file:line] — [criterion ref]

### Nice to fix before deploy
- [ ] [description] — [file:line] — [criterion ref]
```

**Categorization:**
- **Must fix** (score 1–2): security issues, broken core flows, unbounded API calls, missing SDK usage for CDF, test coverage below 80% or tooling not configured, unreachable pages or significant dead code, pervasive hard-coded dependencies with no DI path. Each must-fix item **must** include an `_Impact:_` note explaining the user/customer consequence.
- **Should fix** (score 3): missing test files for non-trivial services/hooks/utils, missing tests for critical paths, client-side filtering of large datasets, missing backoff/retry, accessibility gaps, `vi.mock` overuse without justification.
- **Nice to fix** (score 4 gaps): minor Aura inconsistencies, small cleanup, non-critical package updates, minor dead exports.

End the file with a machine-readable summary block (exact format required by `flows-external-app-submit`):

```markdown
## Summary

- Must Fix open: <integer>
- Should Fix open: <integer>
- Nice Fix open: <integer>
```

Use exactly those labels and the singular line format. When all Must Fix items are resolved, the line MUST read `Must Fix open: 0`.

## Step 7 — Verify

After writing all three artifacts, cross-check them:

1. Re-read `code-review-report.md`, `review-files.md`, and `review-packages.md`.
2. Verify every criterion 1.1–1.6, 2.1–2.5, 3.1 appears in the Scores table with an actual score (not blank).
3. Verify every must-fix item (score 1–2) has an `_Impact:_` note.
4. Verify the Summary block is present and the integer counts match the actual number of open checklist items.
5. Verify that no `gh api` calls or `curl` to `raw.githubusercontent.com` were made during this skill run — all guidance should have come from local skill reads (Step 1) and the inlined rubric above.

Print to the terminal after writing:

```
Must Fix open: <n>
Should Fix open: <n>
Nice Fix open: <n>
```

## When to stop

Re-run this skill until `Must Fix open: 0` in the latest round's `code-review-report.md`. Only then proceed to `flows-design-review`.
