---
name: dune-design-review
description: >-
  Run a design quality review of a Dune app against the 9 design heuristics.
  Produces a design-review-report.md with scored findings and fix list. Use when
  the user asks for a design review, UX review, Aura compliance check, or
  "run dune-design-review" on a codebase.
allowed-tools: Read, Glob, Grep, Shell, Write
---

# Dune Design Review

## User Input

```text
$ARGUMENTS
```

The user input should be a **Jira ticket ID** (e.g. `CDFNEW-3593`) and optionally a **GitHub PR link**. If the PR link is not provided, it should be available in the Jira ticket description. If neither is provided, ask the user.

Optionally the user may specify a **feedback round number** (e.g. `round 2`). If not specified, determine the next round by checking for existing `feedback-round-N/` folders under the ticket directory. If none exist, use `feedback-round-1`.

## Goal

Review the **entire application UI** against the 9 Dune design quality heuristics. This is the design counterpart to `/dune-app-review` (engineering review). Where the engineering review evaluates code quality, SDK usage, and service health, this review evaluates what the user sees and experiences.

The review workspace and folder structure are shared with `/dune-app-review`. If the engineering review has already run, the ticket folder, `overview.md`, and submodule will already exist — reuse them.

## Phase 1: Setup

### 1.1 Parse input and set up workspace

If the ticket folder already exists (from a prior engineering review), reuse it. Otherwise, follow the same setup:

- Extract **Ticket ID**, **PR link**, and **feedback round**
- Create the workspace folder if needed
- Fetch PR metadata with `gh pr view`
- Create `overview.md` if it doesn't exist
- Add or update the git submodule

For **local developer reviews** (no ticket ID), use `reviews/dune-design-review/feedback-round-<N>/` as the artifact directory. If no local feedback round exists yet, use `feedback-round-1`. For reruns, increment the round number.

### 1.2 Identify the app scope

From the PR's changed files, determine the **app root directory**. If multiple apps exist in the repo, only review the one affected by the PR.

## Phase 2: Load ALL review guidance BEFORE reviewing

**This phase must complete before any scoring begins.**

### 2.1 Read the design skill files

Read **every file** in the `design` skill. These contain the rules the heuristics test for.

| File | Informs which heuristics |
|------|--------------------------|
| `picking-components.md` | Q1 (Aura consistency), Q5 (clickability), Q8 (empty states) |
| `building-pages.md` | Q2 (navigation/layout/hierarchy), Q7 (responsive) |
| `writing-copy.md` | Q3 (labels/language) |
| `handling-states.md` | Q4 (feedback/validation), Q5 (clickability), Q6 (error prevention) |
| `storybook-links.md` | Reference for all component and foundation URLs |

### 2.2 Locate the user context

Find the app's **brief** or **user context document** — the description of who the primary user is and what tasks they perform. This is essential for Q2 (navigation makes sense for these tasks) and Q8 (empty states guide this user). Check:

- The certification brief (if the app is registered in the Dune Certification system)
- A `README.md` or `docs/` directory in the app repo
- PR description

If no user context exists, **flag this explicitly** — the review's Q2 and Q8 scores will be reduced confidence.

### 2.3 Locate the demo

Check for a **demo URL** (screen recording, deployed preview, or Loom) on the app version, PR description, or Jira ticket. The demo is critical for heuristics that cannot be fully assessed from code alone (Q2, Q6, Q9). If no demo exists, note which heuristics received a reduced-confidence score.

### 2.4 Create a review checklist

Before starting the review, create tasks for every phase and step. This ensures nothing is skipped.

## Phase 3: Automated code assessment

These heuristics can be largely assessed by reading the source code. Scan all `.tsx` files in the app.

### Q1: Aura design system consistency

Are Aura tokens, layouts, components, and patterns used correctly?

**Check for:**
- **Hardcoded colors**: hex values (`#`), `rgb()`, `hsl()`, or Tailwind default palette (`bg-gray-*`, `text-blue-*`) instead of Aura semantic tokens
- **Style overrides**: `style={{}}` on Aura components (except truly dynamic values like calculated widths)
- **Custom components**: components built from scratch when an Aura equivalent exists (cross-reference `picking-components.md`)
- **Spacing**: raw pixel values instead of Tailwind spacing scale
- **Layout patterns**: pages not using an approved pattern from `building-pages.md`
- **Typography**: custom font sizes/weights instead of Aura typography tokens

Produce a **token compliance summary**: total violations, files with most violations, categories of violations.

