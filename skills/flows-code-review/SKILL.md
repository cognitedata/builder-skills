---
name: flows-code-review
description: >-
  Step 2 of the Flows certification flow. Runs a technical review of the app
  and writes reviews/code-review/feedback-round-<N>/code-review-report.md.
  Re-run until Must Fix open: 0 before moving on to flows-design-review.
allowed-tools: Read, Glob, Grep, Bash, Write
---

# Flows Code Review

```
flows-app-brief  →  build  →  flows-code-review (repeat until clean)  →  flows-design-review  →  flows-external-app-submit
```

Run all probes:

```bash
bash .agents/skills/flows-code-review/scripts/probes.sh 2>&1
```

Review the output. Identify Must Fix / Should Fix / Nice to Fix items across: bugs, CDF SDK usage, dependencies, test coverage, code quality, DMS patterns, performance, and accessibility.

Determine the next round number from `reviews/code-review/` (`feedback-round-1/` if none exist).

Write `reviews/code-review/feedback-round-<N>/code-review-report.md`. The Summary block at the end **must** use this exact format:

```markdown
## Summary

- Must Fix open: <integer>
- Should Fix open: <integer>
- Nice Fix open: <integer>
```

Also write `review-files.md` (one line per source file) and `review-packages.md` (one line per production dependency).

Print the three counts to the terminal. Re-run this skill until `Must Fix open: 0`.
