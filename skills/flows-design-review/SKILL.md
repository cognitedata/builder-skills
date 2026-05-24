---
name: flows-design-review
description: >-
  Semi-automated design quality review for Flows apps. Runs concrete repo
  probes (grep, lint, build) to propose a draft 1–5 score for each of the
  official 10 quality-guidelines questions from
  docs.cognite.com/cdf/flows/guides/quality-guidelines, then asks the user to
  confirm or override each score. Still requires the user to walk their tasks
  end-to-end in the running app (Step 2) since navigation and clickability
  feel cannot be measured statically. Writes
  reviews/design-review/feedback-round-<N>/design-review-report.md with an
  overall average and prioritized fix lists. Use when the user asks to run a
  Flows design review, run the design quality assessment, or run
  flows-design-review. Must be run AFTER flows-code-review reaches 0 Must Fix
  and BEFORE flows-external-app-submit.
allowed-tools: Read, Glob, Grep, Shell, Write, AskQuestion
---

# Flows Design Review

This is **step 3** of the Flows app certification flow:

```
flows-app-brief  →  build  →  flows-code-review  →  flows-design-review (this skill)  →  flows-external-app-submit
```

This is the **manual design quality assessment** described in
[docs.cognite.com/cdf/flows/guides/quality-guidelines](https://docs.cognite.com/cdf/flows/guides/quality-guidelines).
Target overall average: **3.8 or higher** to be launch-ready.

## Operating rules

- **Run all probes before sending the user to do the walkthrough.** The Q1–Q10 probe commands are pure shell — they have no dependency on walkthrough results. Fire them all in Step 0, then dispatch the user to walk the app. By the time they return, the probe evidence is ready and scoring is one pass, not ten.
- **Score all 10 questions in one batch.** After the walkthrough returns, build a draft score table using all probe evidence and present it in a single message. One `AskQuestion` covers all overrides — no per-question confirm loops.
- Pre-fill user, tasks, and persona context from `App-Brief.md` frontmatter when present.

## Step 0 — Run ALL probes and choose feedback round

**Run every probe below before doing anything else or prompting the user.** The probes are independent of the walkthrough and provide the hard evidence for all 10 questions.

**Feedback round:** Check `reviews/design-review/`. If it doesn't exist, use `feedback-round-1/`. Otherwise increment to the next missing `feedback-round-<N>/` directory.

**Context sources (read silently):**
- `App-Brief.md` frontmatter — primary user, tasks, success criteria
- `package.json` — confirm `@cognite/aura` version (Q1)
- Latest `reviews/code-review/feedback-round-<N>/code-review-report.md` — design-adjacent findings for Q4/Q10

**Q1 — Aura consistency:**
```bash
rg '#[0-9a-fA-F]{3,8}\b' src --type css --type tsx --type ts -l 2>/dev/null
rg '\b(rgb|rgba|hsl|hsla)\(' src --type tsx --type css -l 2>/dev/null
grep -c '@cognite/aura' package.json
```

**Q2 — Navigation (relies on walkthrough — collect route count as baseline):**
```bash
rg '<Route\b' src --type tsx -c 2>/dev/null
rg 'Breadcrumb' src --type tsx -l 2>/dev/null
rg '<Topbar|<Sidebar|<Header' src --type tsx -l 2>/dev/null
```

**Q3 — Labels and language:**
```bash
rg '>(Submit|OK|Click here|Go|Yes|No)<' src --type tsx -c 2>/dev/null
rg 'placeholder=' src --type tsx -c 2>/dev/null
```

**Q4 — System feedback:**
```bash
rg 'isLoading|isPending|<Skeleton|<Loader|<Spinner' src --type tsx -l 2>/dev/null
rg 'isError|onError|<Alert|toast\.' src --type tsx -l 2>/dev/null
rg 'useMutation' src --type tsx -l 2>/dev/null
```

**Q5 — Clickability:**
```bash
rg '<div[^>]*onClick' src --type tsx -c 2>/dev/null
rg '<span[^>]*onClick' src --type tsx -c 2>/dev/null
rg 'hover:|focus:' src --type tsx -c 2>/dev/null
```

**Q6 — Error prevention:**
```bash
rg 'delete|remove|archive|reset' src --type tsx -i -l 2>/dev/null | head -20
rg 'AlertDialog|ConfirmDialog|window\.confirm' src --type tsx -l 2>/dev/null
```

**Q7 — Responsive:**
```bash
rg '\b(sm|md|lg|xl|2xl):' src --type tsx -c 2>/dev/null
rg '\bw-\[[0-9]+px\]|\bh-\[[0-9]+px\]' src --type tsx -c 2>/dev/null
```

**Q8 — Empty states:**
```bash
rg -i 'empty|no\s+(data|results|items)' src --type tsx -l 2>/dev/null
rg '<EmptyState|EmptyPlaceholder' src --type tsx -l 2>/dev/null
rg 'items\.length === 0' src --type tsx -c 2>/dev/null
```

**Q9 — Performance (use existing build if fresh; only rebuild if dist/ is stale or missing):**
```bash
find dist -maxdepth 1 -newer package.json -name '*.js' 2>/dev/null | wc -l
du -sh dist/ 2>/dev/null
rg 'React\.lazy|lazy\(' src --type tsx -c 2>/dev/null
rg '\.list\([^)]*\)' src --type ts --type tsx -l 2>/dev/null | xargs -I{} grep -l 'limit:' {} 2>/dev/null | wc -l
```

**Q10 — Accessibility:**
```bash
rg '<img\b(?![^>]*\balt=)' src --type tsx -c 2>/dev/null
rg '<button[^>]*>\s*<(svg|Icon)' src --type tsx -c 2>/dev/null
rg 'aria-label=' src --type tsx -c 2>/dev/null
rg 'focus-visible:|focus:' src --type tsx -c 2>/dev/null
```

After all probes complete, show the user a summary of what was found and tell them:

> "Probe collection complete. Now please do the manual task walkthrough (Step 2) and return here with your findings."

## Step 1 — Confirm user and tasks

Parse `userRole`, `oneSentenceStory`, and `successCriteria` from `App-Brief.md` frontmatter and propose them as the primary user and 2–3 critical tasks. Ask the user to confirm or extend via `AskQuestion` (one call, batched with the probe summary).

## Step 2 — Walk each task end-to-end (manual)

Instruct the user to:
1. Open the app **as that user** in a clean browser session with representative test data.
2. Complete each task from beginning to end without shortcuts.
3. Note pain points: where they get stuck, confused, or make errors.

For each task, prompt the user to paste back: what happened, where they got stuck, and any screenshots / notes. Capture as `taskWalkthroughs[]` for the report.

Do NOT proceed to scoring until the user confirms they walked every task. If they refuse, write a stub report recording "task walkthrough skipped" and exit — do not score.

## Step 3 — Score all 10 questions in one batch

All probes already ran in Step 0. Using those results plus the walkthrough findings from Step 2:

1. Apply the heuristic table below to translate probe counts into a draft score for each of Q1–Q10.
2. Cross-check navigation (Q2), clickability (Q5), and error prevention (Q6) against the walkthrough notes — lived experience overrides probe counts for these.
3. Present a **single score table** with all 10 proposed scores and a one-line rationale each.
4. Use one `AskQuestion` call: *"Here are the proposed scores. Reply with any overrides as `Q<N>: <score> — <reason>`, or 'all good'."*
5. Apply any overrides and capture final scores.

### Heuristics for translating probe counts into a draft score

| Signal | Drift toward |
| --- | --- |
| 0 anti-pattern matches, lint clean for the relevant rule | 5 |
| ≤ 3 small matches, mostly in one file | 4 |
| 5–15 matches across several files, or 1 systemic issue | 3 |
| 15+ matches, or pervasive anti-pattern | 2 |
| Anti-pattern is the default style | 1 |

### The 10 questions and rubric

**Q1 — Aura consistency.** Probe evidence: hard-coded hex/rgb colors, `aura/no-overriding-styles` warnings, Aura import count. Score 5 = no hard-coded colors + lint clean. Score 2–3 = many warnings or no Aura imports.

| 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|
| All Aura tokens, no overrides, no hard-coded values | Mostly Aura, 1–2 exceptions | Mix of Aura and custom, some overrides | Heavy custom colors/spacing, breaks patterns | No Aura usage at all |

**Q2 — Navigation and hierarchy.** Probe evidence: route count, breadcrumb usage, top-level chrome. **Default to the walkthrough finding** — navigation feel is not statically measurable.

| 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|
| Location always clear, consistent nav, strong hierarchy | Usually clear, minor exceptions | Sometimes unclear, works but not intuitive | Often confusing, nav changes between pages | No location cues, no navigation |

**Q3 — Labels and language.** Probe evidence: vague button labels count, placeholder-as-label count, input-to-label ratio.

| 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|
| Every element clearly labeled, action-oriented language | Mostly clear, minor ambiguity | Some vague labels ("Submit", "OK"), some jargon | Many unclear labels, heavy technical terms | Labels missing or confusing |

**Q4 — System feedback.** Probe evidence: loading/skeleton coverage per fetch file, mutation error-handler coverage.

| 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|
| Every fetch/mutation has loading + error state | Most covered, few gaps | Inconsistent — some loading states missing | Minimal feedback, users don't know if actions worked | No feedback, silent failures |

**Q5 — Clickability.** Probe evidence: `<div onClick>` without role count, hover/focus utility count. Cross-check walkthrough.

| 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|
| All clickable elements look clickable, hover/focus on all | Most obvious, hover mostly present | Inconsistent hover states | Many elements don't look clickable | Can't tell what's interactive |

**Q6 — Error prevention.** Probe evidence: destructive verbs vs confirm-dialog pairings. **N/A rule:** read-only apps with no destructive actions score **5** automatically — do not penalize for lacking confirmations they don't need.

| 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|
| Confirmations before destructive actions (OR no destructive actions) | Most covered, some auto-save | Some warnings for major actions | Few warnings, no undo | No warnings, frequent accidental data loss |

**Q7 — Responsive.** Probe evidence: Tailwind responsive utilities count, fixed-px sizing count. If `App-Brief.md` `userRole` says "desktop/control room", desktop-only is acceptable — score 5 if clean at 13".

| 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|
| Seamless across sizes (OR intentionally desktop-only and clean) | Works on most, minor issues | Functional but not optimized | Poor mobile/tablet | Desktop only, broken on other sizes |

**Q8 — Empty states.** Probe evidence: empty-state component count, `items.length === 0` branch count per data-fetching panel.

| 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|
| All empty states helpful with next steps | Most helpful, minor gaps | Some explained | Many blank pages | Blank pages everywhere |

**Q9 — Performance.** Probe evidence: `dist/` size (from Step 0 — skip rebuild if fresh), code-splitting, pagination coverage. Flag dist > 2 MB.

| 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|
| Fast, progressive, paginated, code-split | Reasonable, most tasks streamlined | Acceptable, some slow spots | Slow, tasks require many steps | Very slow or unresponsive |

**Q10 — Accessibility.** Probe evidence: `<img>` without `alt`, icon-only buttons without `aria-label`, focus styles.

| 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|
| Full keyboard nav, WCAG AA contrast, ARIA labels, alt text | Most requirements met | Basic keyboard, mostly acceptable contrast | Limited keyboard, contrast failures | No keyboard nav, no focus indicators |

## Step 4 — Compute average and quality level

Average = sum of all 10 scores ÷ 10.

Map to the quality level table from the docs:

| Average | Quality level | Recommendation |
| --- | --- | --- |
| 4.5 – 5.0 | Excellent — ready to launch | Minor improvements over time |
| 3.8 – 4.4 | Good — launch with minor fixes | Address lower-scoring areas |
| 3.0 – 3.7 | Average — needs improvement | Fix major problems before launching |
| Below 3.0 | Needs significant work | Substantial improvements required |

`flows-external-app-submit` gates on **average ≥ 3.8**.

## Step 5 — Write the report

Create `reviews/design-review/feedback-round-<N>/design-review-report.md` with this structure:

```markdown
# Design Review — <appName> — round <N>

## User and tasks

- **Primary user:** ...
- **Tasks evaluated:**
  1. ...
  2. ...
  3. ...
- **Context:** ...

## Task walkthrough findings

- **Task 1 — ...** ...
- **Task 2 — ...** ...
- **Task 3 — ...** ...

## Scores

| Question | Score | Rationale | Improvement note |
| --- | --- | --- | --- |
| Q1 Aura consistency | n | ... | ... |
| Q2 Navigation & hierarchy | n | ... | ... |
| Q3 Labels & language | n | ... | ... |
| Q4 Feedback & validation | n | ... | ... |
| Q5 Clickability | n | ... | ... |
| Q6 Error prevention | n | ... | ... |
| Q7 Responsive | n | ... | ... |
| Q8 Empty states | n | ... | ... |
| Q9 Performance | n | ... | ... |
| Q10 Accessibility | n | ... | ... |

## Summary

- Average score: <X.X>
- Quality level: <Excellent | Good | Average | Needs significant work>

## Must Fix (any score < 3)

- ...

## Should Fix (any score 3 – 3.7)

- ...

## Nice to Fix (any score 3.8 – 4.4)

- ...
```

The `Average score:` line must be machine-readable in exactly that format — `flows-external-app-submit` parses it.

## Step 6 — Print the gate status

After writing, print to the terminal:
- The average score
- The quality level
- Whether the result meets the `flows-external-app-submit` gate (≥ 3.8)
- If below 3.8, instruct the user to fix Must Fix and Should Fix items and re-run this skill in a new feedback round.