| Score | Criteria |
|-------|----------|
| 5 | All Aura tokens applied correctly, no hardcoded values, approved layouts, no style overrides. Exceptions only for genuine gaps in the system. |
| 4 | Mostly Aura tokens and components with 1-2 minor exceptions. Layout spacing mostly consistent. |
| 3 | Mix of Aura and custom elements. Some proper spacing, some random values. Overriding styles in places. |
| 2 | Frequently using custom colors, typography, or spacing. Heavy customization breaking patterns. |
| 1 | Not using Aura. Custom colors, fonts, spacing throughout. |

### Q3: Clear labels and language

Are buttons, inputs, and actions labeled clearly? Can users understand what everything does?

**Check for:**
- **Button labels**: check against approved action labels in `writing-copy.md` — flag "Submit", "OK", "Yes", "Confirm", "Click here", "Log in/out"
- **Vague labels**: buttons or links with text shorter than 2 words or longer than 6 words
- **Technical jargon**: CDF-internal terms exposed to users (e.g. "externalId", "space", "instances")
- **Capitalization**: title case where sentence case is required
- **Placeholder text**: inputs using placeholder as the only label (no `<Label>` component)
- **aria-label coverage**: icon-only buttons without `aria-label`

| Score | Criteria |
|-------|----------|
| 5 | Every element has a clear, specific label. Language is plain and action-oriented. |
| 4 | Most labels clear with only minor ambiguity. Mostly plain language. |
| 3 | Labels present but sometimes vague. Some jargon. |
| 2 | Many labels unclear or generic. Heavy technical terms. |
| 1 | Labels missing, confusing, or full of jargon. |

### Q4: System feedback and validation

Do users know what's happening? Are forms easy to use with helpful validation and error messages?

**Check for:**
- **Loading states**: every async operation (React Query hooks, mutations) has a corresponding loading indicator. Check `isLoading` usage — there must be a Skeleton, Loader, or button spinner.
- **Error states**: every `isError` or `.catch` renders an Aura Alert, not fails silently. Flag any `catch` blocks that swallow errors.
- **Form validation**: `onBlur` validation, `aria-invalid`, `aria-describedby`, required field indicators, specific error messages (not just "Required" or "Invalid")
- **Success feedback**: mutations trigger a toast or visible confirmation
- **Required field marking**: forms visually indicate required fields

| Score | Criteria |
|-------|----------|
| 5 | Immediate feedback for all actions. Clear loading/error/success states. Real-time validation with specific messages. |
| 4 | Most actions provide feedback. Minor timing or clarity issues. |
| 3 | Inconsistent feedback. Some loading states missing. Generic error messages. |
| 2 | Minimal feedback. Users often don't know if actions worked. Validation only on submit. |
| 1 | No feedback. Silent failures. No validation. |

### Q5: Clickability and interactions

Is it obvious what's clickable? Do interactive elements respond appropriately?

**Check for:**
- **Non-interactive tags with click handlers**: `<div onClick>` or `<span onClick>` without `role="button"` and keyboard handling
- **Hover states**: interactive elements use Aura component variants or `hover:` classes
- **Cursor styles**: custom interactive elements have `cursor-pointer`
- **Button variants**: correct variant usage (destructive for delete, default for primary actions) per `picking-components.md`
- **Disabled states**: disabled elements look disabled (`disabled` prop, `aria-disabled`)

| Score | Criteria |
|-------|----------|
| 5 | All clickable items look clickable. Hover effects present. Cursor changes appropriately. |
| 4 | Most interactive elements obvious. Hover effects mostly present. |
| 3 | Inconsistent hover states. Sometimes unclear what's interactive. |
| 2 | Many interactive elements don't look clickable. Few hover effects. |
| 1 | Can't tell what's clickable. No visual feedback on interaction. |

### Q7: Responsive design and multi-device support

Does the app work well on different screen sizes?

**Check for:**
- **Responsive classes**: presence of `sm:`, `md:`, `lg:`, `xl:` breakpoint prefixes in layouts
- **Approved layout patterns**: usage of responsive patterns from `building-pages.md` (each pattern specifies desktop/tablet/mobile behavior)
- **Fixed widths**: hardcoded pixel widths on content areas
- **Touch targets**: interactive elements smaller than 40px (`h-10 w-10`) in mobile contexts
- **Horizontal overflow**: layouts that would cause horizontal scrolling on narrow screens
- **Mobile-specific handling**: whether the app hides or adapts non-essential functionality for mobile. If the app is not intended for mobile/handheld use, it should be hidden or limited to prevent a poor experience.

| Score | Criteria |
|-------|----------|
| 5 | Seamless across desktop, tablet, mobile. Touch targets 40px+. No horizontal scrolling. |
| 4 | Works well on most devices. Minor layout issues on smaller screens. |
| 3 | Functional but not optimized. Some touch targets too small. |
| 2 | Poor mobile/tablet experience. Layouts break on smaller screens. |
| 1 | Only works on desktop. Completely broken on mobile. |

