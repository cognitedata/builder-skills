# Flows Skills

Agent-agnostic AI skills for [Flows](https://cognite-dune-docs.mintlify.app/cdf/flows) apps. Works with Claude Code, Cursor, Copilot, and any agent that supports the [skills format](https://agentskills.io/specification).

## Install

Pull all skills into your Flows app:

```bash
npx @cognite/cli@latest apps skills pull
```

Pull a specific skill:

```bash
npx @cognite/cli@latest apps skills pull --skill create-client-tool
```

## Certification flow

Four skills drive the Flows app certification flow end to end. Run them in order:

1. **flows-app-brief** — Right after `npx @cognite/cli apps create`. Coaches you through the App Brief and writes `App-Brief.md`.
2. **flows-code-review** — Technical review. Writes `reviews/code-review/feedback-round-<N>/`. Re-run until 0 Must Fix.
3. **flows-design-review** — Manual design quality assessment (10 questions). Writes `reviews/design-review/feedback-round-<N>/`. Target average ≥ 3.8.
4. **flows-external-app-submit** — Verifies the prior three artifacts and runs `npx @cognite/cli apps submit`.

## Available Skills

| Skill | Description |
|-------|-------------|
| **flows-app-brief** | Certification coach (step 1) — captures app details, persona, problem, and success criteria, writes `App-Brief.md` |
| **flows-code-review** | Technical review (step 3) — writes `reviews/code-review/feedback-round-<N>/{code-review-report.md, review-files.md, review-packages.md}` |
| **flows-design-review** | Manual design quality assessment (step 4) — scores the 10 quality-guidelines questions, writes `reviews/design-review/feedback-round-<N>/design-review-report.md` |
| **flows-external-app-submit** | Submission gate (step 5) — verifies brief + code review (0 Must Fix) + design review (avg ≥ 3.8), then runs `npx @cognite/cli apps submit` |
| **create-client-tool** | Scaffolds an `AtlasTool` and wires it into `useAtlasChat` |
| **integrate-atlas-chat** | Adds streaming Atlas Agent chat UI to a Flows app |
| **setup-python-tools** | Adds Pyodide-based Python tool execution |
| **code-quality** | Reviews Flows apps for code quality, maintainability, and clean code issues |
| **correctness-and-error-handling** | Reviews for bugs, missing error states, unhandled rejections, and edge cases |
| **dm-limits-and-best-practices** | CDF Data Modeling API best practices — concurrency, pagination, batching |
| **integrate-file-viewer** | Integrates CogniteFileViewer to preview CDF files (PDFs, images, text) |
| **performance** | Optimizes Flows apps for speed, render counts, and bundle size |
| **pull-changes-resolve-conflicts** | Merge or rebase workflow — list conflicts, analyze ours/theirs, get user approval before resolving |
| **security** | Reviews for security issues — credentials, user input, external data |
| **setup-flows-auth** | Migrates React apps to Flows auth or adds DuneAuthProvider |
| **design** | Aura UI — components and tokens, layouts, navigation/Topbar, UX copy, forms/async feedback, accessibility (`skills/design/`) |

## Contributing

Add a new skill by creating a `skills/<name>/SKILL.md` file with proper frontmatter:

```yaml
---
name: my-skill
description: "When to use this skill..."
allowed-tools: Read, Glob, Grep, Edit, Write
---
```

Consolidated Aura guidance uses the **`design`** skill (`skills/design/SKILL.md`). Older per-topic `design-*` skills were merged into that folder.

**Authoring style**: Use `## Section` markdown headings for structural sections like Role, When to use, and Setup. XML tags (e.g., `<rubric>`, `<example>`) are acceptable where they serve a machine-parsing purpose.