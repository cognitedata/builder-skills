---
name: migrate-app-to-flows
description: "MUST be used when migrating a legacy Dune app to the new Flows app hosting infrastructure. Orchestrates the full migration: audits current state, updates app.json to appsApi infra, sets up Flows auth via setup-flows-auth, creates or updates manifest.json network permissions, and updates deploy scripts to @cognite/cli. Use this whenever a user says 'migrate to Flows', 'migrate to new infra', 'move from dune to flows', 'migrate legacy app', 'how do I migrate', or wants to move their existing app to the new Flows app hosting. Always run this skill before setup-flows-auth when the context is a full migration."
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
metadata:
  argument-hint: ""
---

# Migrate App to Flows Infrastructure

Orchestrates the full migration of a legacy Dune app to the new Flows app hosting (`appsApi`). Works through each area in order, skipping any that are already in the correct state.

## Step 1 — Audit current state

Read these files to understand what needs changing:

- `app.json` — check for `infra` field
- `package.json` — check dependencies and scripts
- `src/main.tsx` (or `src/index.tsx`) — check for `DuneAuthProvider`
- `manifest.json` — check if it exists and what permissions it declares
- `vite.config.ts` — check which plugins are used

Report a concise summary to the user:

```
Migration audit:
✗ app.json: missing infra field → will add "infra": "appsApi"
✗ Auth: DuneAuthProvider in use → needs migration to connectToHostApp
✗ manifest.json: missing → will create
✓ Deploy script: already uses @cognite/cli
```

Then proceed through Steps 2–5 in order.

---

## Step 2 — Update `app.json`

Set `"infra": "appsApi"` if it is missing or set to anything else:

```json
{
  "name": "My App",
  "externalId": "my-app",
  "versionTag": "0.0.1",
  "infra": "appsApi",
  "deployments": [...]
}
```

If `deployments` is empty or missing `deployClientId`/`deploySecretName`, flag this to the user — these are needed before the first deploy and require a service account in CDF.

---

## Step 3 — Set up Flows auth

Follow the `setup-flows-auth` skill to handle auth, dependencies, and Vite config. That skill covers:

- Installing `@cognite/app-sdk`
- Removing `DuneAuthProvider` from the entry file
- Migrating `useDune()` to `connectToHostApp` in `App.tsx`
- Updating vite plugins from `@cognite/dune/vite` → `@cognite/app-sdk/vite` (including `manifestCspPlugin`)
- Replacing all `useDune()` call sites across the codebase
- Removing `@cognite/dune` once no longer needed

If you already have the `setup-flows-auth` skill loaded, execute those steps now. Otherwise, tell the user to point you at `skills/setup-flows-auth/SKILL.md` and continue from there.

---

## Step 4 — Create or update `manifest.json`

The Flows host uses `manifest.json` to enforce a Content Security Policy (CSP) for the app. It must exist at the repo root.

### 4a — Create if missing

```json
{
  "manifestVersion": 1,
  "permissions": {
    "network": []
  }
}
```

### 4b — Populate network permissions

Scan the codebase for outbound network calls to domains other than the CDF cluster (the CDF cluster is allowed automatically):

```bash
grep -rn "fetch\|axios\|new XMLHttpRequest" src/ --include="*.ts" --include="*.tsx"
```

For each external hostname found (e.g. `api.example.com`, `fonts.googleapis.com`), add it to the `network` array:

```json
{
  "manifestVersion": 1,
  "permissions": {
    "network": ["api.example.com", "fonts.googleapis.com"]
  }
}
```

Rules:
- List only the **hostname** (no protocol, no path).
- The CDF base URL the app talks to is injected by the host — do not add it here.
- If the app makes no external calls, leave `"network": []`.
- If there are dynamic URLs whose hostname you cannot determine statically, flag them to the user.

---

## Step 5 — Update deploy scripts in `package.json`

Replace any `dune deploy` or `npx @cognite/dune` deploy commands with `@cognite/cli`:

```json
{
  "scripts": {
    "deploy": "npx @cognite/cli@latest apps deploy --interactive --published",
    "deploy-preview": "npx @cognite/cli@latest apps deploy --interactive"
  }
}
```

Keep `start`, `build`, `test`, and other non-deploy scripts unchanged.

---

## Step 6 — Final check

After all steps complete, run a quick sanity check:

```bash
grep -rn "DuneAuthProvider\|useDune\|@cognite/dune" src/ vite.config.ts 2>/dev/null
```

If any hits remain, list them for the user to resolve manually (some may be intentional if `@cognite/dune` is used for features beyond auth).

Report the outcome:

```
Migration complete:
✓ app.json: infra set to "appsApi"
✓ Auth: connectToHostApp wired up
✓ manifest.json: created with network permissions []
✓ Deploy scripts: updated to @cognite/cli
✓ No remaining @cognite/dune references in source
```
