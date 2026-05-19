# Flows App Review — Scoring Criteria

Each criterion uses a **1–5** scale.

| Score | Meaning |
| ----- | ------- |
| **5** | Meets or exceeds expectations; nothing material to fix for this dimension. |
| **4** | Solid; only minor gaps, acceptable risk, or easy follow-ups. |
| **3** | Acceptable for merge with explicit follow-ups, or meaningful gaps that should be tracked. |
| **2** | Significant risk or technical debt; should block release or require a concrete remediation plan before approval. |
| **1** | Unacceptable for the stated goal (security, reliability, platform health, or brand); must be addressed. |

When you write a review, **state the score per criterion** and **one or two sentences of evidence** (file paths, patterns observed, or gaps). If something is not applicable (e.g. no DMS usage), note **N/A** and why.

---

## 1. Protect the user and the customer

Goal: shipped behavior is trustworthy, observable, and maintainable; no surprises in dependencies or network behavior.

### 1.1 No known bugs

**Check:** Open issues linked to the change set, obvious regressions, error paths untested, or "TODO: fix" in critical paths.

| Score | Why |
| ----- | --- |
| 5 | No known defects; edge cases handled or explicitly out of scope with safe failure modes. |
| 4 | Minor issues only; none affect core user flows or data integrity. |
| 3 | Some known bugs or rough edges; workarounds exist or impact is limited. |
| 2 | Material bugs, unreliable flows, or silent failures; users or data could be harmed. |
| 1 | Broken primary flows, data corruption risk, or security-adjacent defects. |

### 1.2 CDF access via Cognite SDK only

**Check:** All traffic to **Cognite Data Fusion (CDF)** goes through the **official Cognite SDK**. Flag **any** HTTP/WebSocket or other network call to CDF-like hosts, APIs, or proxies that **bypasses** the SDK (hand-rolled `fetch`/`axios`/raw REST to CDF URLs, custom auth headers to CDF, etc.). Legitimate non-CDF calls (e.g. static assets, documented third-party APIs required by the product) should be **explicit, documented, and expected** — but **CDF must still be SDK-only**.

| Score | Why |
| ----- | --- |
| 5 | CDF usage is exclusively via the SDK; non-CDF calls are minimal and intentional. |
| 4 | SDK used for CDF; one borderline or legacy call worth confirming as non-CDF or wrapped SDK. |
| 3 | Mix of SDK and direct calls with weak justification or unclear scope. |
| 2 | Repeated or critical paths use raw CDF HTTP instead of the SDK. |
| 1 | Custom CDF clients, token handling outside SDK patterns, or undisclosed CDF endpoints. |

### 1.3 Dependencies and packages

**Check:** `package.json` / lockfiles / transitive deps; unmaintained packages, duplicate majors, known CVEs (where you have tooling), license issues for your distribution model, and scripts that run on install.

| Score | Why |
| ----- | --- |
| 5 | Dependencies are current enough, trustworthy, and scanned; no red flags. |
| 4 | Small updates or pinning tweaks needed; no serious supply-chain signals. |
| 3 | Outdated or heavy deps; plan to upgrade or replace is documented. |
| 2 | High-risk packages, excessive bundle, or unclear provenance. |
| 1 | Known-vulnerable, deprecated, or malicious-adjacent dependency usage. |

For the package health table in `review-packages.md`, use these thresholds:
- **Pass**: >100k weekly downloads, updated within 12 months, not deprecated, version near-current
- **Warn**: 10k–100k downloads, or >12 months since last publish, or >1 major version behind
- **Fail**: <10k downloads, or no update in 2+ years, or deprecated, or any known CVE

### 1.4 Test coverage

**Check:** Unit and integration tests for critical logic, API contracts, and error handling; meaningful assertions; CI runs tests; coverage is **adequate for risk** (not only a percentage).

**Hard gate:** Test coverage tooling **must** be configured and working (e.g. `vitest.config.ts` with `coverage` section). The test suite must produce a coverage report, and **overall line coverage must be at least 80%** for the app to be approved. Apps below this threshold receive a score of 1–2 and are listed as **must fix**.

**Coverage scope:** The 80% threshold applies to **all `.ts` and `.tsx` files** under `src/` (excluding only test files, type declaration files like `vite-env.d.ts`, and the entry point `main.tsx`). Apps must **not** exclude pages, components, hooks, or other production code from coverage measurement. If the app's `vitest.config.ts` excludes production files, the reviewer must re-run coverage with the full scope to get the true number. Coverage exclusions that hide untested code are themselves a finding under this criterion.

**`__mocks__` convention:** For Vite/Vitest projects, `src/**/__mocks__/**` is an acceptable location for shared test fixtures and should not be flagged by itself. Do not recommend moving mocks to `tests/__mocks__/` unless there is evidence the mock files are imported by production runtime code or otherwise included in shipped bundles.

