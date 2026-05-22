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
allowed-tools: Read, Glob, Grep, Shell, Write
---

# Flows Code Review

This skill is the **technical review** step of the Flows app certification flow:

```
flows-app-brief  →  build  →  flows-code-review (this skill, repeat until clean)  →  flows-design-review  →  flows-external-app-submit
```

## Pre-scan policy: do not run your own

Unlike `flows-app-brief` and `flows-design-review`, this skill **must not** add its own exploratory pre-scan of the repo. The upstream `cognitedata/dune-app-reviews` command already performs a structured scan (per-file inventory, dependency audit, pattern checks) against the official scoring criteria. A second scan layered on top would:

- duplicate work the upstream command does better,
- risk biasing the reviewer with stale or partial findings, and
- diverge from the official scoring rubric.

The only pre-checks this skill should perform are deterministic preconditions:
- `package.json` exists and we are in a Node/TS project
- we are inside a git repository
- `App-Brief.md` exists at the repo root (a context hint for the reviewer — if missing, warn the user that `flows-app-brief` should be run first, but continue)

Anything substantive belongs in the upstream command.

## Step 1 — Fetch the upstream review command

Fetch the official review command and follow it exactly:

```bash
gh api repos/cognitedata/dune-app-reviews/contents/.claude/commands/dune-review.md \
  --jq '.content' | base64 -d
```

## Step 2 — Adapt for a local developer review

- Treat the **current workspace** as the app under review.
- Skip all ticket, PR, overview, submodule, and `reviews/<TICKET-ID>/...` setup steps.
- If the upstream command asks for Jira ticket or PR input, ignore that requirement and continue with the local codebase.
- Write artifacts to **`reviews/code-review/feedback-round-<N>/`**:
  - `code-review-report.md` (this is the renamed `review-report.md` from upstream — use this filename always)
  - `review-files.md`
  - `review-packages.md`
- If no local feedback round exists yet, use `reviews/code-review/feedback-round-1/`. For reruns, increment the round number (`feedback-round-2/`, `feedback-round-3/`, ...).

## Step 3 — Surface the Must-Fix count

The final section of `code-review-report.md` MUST include a machine-readable summary block so `flows-external-app-submit` can gate on it deterministically:

```markdown
## Summary

- Must Fix open: <integer>
- Should Fix open: <integer>
- Nice Fix open: <integer>
```

Use exactly those labels and the singular line format above. When all Must Fix items are resolved, the line MUST read `Must Fix open: 0`.

Print the same three counts to the terminal at the end of the run so the user sees the gate status without opening the report.

## Step 4 — Verify

After the review artifacts are written, fetch the official verification command and follow it too:

```bash
gh api repos/cognitedata/dune-app-reviews/contents/.claude/commands/dune-review-verify.md \
  --jq '.content' | base64 -d
```

Adapt verification the same way:
- Skip ticket and feedback-round lookup.
- Read the three artifacts from `reviews/code-review/feedback-round-<N>/` (note `code-review-report.md`, not `review-report.md`).
- Verify the review against the local source code before declaring it complete.

## When to stop

Re-run this skill until `Must Fix open: 0` in the latest round's `code-review-report.md`. Only then proceed to `flows-design-review`.
