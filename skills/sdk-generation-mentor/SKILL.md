---
name: sdk-generation-mentor
description: "Use when the user wants to read or display CDF data model data but no generated SDK exists under src/generated_sdks/. Pauses implementation and instructs the user to generate the SDK manually before continuing. Triggers: read CDF data, query data model, show data from CDF, connect to data model, no generated sdk, src/generated_sdks missing, build feature with CDF data."
allowed-tools: Read, Glob, Grep
---

# SDK Generation Mentor

The user wants to work with CDF data model data, but no generated SDK exists yet. Do not proceed with implementation — stop and instruct the user to generate the SDK first.

## Step 1 — Confirm no SDK exists

```bash
ls src/generated_sdks/
```

If the directory exists and contains at least one subdirectory, an SDK is already present — use the `query-with-sdk` skill instead and continue with the user's request.

If the directory is missing or empty, continue below.

---

## Step 2 — Stop and tell the user

Explain clearly why you're pausing and what they need to do:

> Before I can build this feature, you'll need to generate a typed SDK from your CDF data model. This is a one-time setup step that you run yourself — the CLI will walk you through picking your data model and write the generated files into `src/generated_sdks/`.
>
> Run this from your app root (where `app.json` lives):
>
> ```bash
> npx @cognite/cli apps sdk --interactive
> ```
>
> The wizard will ask you to log in, pick a data model, and confirm an SDK name. Once it completes, come back and I'll pick up from here.

Do not run this command yourself. Authentication requires a browser login that only the user can complete.

---

## Step 3 — Set expectations

Follow up with what the user will see when it's done:

> After the wizard completes, you'll have a new folder at `src/generated_sdks/<name>/` containing:
>
> - `schema.graphql` — the full data model schema; read this to understand what views and fields are available
> - `index.ts` — exports `createSdk(client)`, the entry point for all queries
> - Per-view type and operation files
> - `test-helpers.ts` — typed mock factory for Vitest
>
> Once those files exist, let me know and I'll continue.

---

## Step 4 — Wait

Do not generate placeholder code, stub SDK calls, or add `// TODO: add SDK` comments. Wait for the user to confirm the SDK has been generated, then resume using the `query-with-sdk` skill.
