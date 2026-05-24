---
name: flows-external-app-submit
description: >-
  Final gate of the Flows app certification flow for external submission.
  Verifies that flows-app-brief, flows-code-review, and flows-design-review have
  all been run and are in a passing state (App-Brief.md complete, 0 Must Fix in
  latest code review, design average ≥ 3.8), then runs
  `npx @cognite/cli apps submit` to zip the repo and pre-populate the submission
  form. Use when the user asks to submit a Flows app for certification, run
  flows-external-app-submit, or finalize an app for external review.
allowed-tools: Read, Glob, Grep, Shell, AskQuestion
---

# Flows External App Submit

```
flows-app-brief  →  build  →  flows-code-review  →  flows-design-review  →  flows-external-app-submit (this skill)
```

## Step 1 — Verify App-Brief.md

```bash
test -f App-Brief.md
```

Missing → fail: *"Run `flows-app-brief` first."*

Parse YAML frontmatter. Required fields (must be non-empty): `appName`, `customer`, `tier`, `owner`, `userRole`, `currentProblem`, `oneSentenceStory`, `successCriteria`, `userEvidence`.

Any missing → fail with the list: *"Re-run `flows-app-brief` to complete the brief."*

Optional (not blocking): `userCount`, `businessValue`, `milestones`, `repoUrl`.

## Step 2 — Verify code review

```bash
git ls-files 'reviews/code-review/' | grep 'code-review-report.md' | sort -V | tail -1
```

Nothing returned → fail: *"Run `flows-code-review` first, then `git add reviews/ && git commit`."*

(`apps submit` uses `git archive HEAD` — artifacts must be committed or they disappear from the zip.)

Parse the report's Summary block for `^- Must Fix open: (\d+)$`. Must be `0` → pass. Otherwise → fail: *"Re-run `flows-code-review` until `Must Fix open: 0`."*

Missing Summary block → fail: *"Summary block missing. Re-run `flows-code-review`."*

## Step 3 — Verify design review

```bash
git ls-files 'reviews/design-review/' | grep 'design-review-report.md' | sort -V | tail -1
```

Nothing returned → fail: *"Run `flows-design-review` first, then `git add reviews/ && git commit`."*

Parse for `^- Average score: (\d+(?:\.\d+)?)$`. ≥ 3.8 → pass. Otherwise → fail: *"Average below 3.8. Fix Must Fix / Should Fix items and re-run `flows-design-review` in a new feedback round."*

## Step 4 — Working tree and deploy bundle

**Deploy bundle** (required — `apps submit` includes it in the submission zip):
```bash
ls .cognite-bundles/*.zip 2>/dev/null | head -1
```
Nothing → fail: *"Run `npx @cognite/cli apps deploy` first to generate the deploy bundle."*

**Uncommitted changes** (warn, don't block):
```bash
git status --porcelain
```
Non-empty → warn: *"Uncommitted changes will not appear in the source archive (`git archive HEAD` packages committed files only). Commit them if they should be part of the certification."*

## Step 5 — Print pass/fail table

```
Check                            Result
-----                            ------
App-Brief.md complete            PASS / FAIL — reason
Code review Must Fix open: 0     PASS / FAIL — reason
Design review average ≥ 3.8      PASS / FAIL — reason
Deploy bundle present            PASS / FAIL — reason
Working tree clean               PASS / WARN — reason
```

Any FAIL → stop. Print which skill to run next.

## Step 6 — Confirm and submit

All pass → `AskQuestion`: *"All certification checks passed. Run `npx @cognite/cli apps submit` now?"*

On yes:
```bash
npx @cognite/cli@latest apps submit
```

If the subcommand isn't available yet (unknown command error), print: *"Verification passed, but `apps submit` is not yet available. Re-run this skill when the CLI ships it."*
