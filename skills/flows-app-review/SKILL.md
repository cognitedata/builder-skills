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

Review the **entire application codebase** against the Flows app platform scoring criteria.
Produce three artifacts: `review-files.md`, `review-packages.md`, and `review-report.md`.

Write artifacts to `reviews/flows-app-review/feedback-round-<N>/`. If no prior round exists, use `feedback-round-1`. For reruns, increment N.

---

## Phase 1: Load guidance before reviewing

**Complete this phase before any scoring or evaluation begins.**

### Read the scoring criteria

Read `scoring-criteria.md` (relative to this SKILL.md). It contains all 12 scored criteria with their 1–5 rubrics, hard gates, and categorization rules. Do not start scoring until you have read it.

### Read the relevant skills

Invoke or read the following installed skills. At minimum, always consult:

- **`dm-limits-and-best-practices`** — DMS concurrency limits, QueuedTaskRunner/semaphore, pagination, search vs filter, batching
- **`code-quality`** — linting, `any` types, component size, DRY, naming, dead code
- **`correctness-and-error-handling`** — ErrorBoundary, async error handling, loading/error/empty states, useEffect cleanup
- **`security`** — XSS, credentials, dangerous DOM APIs, input validation
- **`performance`** — re-renders, CDF query optimization, virtualization, bundle size
- **`design`** — Aura usage and component guidance
- **`setup-flows-auth`** — DuneAuthProvider, useDune hook, Vite config

Consult others if the app touches their domain (e.g. `integrate-atlas-chat` for AI agent apps). If a skill is not installed, skip it and continue.

### Identify the app scope

Find the app root directory (the one containing `package.json`). In a monorepo, identify which app is under review. State clearly which directory you are reviewing.

### Create a review checklist

Before starting, create tasks for every phase and step below so nothing is skipped.

---

## Phase 2: Perform the review

Follow the **Review process** defined in `scoring-criteria.md`. Produce three artifacts — `review-files.md`, `review-packages.md`, `review-report.md` — following the templates in `artifact-templates.md`.

### Step 1: Build the file inventory (`review-files.md`)

List **all `.ts` and `.tsx` files** in the app. For each file assess — Structure (1–5), Quality (1–5), Patterns (1–5 or N/A), Tests (✓/⚠/✗/N/A) — and note criterion refs in the Notes column. While building the inventory, note for each non-trivial file: test file exists? context injection or direct imports? interface-based services? ViewModel separation?

Read `artifact-templates.md` (relative to this SKILL.md) for the exact column layout and an example row before writing this file.

### Step 2: Build the package inventory (`review-packages.md`)

List every package from `package.json` (`dependencies` and `devDependencies`). For each, look up weekly downloads, latest version, last publish date, and deprecated status via `npm view <pkg> --json`. Run `npm audit --json` or `pnpm audit --json` in the app directory (install deps first if needed). Use `--production` / `--prod` to separately assess what ships to users vs dev-only risk. Assign health per the thresholds in `scoring-criteria.md`.

Read `artifact-templates.md` (relative to this SKILL.md) for the exact table format before writing this file.

### Step 3: Assess test coverage

Run the test suite with coverage:

```bash
npx vitest run --coverage   # Vite/Vitest projects
npx jest --coverage         # Jest projects
npm test -- --coverage      # generic fallback
```

Record framework, tests run (pass/fail/skip), and coverage percentages. If tests fail to run or no framework is configured, note that explicitly — **absence of a working test setup is a finding for criterion 1.4**.

### Step 4: File-by-file evaluation

Go through `review-files.md` file by file. Apply the checklists from the skills read in Phase 1:
- DM limits (QueuedTaskRunner, pagination, search vs filter, batching)
- Correctness (ErrorBoundary, isLoading/isError/empty, useEffect cleanup, null safety)
- Security (dangerouslySetInnerHTML, credentials, input validation)
- Code quality (`any` types, component size, dead code, naming)
- Performance (re-renders, unbounded queries, virtualization)

### Step 5: Write the review report (`review-report.md`)

Produce the final report following `artifact-templates.md` exactly. Ensure:
- All 12 criteria are scored
- Every must-fix item has an `_Impact:_` note
- Categorization: score 1–2 = must fix, 3 = should fix, 4 = nice to fix

---

## Phase 3: Verify

After writing all three artifacts, read `verification.md` (relative to this SKILL.md) and follow it to independently cross-check the review. Verify claims by reading the actual source code — do not trust the review at face value. Append the verification verdict to `review-report.md`.