## Phase 4: Manual/demo assessment

These heuristics require walking the app's tasks end-to-end. If a demo URL is available, use it. If only code is available, assess from code structure and note **reduced confidence** on these scores.

### Q2: Navigation, layout and hierarchy

Can users tell where they are and navigate easily? Are elements organized with clear visual hierarchy?

**Assess:**
- **Wayfinding**: Is the user's current location always clear? (breadcrumbs, active nav states, page titles)
- **Navigation consistency**: Does the menu/nav structure stay consistent across pages?
- **Forward/back flow**: Can users navigate forward and back through tasks easily?
- **Visual hierarchy**: Do headings, spacing, and grouping guide attention? Does content flow logically (F/Z pattern)?
- **Grouping**: Are related items clearly grouped with clear separation between sections?

| Score | Criteria |
|-------|----------|
| 5 | Current location always clear. Easy navigation. Consistent structure. Strong visual hierarchy guides attention. |
| 4 | Usually clear. Mostly consistent. Good hierarchy with minor exceptions. |
| 3 | Sometimes unclear what page you're on. Navigation works but not always intuitive. |
| 2 | Often lost or confused. Navigation changes between pages. Poor hierarchy — everything looks equally important. |
| 1 | No indication of current location. No clear navigation. Inconsistent structure. No logical grouping. |

### Q6: Error prevention and recovery

Can users undo or cancel destructive actions? Are there warnings before important actions?

**Assess:**
- **Destructive action protection**: Do delete/remove/discard actions show confirmation dialogs? (check `handling-states.md` confirmation dialog pattern)
- **Data loss prevention**: Is there auto-save, or do forms warn before navigating away with unsaved changes?
- **Undo capability**: Can users undo recent actions? Are there cancel buttons on forms/modals?
- **Input constraints**: Do forms prevent invalid input where possible (min/max, type constraints)?

| Score | Criteria |
|-------|----------|
| 5 | Confirmation before destructive actions. Auto-save prevents data loss. Clear undo/cancel options. |
| 4 | Most destructive actions have warnings. Some auto-save or undo. |
| 3 | Some warnings for major actions. Limited undo/cancel. |
| 2 | Few warnings. No undo. Easy to accidentally lose work. |
| 1 | No warnings. No undo/cancel. Frequent accidental data loss. |

### Q8: Empty states and first-time experience

When there's no data, is it clear what to do next? Do empty pages guide users?

**Assess:**
- **Empty state coverage**: Does every data-displaying component have an empty state? (tables, lists, charts, dashboards — per `picking-components.md` rule: "every data-displaying component must handle empty state")
- **Guidance quality**: Do empty states explain what will appear and what to do next?
- **First-time flow**: Can a new user figure out where to start without external documentation?
- **CTAs in empty states**: Do empty states include a clear action button?

| Score | Criteria |
|-------|----------|
| 5 | All empty states show helpful messages and clear next steps. First-time users know exactly what to do. |
| 4 | Most empty states helpful. Generally clear what to do first. |
| 3 | Some empty states explained. First-time users can figure it out with effort. |
| 2 | Many blank pages with no guidance. Unclear how to get started. |
| 1 | Blank pages everywhere. No indication of what to do. |

### Q9: Performance and efficiency

Does the app load quickly? Can users complete tasks efficiently?

**Assess:**
- **Perceived speed**: Are skeleton screens or progress indicators shown during loads?
- **Task efficiency**: How many clicks/steps do common tasks require? Can they be reduced?
- **Bulk actions**: Can users act on multiple items at once where appropriate?
- **Keyboard shortcuts**: Are there shortcuts for frequently repeated actions?
- **Pre-filling**: Does the app pre-fill known values to reduce input effort?

| Score | Criteria |
|-------|----------|
| 5 | Fast loading with progressive display. Bulk actions. Keyboard shortcuts. Minimal clicks. |
| 4 | Reasonable loading. Most tasks streamlined. Some efficiency features. |
| 3 | Acceptable performance. Moderate effort. Few shortcuts. |
| 2 | Slow loading. Tasks require many steps. No shortcuts or bulk actions. |
| 1 | Very slow or unresponsive. Tasks tedious with excessive clicks. |

## Phase 5: Produce the report

Write `design-review-report.md` to the feedback round folder (e.g. `reviews/CDFNEW-3593/feedback-round-1/design-review-report.md`).

