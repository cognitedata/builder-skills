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
allowed-tools: Read, Glob, Grep, Bash, AskQuestion
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
2. The latest `reviews/code-review/feedback-round-<N>/code-review-report.md` is **committed to git** and reports **`Must Fix open: 0`**.
3. The latest `reviews/design-review/feedback-round-<N>/design-review-report.md` is **committed to git** and reports **`Average score: X.X`** with **X.X ≥ 3.8**.
4. Certification artifacts are committed — `apps submit` uses `git archive HEAD` and silently excludes uncommitted files.
5. A deploy bundle exists in `.cognite-bundles/` and is not older than HEAD.

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

Find the latest committed round report:

```bash
git ls-files 'reviews/code-review/' | grep 'code-review-report.md' | sort -V | tail -1
```

If no result → fail with: *"Run `flows-code-review` first, then commit the artifacts."*

Parse the Summary block from that `code-review-report.md`. It must contain a line matching this exact regex:

```
^- Must Fix open: (\d+)$
```

If the integer is `0` → pass. Otherwise → fail with: *"Open Must Fix items remain in the latest `code-review-report.md`. Re-run `flows-code-review` until `Must Fix open: 0`."*

If the line is missing entirely → fail with: *"Latest code review report is missing the Summary block. Re-run `flows-code-review`."*

## Step 3 — Verify design review

Find the latest committed round report:

```bash
git ls-files 'reviews/design-review/' | grep 'design-review-report.md' | sort -V | tail -1
```

If no result → fail with: *"Run `flows-design-review` first, then commit the artifacts."*

Parse the Summary block from that `design-review-report.md`. It must contain a line matching:

```
^- Average score: (\d+(?:\.\d+)?)$
```

If the number is **≥ 3.8** → pass. Otherwise → fail with: *"Design review average is below the launch threshold (3.8). Address the Must Fix and Should Fix items in the latest design-review-report.md and re-run `flows-design-review` in a new feedback round."*

## Step 4 — Verify certification artifacts are committed

`apps submit` uses `git archive HEAD` — uncommitted files are silently excluded from the source archive. Check that the three certification artifacts are tracked:

```bash
git ls-files --error-unmatch App-Brief.md 2>/dev/null
git ls-files --error-unmatch "<latest-code-review-report-path>" 2>/dev/null
git ls-files --error-unmatch "<latest-design-review-report-path>" 2>/dev/null
```

If **any** of these files is not committed → **BLOCK** with:

> "The following certification files are not committed to git. `apps submit` uses `git archive HEAD` and will silently omit them from the source archive — the reviewer will not see them.\n\nPlease run:\n  git add <missing files>\n  git commit -m 'chore: add certification artifacts'\n\nThen re-run this skill."

If all certification artifacts are committed but there are **other** uncommitted changes in the working tree → **WARN** (do not block):

> "You have uncommitted changes outside the certification artifacts. `apps submit` uses `git archive HEAD` — those changes will not appear in the submitted source archive. If they should be part of certification, commit them first."

## Step 5 — Verify deploy bundle

```bash
ls .cognite-bundles/*.zip 2>/dev/null | head -1
```

If no bundle exists → **WARN** (do not block): *"No deploy bundle found in `.cognite-bundles/`. Run `npx @cognite/cli apps deploy` first so the submitted source archive and deployed bundle come from the same code."*

If a bundle exists, check whether it pre-dates HEAD:

```bash
bundle=$(ls -1t .cognite-bundles/*.zip 2>/dev/null | head -1)
if [ -n "$bundle" ]; then
  bundle_mtime=$(stat -f %m "$bundle" 2>/dev/null || stat -c %Y "$bundle")
  head_time=$(git log -1 --format=%ct HEAD)
  if [ "$bundle_mtime" -lt "$head_time" ]; then
    echo "WARN"
  fi
fi
```

If the bundle is older than HEAD → **WARN** (do not block):

> "The deploy bundle in `.cognite-bundles/` is older than the current HEAD commit. The certification reviewer compares the deployed bundle against the submitted source — if you committed changes after your last deploy, they won't match. Re-run `npx @cognite/cli apps deploy` before submitting. (`npm run build` alone does not refresh the bundle — only `apps deploy` does.)"

## Step 6 — Print pass/fail table

Print a table like:

```
Check                                  Result
-----                                  ------
App-Brief.md complete                  PASS / FAIL — reason
Code review Must Fix open: 0           PASS / FAIL — reason
Design review average ≥ 3.8            PASS / FAIL — reason
Certification artifacts committed      PASS / FAIL — reason
Deploy bundle present and current      PASS / WARN — reason
```

If **any** check is FAIL: stop here. Do not run the CLI. Print the precise next-step skill the user should run.

## Step 7 — Confirm and submit

If all checks pass (warnings are OK), use `AskQuestion` to confirm:
> "All certification checks passed. Run `npx @cognite/cli apps submit` now? This will zip the repo and pre-populate the Zendesk submission form."

On `yes`:

```bash
npx @cognite/cli@latest apps submit
```

Stream the output to the user.

## Step 8 — Post-submit handoff

When this skill invokes `apps submit` via `Bash`, the CLI runs non-interactively (`process.stdout.isTTY === false`) and skips its auto-open-browser / reveal-in-file-manager step. The CLI still prints the file list, screen-recording prompt, and Zendesk URL — but the user must act on them manually.

After the CLI finishes, print this to the user:

> The CLI ran non-interactively so it didn't open the browser or file manager. To finish:
>
> 1. Open the Zendesk URL from the CLI output above. **The URL requires a sign-in on `support.cognite.com` — create an account there if you don't have one, then revisit the link.**
> 2. Open `dist/submit/` in your file manager and drop in a short screen recording of the certified user journey.
> 3. Attach every file in `dist/submit/` (source archive, deploy bundle, screen recording) to the Zendesk ticket.
> 4. Push your commits if the branch is ahead of origin.

Then run `git status --short --branch` and surface the ahead/behind count explicitly under step 4 if the branch is ahead of origin.
