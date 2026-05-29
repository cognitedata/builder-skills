---
name: flows-app-brief
description: >-
  Step 1 of the Flows certification flow. Coaches the app brief and writes
  App-Brief.md with all fields that apps submit requires. Run right after
  npx @cognite/cli apps create, before building.
allowed-tools: Read, Glob, Grep, Bash, Write
---

# Flows App Brief

```
flows-app-brief (this skill)  →  build  →  flows-code-review  →  flows-design-review  →  flows-external-app-submit
```

**Inputs → output:** `app.json`, `package.json`, and `specs/*/spec.md` are read-only sources used to propose draft values. `App-Brief.md` is the output — the user confirms or overrides every field before it is written.

Before asking anything, read those sources and propose drafts for as many fields as possible. Then collect the remaining fields through conversation. Required fields must be non-empty; optional fields may be left blank.

**Required:** `appName`, `customer`, `tier` (Tier 1/2/3), `owner`, `userRole`, `currentProblem`, `oneSentenceStory`, `successCriteria`, `userEvidence`

**Optional:** `userCount`, `businessValue`, `milestones`, `repoUrl`

## Coach the human-centered fields (one at a time)

These five are required and must be *specific*. Challenge vague answers before saving; never invent answers. Save each the moment it's specific and restate what you stored.

- **userRole** — a real person: role + daily work + environment + device.
  Reject a bare job category. "'Operators' is a category, not a person — who actually uses this, where, on what device?"
  Good: "Shift supervisor offshore, control room, desktop w/ two monitors, runs the 12-hr crew handover."

- **currentProblem** — a concrete thing they can't do today + what they do instead + what it costs.
  Reject improvement language ("improve visibility", "more efficient"). "That's the fix, not the problem — what specifically can't they do today, and what does the workaround cost?"
  Good: "Checks three systems to build a handover picture — 45 min and still misses things."

- **oneSentenceStory** — "As a [persona], I want to [action] so that I can [value]."
  Reject if the value half is vague. "What does the user actually gain? Finish: 'so that I can …'"

- **successCriteria** — a measurable before/after: time saved, error rate, decision speed.
  Reject "works better" — ask for a number. Good: "Handover check under 10 min instead of 45."

- **userEvidence** — real user contact OR an explicit assumption.
  An honest "assumption based on X" passes; total silence doesn't. "Have you talked to a real user, or is this an assumption? An assumption is fine — just say so."

**Re-run mode.** If `App-Brief.md` already exists, parse its YAML frontmatter, show the current values, and only re-coach the fields the user wants to change — don't start from scratch.

**Empty-field guard.** Optional fields may be `""`, but every required field must be non-empty before writing. If one is still blank, return to coaching it instead of writing the file.

Write `App-Brief.md` at the repo root:

```markdown
---
appName: ""
externalId: ""
infra: ""
customer: ""
tier: ""
owner: ""
userCount: ""
businessValue: ""
milestones: ""
repoUrl: ""
userRole: ""
currentProblem: ""
oneSentenceStory: ""
successCriteria: ""
userEvidence: ""
---

# App Brief — <appName>
...
```

Tell the user: *"App-Brief.md saved. Build the app, then run `flows-code-review`."*
