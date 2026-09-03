---
name: aura-review
description: >-
  Fully automated, engineering-based audit of how well a generated app uses
  Aura components — no human interaction required, so it is safe to run
  unattended in CI. Scans the app's own source with a bundled TypeScript AST
  script to compute an Aura coverage percentage and flag raw Tailwind
  color/spacing/arbitrary-value overrides on Aura components ("escape
  hatches"), then uses DESIGN.md and the public Aura docs sites to judge
  whether custom, first-party components could have been Aura components
  instead — only when a specific documented "Use when" rule supports it.
  Writes aura-review/report.md and aura-review/stats.json. Use when asked to
  run an Aura audit, check Aura compliance, or score how compliant an app is
  with the Aura design system.
allowed-tools: Read, Glob, Grep, Bash, Write, WebFetch
---

# Aura Review

An objective, code-level audit of Aura usage in a generated app: **did the
app use Aura where Aura applies, and did it use the Aura components it did
reach for correctly?**

This skill never asks the user anything. It is designed to run unattended —
inside a CI job on a nightly schedule, or by hand — and to always finish with
a report and a machine-readable stats file.

## The one rule that matters more than any step below

**Only flag something as wrong if it is already written down** in either
`DESIGN.md` or the public Aura docs. If you notice something that feels wrong
but isn't documented anywhere, do not invent a rule to justify flagging it,
that isn't a fair test of an app built against documentation that never
mentioned the rule. Instead, note it as a suggestion for the docs and move
on. This matters because these reports get used to tell people "Aura says
you did X wrong" — that claim has to be traceable to something they could
have read.

Likewise, when judging whether a custom component "could have been Aura",
only say so when you can point at a specific `Use when` bullet for a named
Aura component that matches — otherwise mark it undecided rather than guess.

## Sources of truth (v1, Storybook is deliberately out of scope for now)

| Source                          | Location                                                  | Use it for                                                                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DESIGN.md`                     | `<app-dir>/node_modules/@cognite/aura/DESIGN.md`          | Tokens, per-component "Use when" / "Use something else when" / "Dos and don'ts" / "Behavior", layout patterns                                                                              |
| Aura docs site                  | https://docs.cognite.com/aura-design-system               | Foundations (tokens, accessibility, design heuristics) and per-component Primitives pages for anything DESIGN.md doesn't cover — DESIGN.md's own "Docs reference" links here per component |
| Flows community components site | https://cognitedata.github.io/flows-community-components/ | Aura's public shadcn-style component registry and docs site — use for components or usage guidance not shipped in `DESIGN.md`                                                              |

Both docs URLs above are trusted, so fetch them with `WebFetch` directly rather
than `curl` (curl requests to them get denied).

Do not reach for Storybook yet. It's excluded from this skill until we have
a reliable index of story code (index.json / per-story JSON work).

## Step 0 — locate the app and confirm prerequisites

Resolve `<app-dir>` from `$ARGUMENTS`, or default to the current directory.
Print the resolved absolute `<app-dir>` path before doing anything else — if
`$ARGUMENTS` was empty and this silently defaulted to the current directory,
that's the only signal a user gets that they may be auditing the wrong app.

Confirm `<app-dir>/node_modules/@cognite/aura/package.json` and
`<app-dir>/node_modules/@cognite/aura/DESIGN.md` both exist — if not, stop and
report that `npm`/`pnpm install` needs to run first (this skill never installs
dependencies itself).

## Step 1 — run the objective scan (script, not you)

This is the part that must be deterministic, so it's a script, not something
you eyeball. The script `require`s `typescript`, which lives in `<app-dir>`'s
own `node_modules` (any Vite/TS scaffold has it as a devDependency) rather
than next to this skill — set `NODE_PATH` so Node's resolver finds it there
instead of copying the script into the app:

```bash
NODE_PATH="<app-dir>/node_modules" tsx <this-skill-dir>/scripts/scan-aura-usage.ts <app-dir> --out aura-review/scan.json
```

If `tsx` isn't on `PATH`, fall back to `npx --yes tsx ...` (prefer the direct
binary when available — `npx` has been observed to resolve a stale cached
path to `tsx`'s own CLI entrypoint in some environments).

Read the resulting `aura-review/scan.json`. It contains:

- `availableAuraComponents` — Aura's full component catalog (Pascal case,
  e.g. `Card`, `Accordion`, ...), from the installed `@cognite/aura` version.
  Not used in this run's coverage math — kept so a future aggregate step
  (across many scans) can compute catalog utilization, i.e. which Aura
  components barely get used anywhere. See the `auraCoveragePct` note below
  for why that's a different question than this run's coverage number.
- `auraUsages` / `nonAuraUsages` — **distinct component types**, one entry
  per identifier, each with `usageCount` and every occurrence's `locations`.
  `auraUsages` only counts **root-level** Aura tags (e.g. `Card`, `Button`) —
  compound/slot sub-components (`CardContent`, `CardHeader`,
  `AlertDescription`, ...) are folded into their parent's usage, not counted
  as separate component types, because a `Card` composed of five slots is
  one usage of Card, not five usages of the design system. `nonAuraUsages`
  entries are tagged with `importSource` (`relative`, `external`, or
  `unresolved-local` for components defined in the same file) — this covers
  both first-party components the app built and third-party ones it chose
  instead (icons, `react-router-dom`, providers, etc.).
- `excludedUsages` — framework/router noise (`Route`, `Link`, `Fragment`,
  ...) and namespaced tags (`React.StrictMode`, property access on a
  namespace import, not a component the app authored). Excluded from every
  list and count above, kept here purely for transparency — nothing is
  silently dropped.
- `totals.auraCoveragePct` — `auraUsages.length ÷ (auraUsages.length + nonAuraUsages.length)`
  (the **distinct**-count lists, not the `all*` occurrence lists): of the
  different *kinds* of components this app reached for, what fraction were
  Aura. Deliberately not occurrence-based — a component reused many times
  would otherwise dominate the ratio and overstate coverage relative to how
  many different kinds of components the app actually used. Also
  deliberately not divided by `availableAuraComponents.length` — that would
  conflate "how many components did this app need" with "did it use Aura
  where it mattered" (a small app needing only 3 components would cap out
  far below 100% even with perfect compliance). `totals.allAuraUsages` /
  `totals.allNonAuraUsages` report raw occurrence counts alongside this, as
  context, but are not what coverage is based on.
- `escapeHatches` — every Aura component usage, including sub-components,
  whose `className` raw Tailwind values look like spacing, color, or
  arbitrary-value overrides. This is a purely mechanical regex check; it is
  not yet a verdict — some of these will turn out to be legitimate per
  Step 4.

## Step 2 — report the coverage number as-is

`auraCoveragePct` from Step 1 goes straight into the report and
`stats.json`, with the caveat above about what it does and doesn't count.
Do not adjust it — it's meant to be a stable, comparable number across runs
so KCIH-1222/1223 can track it over time. Judgment happens in the two steps
below, as separate numbers.

## Step 3 — judge non-compliance (this is where you read DESIGN.md)

For each entry in `nonAuraUsages` whose `importSource` is `relative` or
`unresolved-local` (i.e. first-party — skip `external` entries, they're a
deliberate choice unrelated to Aura, not a compliance signal):

1. Open its first usage location and skim enough surrounding JSX to
   understand what the component actually renders/does.
2. Search `DESIGN.md`'s "Primitive guidance" component entries (grep for
   plausible component names, or read the whole section if it's short
   enough) for one whose "Use when" bullets match this component's apparent
   purpose.
3. If you find a specific match, record `{ identifier, couldHaveBeenAura: "<ComponentName>", evidence: "<quoted Use when bullet>" }`.
4. If `DESIGN.md` doesn't cover it, `WebFetch` the matching Primitives page on
   https://docs.cognite.com/aura-design-system (per DESIGN.md's own "Docs
   reference" URL pattern) or check
   https://cognitedata.github.io/flows-community-components/ the same way
   before giving up.
5. If none of those sources support a specific match, record
   `{ identifier, couldHaveBeenAura: null }` — do not guess.

`couldHaveBeenAuraPct` = (# entries with a non-null `couldHaveBeenAura`) ÷
(total entries considered, i.e. `couldHaveBeenAuraConsideredCount`). Report
the count either side of that ratio, not just the percentage — a percentage
over 2 components reads very differently than over 20.

Also report `couldHaveBeenAuraOfNonAuraPct` = (# entries with a non-null
`couldHaveBeenAura`) ÷ `nonAuraUsages.length` (the full distinct non-Aura
population from the scan, including `external` entries this step
deliberately skipped). This is a secondary, broader-context number — it's
expected to read lower than `couldHaveBeenAuraPct` whenever the app has
legitimate third-party usage, since that usage counts in this denominator
but was never a compliance candidate. Don't use it in place of
`couldHaveBeenAuraPct`; the considered-only ratio above is still the fair
compliance signal.

## Step 4 — judge documented usage-quality findings

For each entry in `escapeHatches`, and separately for any Aura
component used unusually heavily (e.g. hand-composing many raw sub-elements
around it), check `DESIGN.md`'s entry for that component's slug — and, if it
doesn't cover the point, the matching page on
https://docs.cognite.com/aura-design-system — for a specific "Dos and don'ts"
or "Behavior" line the usage contradicts.

- If you find one, record the finding with the exact quoted rule it
  violates.
- If you don't, drop the escape-hatch finding from the final report — a raw
  Tailwind override that the docs don't actually forbid for that component
  isn't a usage-quality problem, it's just a mechanical hit that didn't hold
  up.

This step is deliberately the most expensive per-finding — it's also the one
guarding against the exact failure mode called out in review: don't grade
an app against knowledge the model has but the docs don't.

## Step 5 — write the outputs

Write `aura-review/report.md`:

```markdown
# Aura Review — <app-dir>

## Headline numbers

- Aura coverage: <auraCoveragePct>% (<auraUsages> / <totalUsages> distinct component types; <allAuraUsages> / <allAuraUsages + allNonAuraUsages> raw occurrences)
- Could have been Aura: <couldHaveBeenAuraPct>% (<n> / <total> custom components had a documented Aura equivalent; <couldHaveBeenAuraOfNonAuraPct>% of all non-Aura usages)
- Documented usage-quality findings: <count>

## Non-compliance findings

| Component | Usages | Could have been | Evidence |
| --------- | ------ | --------------- | -------- |
| ...       | ...    | ...             | ...      |

## Usage-quality findings

| Aura component | File:Line | Violates | Quoted rule |
| -------------- | --------- | -------- | ----------- |
| ...            | ...       | ...      | ...         |

## Excluded from judgment (third-party, not a design-system concern)

- <identifier> (<count> usages, from `<package>`)
```

Write `aura-review/stats.json` — this is what a future upload-to-CDF step
consumes, so keep the field names stable:

```json
{
  "auraCoveragePct": 0.62,
  "auraUsages": 8,
  "nonAuraUsages": 5,
  "allAuraUsages": 18,
  "allNonAuraUsages": 11,
  "couldHaveBeenAuraPct": 0.25,
  "couldHaveBeenAuraCount": 2,
  "couldHaveBeenAuraConsideredCount": 8,
  "couldHaveBeenAuraOfNonAuraPct": 0.4,
  "usageQualityFindingsCount": 3
}
```

## Step 6 — print a one-line summary

Print to stdout, so a CI log shows the result without opening any file:

```
aura-review: coverage=<auraCoveragePct>% could-have-been-aura=<couldHaveBeenAuraPct>% (<n>/<total>) usage-quality-findings=<count>
```
