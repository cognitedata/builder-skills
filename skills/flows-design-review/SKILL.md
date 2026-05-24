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

```
flows-app-brief  →  build  →  flows-code-review  →  flows-design-review (this skill)  →  flows-external-app-submit
```

Target average: **≥ 3.8** ([quality guidelines](https://docs.cognite.com/cdf/flows/guides/quality-guidelines)).

## Step 0 — Run all probes + choose feedback round

Run all probes before prompting the user for anything. Issue all Q1–Q10 probe groups as a single parallel batch — do not wait for one to finish before starting the next. Determine the next round number from `reviews/design-review/` (`feedback-round-1/` if none exist).

Read silently: `App-Brief.md` frontmatter (user/tasks/success criteria), `package.json` (Aura version), latest `reviews/code-review/.../code-review-report.md` (design-adjacent findings for Q4/Q10).

**Q1 — Aura:**
```bash
rg '#[0-9a-fA-F]{3,8}\b' src --type css --type tsx --type ts -l 2>/dev/null
rg '\b(rgb|rgba|hsl|hsla)\(' src --type tsx --type css -l 2>/dev/null
grep -c '@cognite/aura' package.json
```

**Q2 — Navigation:**
```bash
rg '<Route\b' src --type tsx -c 2>/dev/null
rg 'Breadcrumb' src --type tsx -l 2>/dev/null
rg '<Topbar|<Sidebar|<Header' src --type tsx -l 2>/dev/null
```

**Q3 — Labels:**
```bash
rg '>(Submit|OK|Click here|Go|Yes|No)<' src --type tsx -c 2>/dev/null
rg 'placeholder=' src --type tsx -c 2>/dev/null
```

**Q4 — Feedback:**
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

**Q9 — Performance** (use existing dist if fresh; skip rebuild):
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

After probes complete, show the probe summary and dispatch the user: *"Probes done. Please walk each task in the running app and return with your findings (Step 2)."*

## Step 1 — Confirm user and tasks

Parse `userRole`, `oneSentenceStory`, `successCriteria` from `App-Brief.md`. Propose as primary user + 2–3 critical tasks. Confirm via `AskQuestion` — batch this with the probe summary above.

## Step 2 — Walk each task end-to-end (manual)

Instruct the user to open the app as that user in a clean browser session with real test data, complete each task without shortcuts, and note where they get stuck or confused.

For each task, collect: what happened, where they got stuck, screenshots/notes. Capture as `taskWalkthroughs[]` for the report.

Do not proceed to scoring until the user confirms all tasks were walked. If they refuse: write a stub report noting "task walkthrough skipped" and exit.

## Step 3 — Score all 10 questions in one batch

Using Step 0 probe results + Step 2 walkthrough notes:

1. Apply the heuristic table to each Q.
2. Q2 (navigation), Q5 (clickability), Q6 (error prevention): walkthrough overrides probes.
3. Present a single draft score table with one-line rationale per question.
4. `AskQuestion`: *"Reply with overrides as `Q<N>: <score> — <reason>`, or 'all good'."*
5. Apply overrides, lock scores.

**Heuristics:**

| Probe signal | Score |
|---|---|
| 0 anti-pattern matches, lint clean | 5 |
| ≤ 3 matches, mostly one file | 4 |
| 5–15 matches or 1 systemic issue | 3 |
| 15+ matches or pervasive | 2 |
| Anti-pattern is the default style | 1 |

**Q1 — Aura.** Hard-coded colors + CSS overrides → score. All Aura tokens, no overrides → 5; no Aura at all → 1.

**Q2 — Navigation.** Walkthrough is authoritative; probe gives baseline. Location always clear → 5; no location cues → 1.

**Q3 — Labels.** Vague-label + placeholder-as-label count. Every element clearly labeled → 5; labels missing → 1.

**Q4 — Feedback.** Loading + error state coverage per fetch/mutation. Every case covered → 5; silent failures → 1.

**Q5 — Clickability.** `<div onClick>` count + hover/focus utilities; walkthrough overrides. All obvious → 5; can't tell → 1.

**Q6 — Error prevention.** Destructive verbs vs confirm-dialog pairings. No destructive actions in app → **5** automatically.

**Q7 — Responsive.** Tailwind responsive utilities vs fixed-px count. "Desktop/control room" in `App-Brief.md` → desktop-only acceptable; score 5 if clean at 13".

**Q8 — Empty states.** Empty-state components + `items.length === 0` branches per panel. All helpful with next steps → 5; blank everywhere → 1.

**Q9 — Performance.** `dist/` > 2 MB → flag; code-splitting present; pagination coverage. Fast + progressive + code-split → 5.

**Q10 — Accessibility.** `<img>` without `alt`, icon buttons without `aria-label`, focus styles. Full keyboard + WCAG AA → 5; no keyboard nav → 1.

## Step 4 — Compute average

Average = sum ÷ 10. Levels: ≥ 4.5 Excellent, 3.8–4.4 Good (launch-ready), 3.0–3.7 Average (fix before launch), < 3.0 Needs significant work.

Gate: `flows-external-app-submit` requires **≥ 3.8**.

## Step 5 — Write the report

`reviews/design-review/feedback-round-<N>/design-review-report.md`:

```markdown
# Design Review — <appName> — round <N>

## User and tasks

- **Primary user:** ...
- **Tasks:** 1. ... 2. ... 3. ...

## Task walkthrough findings

- **Task 1:** ...
- **Task 2:** ...

## Scores

| Question | Score | Rationale | Improvement |
|---|---|---|---|
| Q1 Aura | n | ... | ... |
| Q2 Navigation | n | ... | ... |
| Q3 Labels | n | ... | ... |
| Q4 Feedback | n | ... | ... |
| Q5 Clickability | n | ... | ... |
| Q6 Error prevention | n | ... | ... |
| Q7 Responsive | n | ... | ... |
| Q8 Empty states | n | ... | ... |
| Q9 Performance | n | ... | ... |
| Q10 Accessibility | n | ... | ... |

## Summary

- Average score: <X.X>
- Quality level: <Excellent | Good | Average | Needs significant work>

## Must Fix (score < 3)

- ...

## Should Fix (score 3–3.7)

- ...

## Nice to Fix (score 3.8–4.4)

- ...
```

`Average score:` must be machine-readable in exactly that format — `flows-external-app-submit` parses it.

## Step 6 — Print gate status

Print: average, quality level, pass/fail vs 3.8. If below 3.8: instruct the user to fix Must Fix / Should Fix and re-run in a new feedback round.
