# Flows Skills

Agent-agnostic AI skills for [Flows](https://cognite-dune-docs.mintlify.app/cdf/flows) apps. Works with Claude Code, Cursor, Copilot, and any agent that supports the [skills format](https://github.com/anthropics/skill-spec).

## Install

Pull all skills into your Flows app:

```bash
npx @cognite/dune skills pull
```

Pull a specific skill:

```bash
npx @cognite/dune skills pull --skill create-client-tool
```

## Available Skills

| Skill | Description |
|-------|-------------|
| **create-client-tool** | Scaffolds an `AtlasTool` and wires it into `useAtlasChat` |
| **integrate-atlas-chat** | Adds streaming Atlas Agent chat UI to a Flows app |
| **setup-python-tools** | Adds Pyodide-based Python tool execution |
| **code-quality** | Reviews Flows apps for code quality, maintainability, and clean code issues |
| **correctness-and-error-handling** | Reviews for bugs, missing error states, unhandled rejections, and edge cases |
| **dm-limits-and-best-practices** | CDF Data Modeling API best practices — concurrency, pagination, batching |
| **flows-app-review** | Runs the official Flows app platform review flow against a local app workspace and writes artifacts under `reviews/flows-app-review/feedback-round-N/` |
| **integrate-file-viewer** | Integrates CogniteFileViewer to preview CDF files (PDFs, images, text) |
| **performance** | Optimizes Flows apps for speed, render counts, and bundle size |
| **pull-changes-resolve-conflicts** | Merge or rebase workflow — list conflicts, analyze ours/theirs, get user approval before resolving |
| **security** | Reviews for security issues — credentials, user input, external data |
| **setup-flows-auth** | Migrates React apps to Flows auth or adds DuneAuthProvider |
| **design** | Aura UI — components and tokens, layouts, UX copy, forms/async feedback, accessibility (`skills/design/`) |

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

Or push via the CLI:

```bash
npx @cognite/dune skills push path/to/SKILL.md
```
