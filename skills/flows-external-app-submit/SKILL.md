---
name: flows-external-app-submit
description: >-
  Step 4 (final) of the Flows certification flow. Verifies App-Brief.md, code
  review (Must Fix open: 0), and design review (average >= 3.8) are all
  committed, then runs npx @cognite/cli apps submit.
allowed-tools: Read, Glob, Grep, Bash, AskQuestion
---

# Flows External App Submit

```
flows-app-brief  →  build  →  flows-code-review  →  flows-design-review  →  flows-external-app-submit (this skill)
```

Run the verification script:

```bash
bash .agents/skills/flows-external-app-submit/scripts/verify.sh
```

Any `FAIL` line → stop. Tell the user which skill to re-run. `WARN` lines are non-blocking.

Also verify the two report files contain passing machine-readable markers:
- `code-review-report.md`: `^- Must Fix open: 0$`
- `design-review-report.md`: `^- Average score: (\d+\.\d+)$` with value ≥ 3.8
- `App-Brief.md`: all nine required frontmatter fields non-empty

All checks pass → confirm with the user, then:

```bash
npx @cognite/cli@latest apps submit
```

