# Flows App Review — Artifact Templates

Use these exact templates when writing the three review artifacts.

---

## `review-files.md`

**Column definitions:**
- **Structure** (1–5): file size, single responsibility, clear organization, no mixed concerns
- **Quality** (1–5): type safety, no `any`/`unknown` casts, error handling, no dead code, clean naming
- **Patterns** (1–5 or N/A): DI/testability, correct platform patterns, no anti-patterns; `N/A` for pure utils/types with no external dependencies
- **Tests**: `✓` adequate | `⚠` has tests but meaningful gaps | `✗` missing test file | `N/A` presentational-only or barrel export

```markdown
## File inventory: [app name]

| File | Structure | Quality | Patterns | Tests | Notes |
| ---- | --------- | ------- | -------- | ----- | ----- |
| src/main.tsx | 5 | 5 | N/A | N/A | Clean entry point |
| src/services/cdfClient.ts | 3 | 2 | 2 | ✗ | No DI; raw SDK calls; no test file (1.2, 1.6, 2.5) |
| src/hooks/useData.ts | 4 | 3 | 3 | ⚠ | Direct import; 4 tests but no error path coverage (1.4, 1.6, 2.3) |
| src/utils/chunking.ts | 5 | 5 | N/A | ✓ | Pure functions; full coverage |
| src/contexts/index.ts | 5 | 5 | N/A | N/A | Barrel re-export only |
```

---

## `review-packages.md`

```markdown
## Package audit: [app name]

### Dependencies

| Package | Used version | Latest | Weekly downloads | Last published | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------------- | -------------- | ---------- | ---- | ------ |
| react | ^18.2.0 | 18.3.1 | 25M | 2024-04-26 | No | 0 | Pass |
| some-old-lib | ^1.0.0 | 1.0.3 | 5k | 2021-03-15 | No | 0 | Fail |

### devDependencies

| Package | Used version | Latest | Weekly downloads | Last published | Deprecated | CVEs | Health |
| ------- | ------------ | ------ | ---------------- | -------------- | ---------- | ---- | ------ |
| vitest | ^1.0.0 | 2.1.0 | 3M | 2024-10-01 | No | 0 | Pass |

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

### Health summary

- **Pass:** N packages
- **Warn:** N packages
- **Fail:** N packages
```

---

## `review-report.md`

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

[2–4 sentences: positives first, then a clear statement of how many blocking issues and what they are at a high level]

### Reviewed commit

`<full SHA>` ([link to commit on GitHub if available, otherwise local path and date])

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
