---
name: flows-app-brief
description: >-
  Step 1 of the Flows certification flow. Coaches the app brief and writes
  App-Brief.md with all fields that apps submit requires. Run right after
  npx @cognite/cli apps create, before building.
allowed-tools: Read, Glob, Grep, Shell, Write, AskQuestion
---

# Flows App Brief

```
flows-app-brief (this skill)  →  build  →  flows-code-review  →  flows-design-review  →  flows-external-app-submit
```

Before asking anything, read `app.json`, `package.json`, `specs/*/spec.md` (if present), and any existing `App-Brief.md` to seed draft values. Present what you found, then collect the following fields through conversation. Required fields must be non-empty; optional fields may be left blank.

**Required:** `appName`, `customer`, `tier` (Tier 1/2/3), `owner`, `userRole`, `currentProblem`, `oneSentenceStory`, `successCriteria`, `userEvidence`

**Optional:** `userCount`, `businessValue`, `milestones`, `repoUrl`

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
