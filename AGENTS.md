# Agent instructions — Flows Skills

## Certification flow

To certify a Flows app for external submission, run these four skills in order:

1. **`flows-app-brief`** — right after `npx @cognite/cli apps create`, before building. Writes `App-Brief.md`.
2. **`flows-code-review`** — after building. Writes `reviews/code-review/feedback-round-<N>/code-review-report.md`. Re-run until `Must Fix open: 0`.
3. **`flows-design-review`** — after code review passes. Writes `reviews/design-review/feedback-round-<N>/design-review-report.md`. Re-run until average ≥ 3.8.
4. **`flows-external-app-submit`** — verifies all three artifacts are committed and runs `npx @cognite/cli apps submit`.

Commit the generated files before running `flows-external-app-submit` — the CLI uses `git archive HEAD` and will not see uncommitted artifacts.
