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

```
flows-app-brief  →  build  →  flows-code-review (repeat until clean)  →  flows-design-review  →  flows-external-app-submit
```

## Pre-conditions

- `package.json` exists (Node/TS project)
- Inside a git repository
- `App-Brief.md` at repo root — warn if missing, then continue

## Scoring criteria

Review against 12 Dune app platform criteria (1–5). Read the referenced skill files from `.agents/skills/<name>/SKILL.md` for detailed rubrics before scoring.

| # | Criterion | Skill rubric |
|---|---|---|
| 1.1 | No known bugs | `correctness-and-error-handling` |
| 1.2 | CDF access via Cognite SDK only | `security` |
| 1.3 | Dependencies and packages | `dependencies-audit` |
| 1.4 | Test coverage (**hard gate: ≥ 80% line coverage**) | `test-coverage` |
| 1.5 | Dead code and maintainability | `code-quality` |
| 1.6 | Coding patterns and testability | `code-quality` |
| 2.1 | DM query patterns (search vs relational) | `dm-limits-and-best-practices` |
| 2.2 | Server-side filtering — no bulk fetch-and-filter | `performance` |
| 2.3 | Limits, pagination, no aggressive prefetch | `dm-limits-and-best-practices` |
| 2.4 | Rate of calls — debounce, batch, no tight loops | `performance` |
| 2.5 | Throttling — exponential backoff + jitter on 429 | `dm-limits-and-best-practices` |
| 3.1 | Aura design system | N/A — scored in `flows-design-review` |

## Step 1 — Run all probes

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
```

**CDF SDK — flag raw HTTP to CDF hosts:**
```bash
rg 'fetch\(|axios\.' src --type ts --type tsx -l 2>/dev/null
rg 'cogniteapi\.omnia|api\.cognitedata|\.fusion\.cognite' src --type ts --type tsx -l 2>/dev/null
```

**DMS patterns:**
```bash
rg '\.list\(' src --type ts --type tsx -c 2>/dev/null
rg '\blimit:' src --type ts --type tsx -c 2>/dev/null
rg 'cursor|nextCursor' src --type ts --type tsx -c 2>/dev/null
```

**Testability:**
```bash
rg 'vi\.mock\(' src --type ts --type tsx -c 2>/dev/null
rg 'useContext.*Context\b' src --type ts --type tsx -c 2>/dev/null
rg 'as unknown as ' src --type ts --type tsx -c 2>/dev/null
```

**Dead code:**
```bash
rg 'TODO|FIXME|HACK|console\.log' src --type ts --type tsx -c 2>/dev/null
find src -name '*.ts' -o -name '*.tsx' | wc -l
```

## Step 2 — File inventory (`review-files.md`)

List all `.ts`/`.tsx` files under `src/`. Per non-trivial file: test exists (✓/✗/N/A), any probe hit. One line per file.

## Step 3 — Package inventory (`review-packages.md`)

From `package.json` + audit output: per production dependency — version used, latest, deprecated, CVEs, health (Pass/Warn/Fail).

## Step 4 — Score and write the report

Score all 12 criteria using probe results + skill rubrics. Write `reviews/code-review/feedback-round-<N>/code-review-report.md`:

```markdown
# [App name] — Dune app review

## Path to approval

**[N] must-fix item(s).** [One sentence on should-fix count.]

---

## Reviewed commit

`<sha>` ([link])

## Test coverage

- **Framework:** Vitest / Jest / None
- **Tests run:** N passed / N failed
- **Coverage:** Statements: X% | Branches: X% | Functions: X% | Lines: X%
- **Notable gaps:** ...

## Package & security summary

- **Total:** N deps, N devDeps — N pass, N warn, N fail
- **Vulnerabilities:** N critical, N high, N moderate, N low
- Full details: `review-packages.md`

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
| Brand | 3.1 Aura | N/A | see flows-design-review |

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

Use `feedback-round-1/` on first run; increment on reruns. Print the three summary counts to the terminal.

## When to stop

Re-run until `Must Fix open: 0`. Only then proceed to `flows-design-review`.
