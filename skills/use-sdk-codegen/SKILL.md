---
name: use-sdk-codegen
description: "Use when setting up a type-safe TypeScript SDK from a CDF data model, or regenerating types after a data model change. Triggers: sdk codegen, cognite sdk, data model sdk, generate sdk, DMS sdk, typed CDF queries, apps sdk, cognite apps sdk, add sdk, connect data model"
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
metadata:
  argument-hint: "[sdk-name or data-model-external-id]"
---

# Use SDK Codegen

Generate a fully-typed TypeScript SDK from a CDF data model and wire it into your Flows app.

## Background

The `cognite apps sdk` CLI fetches your data model's DMS view definitions, builds a GraphQL schema from them, and generates type-safe operation files into `src/generated_sdks/<name>/`. No external GraphQL server is involved — execution runs in-process via graphql-js backed by DMS at runtime.

---

## Step 1 — Run the wizard

From the app root (where `app.json` lives):

```bash
npx @cognite/cli apps sdk --interactive
```

The wizard will:
1. Authenticate via browser PKCE login
2. Fetch all data models from your CDF project
3. Prompt you to pick one (space / externalId / version)
4. Confirm the SDK name (defaults to camelCase → kebab-case of the model externalId)
5. Write the entry to `app.json` under `generatedSdks[]`
6. Save config to `.dune/sdk-configs/<name>.json`
7. Immediately run codegen and write files to `src/generated_sdks/<name>/`

### Authentication alternatives

| Method | When to use |
|--------|-------------|
| `--interactive` | Browser PKCE — use during local dev |
| `COGNITE_TOKEN=<token>` in `.env` | CI or scripted flows |
| `deployClientId` / `deploySecretName` in `app.json` | Deployment client credentials |

---

## Step 2 — Inspect the generated files

After the wizard completes, `src/generated_sdks/<name>/` contains:

| File | Purpose |
|------|---------|
| `schema.graphql` | GraphQL SDL built from DMS views |
| `types.generated.ts` | Shared base types (scalars, enums, filter/sort inputs) |
| `<ViewName>.generated.ts` | Per-view operation files with typed query/filter/sort types |
| `views.generated.ts` | `ViewDefinition[]` array consumed by the runtime |
| `sdk-metadata.json` | Space, model externalId, version |
| `index.ts` | Barrel export: `createSdk(client)` + `Sdk` type |
| `test-helpers.ts` | `makeMockSdk()` factory for Vitest |

The codegen also ensures `graphql`, `graphql-tag`, and `@cognite/cli` are present in `package.json`.

---

## Step 3 — Regenerate after model changes

When the CDF data model changes, regenerate without re-running the full wizard:

```bash
# Regenerate all SDKs in app.json
npx @cognite/cli apps sdk generate

# Regenerate a specific SDK by name
npx @cognite/cli apps sdk generate <name>
```

This re-fetches the DMS views and overwrites all `*.generated.ts` files and `schema.graphql`. The `index.ts` and `test-helpers.ts` are also regenerated.

---

## Done

The generated SDK is ready to use. See the **`query-with-sdk`** skill for how to call `createSdk()` and query your data model at runtime.
