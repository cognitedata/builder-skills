---
name: flows-design-review
description: >-
  Step 3 of the Flows certification flow. Scores 10 design quality questions
  and writes reviews/design-review/feedback-round-<N>/design-review-report.md.
  Re-run until average score >= 3.8 before moving on to flows-external-app-submit.
allowed-tools: Read, Glob, Grep, Shell, Write, AskQuestion
---

# Flows Design Review

```
flows-app-brief  →  build  →  flows-code-review  →  flows-design-review (repeat until ≥ 3.8)  →  flows-external-app-submit
```

Run all probes:

```bash
bash .agents/skills/flows-design-review/scripts/probes.sh 2>&1
```

Ask the user to walk each critical task in the running app and report back before scoring.

Score each question 1–5 using probe results and walkthrough findings:

| # | Question |
|---|---|
| Q1 | Aura design system consistency |
| Q2 | Navigation, layout and hierarchy |
| Q3 | Clear labels and language |
| Q4 | System feedback and validation |
| Q5 | Clickability and interactions |
| Q6 | Error prevention and recovery |
| Q7 | Responsive design |
| Q8 | Empty states and first-time experience |
| Q9 | Performance and efficiency |
| Q10 | Accessibility (WCAG AA) |

Determine the next round number from `reviews/design-review/` (`feedback-round-1/` if none exist).

Write `reviews/design-review/feedback-round-<N>/design-review-report.md`. The Summary block **must** use this exact format:

```markdown
## Summary

- Average score: <X.X>
- Quality level: <Excellent | Good | Average | Needs significant work>
```

Print the average and whether it meets the ≥ 3.8 gate. Re-run this skill if below 3.8.