```markdown
# [App name] — Dune design review

This document is the design quality review for [App name], conducted as part of the Cognite Dune app approval process.

## What this review covers

This review evaluates the user experience against 9 design quality heuristics. It checks whether the app is easy to use, consistent with the Aura design system, accessible, and provides clear feedback throughout. It is the design counterpart to the engineering review.

Scores are 1-5. A score of **1-2** on any heuristic is a blocker. Score 3 is acceptable with tracked follow-up. Scores 4-5 are good.

## Path to approval

This review found **[N] must-fix item(s)** that block approval. [One sentence on should-fix count and overall state.] Once the must-fix items are addressed, request a re-review.

---

## App context

| Field | Value |
|-------|-------|
| **Primary user** | [from brief — or "Not provided"] |
| **Key tasks** | [from brief — or "Not provided"] |
| **Demo URL** | [link, or "Not provided — Q2, Q6, Q8, Q9 scores are reduced confidence"] |
| **Reviewed commit** | `[full SHA]` ([link to commit]) |

## Scores

| # | Heuristic | Score | Confidence | Notes |
|---|-----------|-------|------------|-------|
| 1 | Aura design system consistency | /5 | High | |
| 2 | Navigation, layout and hierarchy | /5 | [High/Reduced] | |
| 3 | Clear labels and language | /5 | High | |
| 4 | System feedback and validation | /5 | High | |
| 5 | Clickability and interactions | /5 | High | |
| 6 | Error prevention and recovery | /5 | [High/Reduced] | |
| 7 | Responsive design | /5 | High | |
| 8 | Empty states and first-time experience | /5 | [High/Reduced] | |
| 9 | Performance and efficiency | /5 | [High/Reduced] | |
| | **Average** | **X.X** | | |

### Quality level

| Average | Level | Recommendation |
|---------|-------|----------------|
| 4.5-5.0 | Excellent | Ready to launch |
| 3.8-4.4 | Good | Launch with minor fixes |
| 3.0-3.7 | Average | Needs improvement before launch |
| Below 3.0 | Needs significant work | Focus on lowest-scoring areas first |

## Token compliance summary

| Category | Violations | Files affected |
|----------|-----------|----------------|
| Hardcoded colors | | |
| Style overrides | | |
| Custom components (Aura equivalent exists) | | |
| Non-semantic spacing | | |
| Non-approved layouts | | |
| **Total** | | |

## Must fix before launch
- [ ] [description] — [file:line] — Q[N]
  _Impact: [user-visible consequence]_
- [ ] ...

## Should fix before launch
- [ ] [description] — [file:line] — Q[N]
- [ ] ...

## Nice to fix
- [ ] [description] — [file:line] — Q[N]
- [ ] ...
```

### Categorization guidance

- **Must fix** (score 1-2): Aura violations that break dark mode, missing loading/error states on primary flows, unlabeled form fields, destructive actions without confirmation, missing empty states on primary data views, navigation that prevents task completion, contrast failures on custom colors.
- **Should fix** (score 3): Inconsistent spacing, vague button labels, generic error messages, missing hover states, limited responsive adaptation, partial empty state coverage.
- **Nice to fix** (score 4): Minor token inconsistencies, copy refinements, additional keyboard shortcuts, mobile optimization for desktop-first apps, efficiency improvements.

For each must-fix item, include a one-sentence **_Impact:_** note explaining the user-visible consequence — not just what the technical flaw is, but why it matters.

## Phase 6: Verification (MANDATORY)

After writing the design review report, self-verify:

1. Re-read all 9 heuristic rubrics and confirm each score matches the evidence
2. Confirm every score of 1-2 has a corresponding must-fix item
3. Confirm every score of 3 has a corresponding should-fix item
4. Confirm every must-fix item has an `_Impact:_` note
5. Spot-check 3 findings by re-reading the cited file and line number
6. Confirm the must-fix count in "Path to approval" matches the actual list

If any check fails, fix the report before declaring the review complete.

## Operating principles

- **Review for the user, not the code.** Every finding should trace back to something a real user would experience. "Uses `bg-gray-500` instead of `bg-muted`" is a finding, but phrase it as "Background won't adapt to dark mode, breaking the experience for users who enable it."
- **Use the brief.** The user description and tasks are the lens for Q2 and Q8. Don't assess navigation in the abstract — assess whether *this user* can complete *these tasks*.
- **Be specific.** Cite file paths and line numbers. Show the incorrect code and what it should be.
- **Acknowledge gaps honestly.** If no demo URL was provided, mark affected scores as "Reduced" confidence and explain what couldn't be verified.
- **Load guidance first, review second.** Never start scoring before reading ALL design skill files.
- **Write for the developer.** The report is sent directly to the app author. Be specific and helpful, not a gatekeeping checklist.
