---
name: flows-code-review
description: >-
  Run the technical (code) review step of Flows app certification. Produces three
  artifacts under reviews/code-review/feedback-round-<N>/: review-files.md
  (file inventory), review-packages.md (dependency audit), and
  code-review-report.md (scored report with Must Fix / Should Fix / Nice Fix
  items). Use when the user asks for a Flows code review, technical review,
  pre-submit review, app certification code review, or "run flows-code-review".
  Re-run until 0 open Must Fix items remain before moving on to flows-design-review.
allowed-tools: Read, Glob, Grep, Shell, Write
---

# Flows Code Review

This skill is the **technical review** step of the Flows app certification flow:

```
flows-app-brief  →  build  →  flows-code-review (this skill, repeat until clean)  →  flows-design-review  →  flows-external-app-submit
```

## Pre-conditions

Check before starting (fail fast if any are missing):
- `package.json` exists — Node/TS project
- Inside a git repository (`git rev-parse --show-toplevel`)
- `App-Brief.md` exists at the repo root — if missing, warn the user to run `flows-app-brief` first, then continue

## Scoring criteria

Review against the 12 Dune app platform criteria (1–5 scale). For each criterion's detailed rubric, `Read` the referenced local skill file before scoring — they contain concrete thresholds and examples.

| # | Criterion | Local skill rubric |
|---|---|---|
| 1.1 | No known bugs | `correctness-and-error-handling/SKILL.md` |
| 1.2 | CDF access via Cognite SDK only | `security/SKILL.md` |
| 1.3 | Dependencies and packages | `dependencies-audit/SKILL.md` |
| 1.4 | Test coverage (**hard gate: ≥ 80% line coverage**) | `test-coverage/SKILL.md` |
| 1.5 | Dead code and maintainability | `code-quality/SKILL.md` |
| 1.6 | Coding patterns and testability | `code-quality/SKILL.md` |
| 2.1 | DM query patterns (search vs relational paths) | `dm-limits-and-best-practices/SKILL.md` |
| 2.2 | Server-side filtering — no bulk fetch-and-filter | `performance/SKILL.md` |
| 2.3 | Limits, pagination, no aggressive prefetch | `dm-limits-and-best-practices/SKILL.md` |
| 2.4 | Rate of calls — debounce, batch, no tight loops | `performance/SKILL.md` |
| 2.5 | Throttling — exponential backoff + jitter on 429 | `dm-limits-and-best-practices/SKILL.md` |
| 3.1 | Aura design system consistency | (scored in `flows-design-review`) — mark N/A |

The local skill files are at `.agents/skills/<name>/SKILL.md` in the app workspace (placed there by `npx @cognite/cli apps skills pull`). Read them with e.g. `Read .agents/skills/code-quality/SKILL.md`.

## Step 1 — Run all probes upfront

Run these all at once before reading any source files. They provide the hard evidence for scoring.

**Test coverage** (try in order until one succeeds):
```bash
npx vitest run --coverage 2>&1 | tail -30
npx jest --coverage 2>&1 | tail -30
npm test -- --coverage 2>&1 | tail -30
```

**Lint and type safety:**
```bash
pnpm run lint 2>&1 | tail -20
pnpm exec tsc --noEmit 2>&1 | tail -20
```

**Dependency audit:**
```bash
pnpm audit --json 2>/dev/null | head -150
npm audit --json 2>/dev/null | head -150
```

**CDF SDK check — flag any raw HTTP calls to CDF-like hosts:**
```bash
rg 'fetch\(|axios\.' src --type ts --type tsx -l 2>/dev/null
rg 'cogniteapi\.omnia|api\.cognitedata|\.fusion\.cognite' src --type ts --type tsx -l 2>/dev/null
```

**DMS query patterns — unbounded fetches:**
```bash
rg '\.list\(' src --type ts --type tsx -c 2>/dev/null
rg '\blimit:' src --type ts --type tsx -c 2>/dev/null
rg 'cursor|nextCursor' src --type ts --type tsx -c 2>/dev/null
rg 'React\.query|useInfiniteQuery|useSuspenseInfiniteQuery' src --type ts --type tsx -c 2>/dev/null
```

**Testability patterns:**
```bash
rg 'vi\.mock\(' src --type ts --type tsx -c 2>/dev/null
rg 'useContext.*Context\b' src --type ts --type tsx -c 2>/dev/null
rg 'as unknown as ' src --type ts --type tsx -c 2>/dev/null
rg 'ViewModel\b' src --type ts --type tsx -l 2>/dev/null
```

**Dead code:**
```bash
rg 'TODO|FIXME|HACK|console\.log' src --type ts --type tsx -c 2>/dev/null
find src -name '*.ts' -o -name '*.tsx' | wc -l
```

## Step 2 — Write the file inventory (`review-files.md`)

List all `.ts` / `.tsx` files under `src/`. For each non-trivial file note: test file exists (✓ / ✗ / N/A), and any finding from Step 1 probes that targets this file. Keep to one line per file. This is `review-files.md`.

## Step 3 — Write the package inventory (`review-packages.md`)

From `package.json` and the audit output from Step 1, write a package health table. For each production dependency: used version, latest, weekly downloads (rough), last-published (rough), deprecated, CVEs, health (Pass / Warn / Fail). Fail = known CVE, deprecated, or unmaintained. Warn = significantly outdated.

## Step 4 — Score all 12 criteria and write the report

Using the Step 1 probe results and the local skill rubrics, score every criterion in one pass. Then write `reviews/code-review/feedback-round-<N>/code-review-report.md` using this template:

```markdown
# [App name] — Dune app review

## What this review covers

- **Protect the user and the customer** — no known bugs, correct SDK usage, healthy dependencies, adequate test coverage, clean codebase.
- **Protect Cognite services** — efficient DMS patterns, server-side filtering, bounded pagination, graceful rate-limit handling.
- **Protect the brand** — Aura consistency (scored in `flows-design-review`).

## Path to approval

This review found **[N] must-fix item(s)**. [One sentence on should-fix count.] Once must-fix items are addressed, re-run this skill in a new feedback round.

---

## Reviewed commit

`<full SHA>` ([link])

## Test coverage

- **Framework:** [Vitest / Jest / None]
- **Tests run:** [N passed / N failed]
- **Coverage:** Statements: X% | Branches: X% | Functions: X% | Lines: X%
- **Notable gaps:** ...

## Package & security summary

- **Total packages:** N deps, N devDeps
- **Health:** N pass, N warn, N fail
- **Vulnerabilities:** N critical, N high, N moderate, N low
- Full details: see `review-packages.md`

## Scores

| Area | Criterion | Score | Notes |
|---|---|---|---|
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
| Brand | 3.1 Aura | N/A | Covered in flows-design-review |

## Must Fix

- [ ] ...

## Should Fix

- [ ] ...

## Nice to Fix

- [ ] ...

## Summary

- Must Fix open: <integer>
- Should Fix open: <integer>
- Nice Fix open: <integer>
```

Write all three artifacts to `reviews/code-review/feedback-round-<N>/`. Use `feedback-round-1/` on first run; increment on reruns. Print the three counts to the terminal.

## When to stop

Re-run until `Must Fix open: 0` in the latest round. Only then proceed to `flows-design-review`.
