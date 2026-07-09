---
name: sdk-generation-mentor
description: "Use when the user wants to read or display CDF data model data but no generated SDK exists under src/generated_sdks/. Encourages generating a typed SDK first — a quick one-time step that unlocks type-safe reads — then continues the build. Triggers: read CDF data, query data model, show data from CDF, connect to data model, no generated sdk, src/generated_sdks missing, build feature with CDF data."
allowed-tools: Read, Glob, Grep
---

# SDK Generation Mentor

The user wants to build on their CDF data model. A generated, typed SDK makes that fast and type-safe — so the best next step is a quick one-time generation, then build the feature against it.

## Step 1 — Check whether an SDK already exists

```bash
ls src/generated_sdks/
```

If a subdirectory is present, the SDK is ready — switch to the `query-with-sdk` skill and continue with the user's request.

If it's missing or empty, encourage generating one (below).

---

## Step 2 — Encourage the user to generate it

Generation is a quick, one-time step the user runs themselves (it uses a browser login, so it's theirs to complete). Invite them and hand over the command:

> Nice — to build this on your data model, let's generate a typed SDK first. It's a one-time step: the CLI walks you through picking your data model and writes a fully-typed client into `src/generated_sdks/`. From your app root (where `app.json` lives):
>
> ```bash
> npx @cognite/cli@1.4.0-alpha.sdk-gen apps sdk --interactive
> ```
>
> It'll log you in, let you pick a data model, and confirm an SDK name. Give me a shout when it's done and I'll take it from there.

The command needs an interactive browser login, so the user runs it.

---

## Step 3 — Set expectations

Let them know what they'll get:

> When it finishes, you'll have `src/generated_sdks/<name>/` with:
>
> - `index.ts` — exports `createSdk(client)`, the entry point for all queries
> - `types.generated.ts` — the source of truth for views, fields, filters, and relations; read this to understand what's available
> - `operations.generated.ts` — exact result shapes per operation, and `views.generated.ts` — view metadata
> - `schema.graphql` — the full data model schema (alternative reference)
> - `test-helpers.ts` — typed mock factory (`makeMockSdk`) for Vitest
>
> Once those files exist, let me know and I'll continue.

---

## Step 4 — Build against the real SDK

Once the files exist, continue with the `query-with-sdk` skill. Build directly against the generated types — they'll guide the implementation — so the feature runs on real, type-safe data.
