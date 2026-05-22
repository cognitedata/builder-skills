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

This is **step 4** (final) of the Flows app certification flow:

```
flows-app-brief  →  build  →  flows-code-review  →  flows-design-review  →  flows-external-app-submit (this skill)
```

This skill **does not** rerun any review. It verifies the artifacts from the prior three steps and only then invokes the CLI submit command.

## Preconditions (show these to the user first)

Before doing anything, print this checklist so the user knows exactly what is being verified:

1. `App-Brief.md` exists at repo root and all **required** frontmatter fields are populated.
2. The latest `reviews/code-review/feedback-round-<N>/code-review-report.md` exists and reports **`Must Fix open: 0`**.
3. The latest `reviews/design-review/feedback-round-<N>/design-review-report.md` exists and reports **`Average score: X.X`** with **X.X ≥ 3.8**.
4. The working tree is clean (uncommitted changes are warned, not blocked).

## Step 1 — Verify App-Brief.md

```bash
test -f App-Brief.md
```

If missing → fail with: *"Run `flows-app-brief` first to create the App-Brief.md."*

Parse the YAML frontmatter (the block between the first `---` and the next `---` at the top of the file). Required keys that must be present **and** non-empty:
- `appName`
- `customer`
- `tier`
- `owner`
- `userRole`
- `currentProblem`
- `oneSentenceStory`
- `successCriteria`
- `userEvidence`

If any are missing or empty → fail with the list of missing fields and: *"Re-run `flows-app-brief` to complete the brief."*

Optional (not blocking): `userCount`, `businessValue`, `milestones`, `repoUrl`.

## Step 2 — Verify code review

```bash
ls -d reviews/code-review/feedback-round-* 2>/dev/null | sort -V | tail -1
```

Pick the highest-numbered round. If the directory does not exist or has no `code-review-report.md`, fail with: *"Run `flows-code-review` first."*

Parse the Summary block from `code-review-report.md`. It must contain a line matching this exact regex:

```
^- Must Fix open: (\d+)$
```

If the integer is `0` → pass. Otherwise → fail with: *"Open Must Fix items remain in `reviews/code-review/feedback-round-<N>/code-review-report.md`. Re-run `flows-code-review` until `Must Fix open: 0`."*

If the line is missing entirely → fail with: *"Latest code review report is missing the Summary block. Re-run `flows-code-review`."*

## Step 3 — Verify design review

```bash
ls -d reviews/design-review/feedback-round-* 2>/dev/null | sort -V | tail -1
```

Pick the highest-numbered round. If the directory does not exist or has no `design-review-report.md`, fail with: *"Run `flows-design-review` first."*

Parse the Summary block from `design-review-report.md`. It must contain a line matching:

```
^- Average score: (\d+(?:\.\d+)?)$
```

If the number is **≥ 3.8** → pass. Otherwise → fail with: *"Design review average is below the launch threshold (3.8). Address the Must Fix and Should Fix items in `reviews/design-review/feedback-round-<N>/design-review-report.md` and re-run `flows-design-review` in a new feedback round."*

## Step 4 — Working tree check

```bash
git status --porcelain
```

If non-empty → **warn** (do not block): *"You have uncommitted changes. The submit command will zip your current working tree, including those changes."*

## Step 5 — Print pass/fail table

Print a table like:

```
Check                                  Result
-----                                  ------
App-Brief.md complete                  PASS / FAIL — reason
Code review Must Fix open: 0           PASS / FAIL — reason
Design review average ≥ 3.8            PASS / FAIL — reason
Working tree clean                     PASS / WARN — reason
```

If **any** check is FAIL: stop here. Do not run the CLI. Print the precise next-step skill the user should run.

## Step 6 — Confirm and submit

If all checks pass, use `AskQuestion` to confirm:
> "All certification checks passed. Run `npx @cognite/cli apps submit` now? This will zip the repo and pre-populate the Zendesk submission form."

On `yes`:

```bash
npx @cognite/cli@latest apps submit
```

Stream the output to the user.

**Note on CLI availability.** The `apps submit` subcommand is in active development. If the CLI fails because the subcommand is not yet available (exit code non-zero with an "unknown command" / "not found" style message), do NOT mark this skill as failed. Instead, print:

> "Verification passed, but `npx @cognite/cli apps submit` is not yet available in this CLI version. Your app is certification-ready. When the CLI ships the `apps submit` subcommand, re-run this skill to complete submission."

This way the verification gate is still useful while the CLI catches up.