| Score | Why |
| ----- | --- |
| 5 | Critical paths and regressions are well covered; ≥80% line coverage; failures are easy to localize. |
| 4 | Good coverage (≥80%) with a few gaps in secondary modules. |
| 3 | Core flows partially tested; coverage below 80% or important branches/integrations missing. |
| 2 | Sparse tests; coverage well below 80%; refactors would be unsafe; regressions likely. |
| 1 | No meaningful automated tests for non-trivial behavior, or coverage tooling not configured. |

**Testability check:** Beyond raw coverage, assess whether the code is *designed to be testable*:
- Do hooks and services use **dependency injection via React context** (preferred) or accept **injectable dependency overrides** (factory-function pattern), rather than hard-coding imports?
- Are CDF/SDK calls isolated behind service interfaces rather than called directly in components or hooks?
- Does the corresponding test file use **context injection** rather than `vi.mock` at the module level? (`vi.mock` is a red flag unless justified with a comment.)
- Are mocks **type-safe**? (`as unknown as T` casting in tests is a signal of poor interface design in the production code.)

Files that can only be tested by mocking entire modules are a testability concern, even if they happen to have tests today. Flag these explicitly.

**Missing test files:** For every non-trivial `.ts`/`.tsx` file — services, hooks, utils, contexts, ViewModel hooks — check whether a corresponding `.test.ts` or `.spec.ts` exists. If not, note it explicitly as **"no test file"** in the per-file inventory. Pure presentational components with no logic and simple barrel exports (`index.ts`) do not require test files.

### 1.5 Dead code and maintainability

**Check:** Unused exports, unreachable branches, commented-out blocks, duplicate utilities, and features that are never referenced.

**Hard gate:** Unreachable pages, entirely unused files, and significant dead code blocks **must** be removed before approval. Apps with dead pages or large unused modules receive a score of 1–2 and are listed as **must fix**.

| Score | Why |
| ----- | --- |
| 5 | Codebase is lean; dead paths removed or clearly feature-flagged with owners. |
| 4 | Minor cruft; quick cleanup possible. |
| 3 | Noticeable dead code or duplication; increases review and bug surface. |
| 2 | Large unused areas or confusing structure; hard to reason about behavior. |
| 1 | Unmaintainable tangle; dead code masks real execution paths. |

### 1.6 Coding patterns and testability

**Check:** The codebase follows patterns that keep code testable, maintainable, and consistent. Three core patterns are expected:

**1. Dependency injection via React context** — hooks should declare their dependencies through a context type and consume them via `useContext`, not by importing them directly. This enables testing without module-level mocks.

```typescript
// Preferred: injectable via context
const defaultDependencies = { useDataSource, useAnalytics };
export type UseMyHookContextType = typeof defaultDependencies;
export const UseMyHookContext = createContext<UseMyHookContextType>(defaultDependencies);
export function useMyHook() {
  const { useDataSource } = useContext(UseMyHookContext);
}

// Anti-pattern: hard-coded import — requires vi.mock to test
import { useDataSource } from '../data/useDataSource';
export function useMyHook() { const data = useDataSource(); }
```

For non-React code (utilities, services), use **factory functions with partial dependency overrides**:

```typescript
type Deps = { serviceFactory: () => SomeService };
const defaultDeps: Deps = { serviceFactory: () => new SomeServiceImpl() };
export const doSomething = async (props: Props, depOverrides?: Partial<Deps>) => {
  const deps = { ...defaultDeps, ...depOverrides };
  const service = deps.serviceFactory();
};
```

**2. Interface-based services** — service classes implement explicit TypeScript interfaces. This keeps production code substitutable and test doubles type-safe. Avoid `as unknown as T` casts in either production or test code.

**3. ViewModel pattern** — page-level hooks (`useSomethingViewModel`) separate business logic from presentation. UI components receive data and callbacks only; they contain no data-fetching, side-effect logic, or direct SDK calls.

**Hard gate:** Pervasive use of hard-coded dependencies with no DI path is a **must fix**.

| Score | Why |
| ----- | --- |
| 5 | DI via context throughout; interface-based services; ViewModel hooks for pages; test mocks are type-safe and context-injected. |
| 4 | Mostly good patterns; one or two hooks import dependencies directly but are still testable. |
| 3 | Mixed: some hooks are injectable, others import directly; `vi.mock` used frequently without justification. |
| 2 | Most hooks and services hard-code dependencies; tests rely on module mocking throughout; poor testability. |
| 1 | No DI; global singletons or direct SDK calls throughout; very difficult to unit test without heavy mocking. |

---

## 2. Protect Cognite services

Goal: the app does not stress shared infrastructure or cause cascading load on DMS or other platform components.

### 2.1 Data Modeling query patterns (search / query vs heavier paths)

**Check:** For **read-heavy** workloads where **filters and product semantics allow**, prefer APIs that hit the **search-appropriate path** (e.g. **`query`** or **`search`** on instances) so work is pushed to **Elasticsearch** rather than overusing relational/list paths that stress **Postgres** unnecessarily. When the app **writes** or needs semantics only available on another endpoint, that choice should be **justified**.

| Score | Why |
| ----- | --- |
| 5 | Read paths consistently use the lightest suitable DMS API; writes and exceptions are documented. |
| 4 | Mostly correct; one or two calls could move to query/search with small refactors. |
| 3 | Mix of appropriate and heavy reads; performance or cost risk under load. |
| 2 | Default pattern is heavier than needed; likely to stress Postgres or DMS. |
| 1 | Systematic misuse of APIs contrary to platform guidance. |

### 2.2 Server-side filtering; avoid bulk fetch-and-filter on the client

**Check:** Filters, limits, and projections are applied **in the API request** where possible — not by downloading large result sets and filtering in the browser or app tier.

| Score | Why |
| ----- | --- |
| 5 | Payloads are tight; filtering is expressed in queries; pagination is real, not simulated. |
| 4 | Minor over-fetch; easy to tighten. |
| 3 | Repeated patterns of client-side filtering on medium result sets. |
| 2 | Large downloads with in-memory filtering; obvious scalability issue. |
| 1 | Unbounded or near-unbounded reads with client-side reduction. |

### 2.3 Limits, pagination, and prefetch

**Check:** **Low, explicit limits**; **cursor- or page-based** retrieval; no aggressive **prefetch** of pages the user may never need; avoid loading "everything" up front.

| Score | Why |
| ----- | --- |
| 5 | Limits and paging match UX; no wasteful speculative loading. |
| 4 | Reasonable; small tuning opportunities. |
| 3 | Occasional high limits or redundant page fetches. |
| 2 | Frequent large pages or prefetch storms. |
| 1 | Unbounded lists, deep prefetch chains, or N+1 DMS patterns. |

### 2.4 Rate of calls — do not hammer DMS

**Check:** Debouncing, batching, caching (where correct), avoiding tight loops of identical requests, and not re-fetching on every render without need.

| Score | Why |
| ----- | --- |
| 5 | Request rate is proportional to user intent; caching and deduplication where appropriate. |
| 4 | Mostly fine; a hot path could batch or debounce slightly. |
| 3 | Chatty UI or polling without backoff; risk under concurrent users. |
| 2 | Clear risk of overwhelming DMS or shared quotas. |
| 1 | Tight loops, runaway polling, or duplicate parallel identical calls. |

### 2.5 Throttling and 429 responses — backoff with jitter

**Check:** On **429** (or similar rate-limit signals), clients use **exponential backoff** with **jitter**, respect `Retry-After` when present, and avoid synchronized retries that amplify load.

| Score | Why |
| ----- | --- |
| 5 | Backoff + jitter implemented; retries are bounded; user-visible behavior degrades gracefully. |
| 4 | Backoff exists; jitter or caps could be improved. |
| 3 | Naive fixed-interval retries or missing handling for throttling. |
| 2 | Aggressive retries on 429; thundering herd risk. |
| 1 | No handling; infinite or immediate tight retries on errors. |

---

## 3. Protect the brand

Goal: apps feel like part of the Cognite product family — consistent UI and accessible patterns where the stack allows.

### 3.1 Aura design system

**Check:** Prefer **Aura** components and tokens for layout, forms, tables, feedback, and typography when they fit the use case; custom UI should still align with Aura spacing, color, and interaction patterns where applicable.

| Score | Why |
| ----- | --- |
| 5 | Aura used consistently; custom pieces match design language. |
| 4 | Mostly Aura; isolated custom widgets with acceptable alignment. |
| 3 | Mix of ad-hoc UI and Aura; some inconsistency for users. |
| 2 | Largely non-Aura; visually disconnected from platform. |
| 1 | Clashing patterns, inaccessible controls, or no alignment with Aura when it was feasible. |

**Reviewer note:** A score of 3 does **not** block initial approval. Accessibility gaps (missing `aria-label`, unlabeled form inputs) should be escalated to **Should fix** items regardless. Full Aura migration is a "Nice to fix" follow-up unless the app is replacing an existing Aura-based UI.

---

## Categorization guidance

- **Must fix** (score 1–2): security issues, data corruption risks, broken core flows, unbounded API calls, missing SDK usage for CDF, test coverage below 80% or coverage tooling not configured, unreachable pages or significant dead code, pervasive hard-coded dependencies with no DI path. For each must-fix item, include a one-sentence **`_Impact:_`** note explaining the user-visible or customer consequence.
- **Should fix** (score 3): missing test files for non-trivial services/hooks/utils, client-side filtering of large datasets, missing backoff/retry, accessibility gaps, `vi.mock` overuse without justification.
- **Nice to fix** (score 4 gaps): minor Aura inconsistencies, small cleanup opportunities, non-critical package updates, minor dead exports.
