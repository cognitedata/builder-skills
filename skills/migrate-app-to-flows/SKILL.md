---
name: migrate-app-to-flows
description: "MUST be used when migrating a legacy Dune app to the new Flows app hosting infrastructure. Orchestrates the full migration: audits current state, updates app.json to appsApi infra, delegates auth wiring to setup-flows-auth, creates or updates manifest.json network permissions, and updates deploy scripts to @cognite/cli. Use this whenever a user says 'migrate to Flows', 'migrate to new infra', 'move from dune to flows', 'migrate legacy app', or wants to move their existing app to the new Flows app hosting."
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
metadata:
  argument-hint: ""
---

# Migrate App to Flows Infrastructure

Orchestrates the full migration of a legacy Dune app to the new Flows app hosting (`appsApi`). Works through each area in order, skipping any already in the correct state.

## Step 1 — Audit current state

Read `app.json`, `package.json`, `vite.config.ts`, and `manifest.json` (if present).

Report a concise summary before making any changes:

```
Migration audit:
✗ app.json: missing infra field → will add "infra": "appsApi"
✗ Auth: DuneAuthProvider in use → will run setup-flows-auth
✗ manifest.json: missing → will create
✓ Deploy script: already uses @cognite/cli
```

Then proceed through Steps 2–5.

---

## Step 2 — Update `app.json`

If `infra` is already `"appsApi"`, skip this step. Otherwise, add or update the field:

```json
{
  "name": "My App",
  "externalId": "my-app",
  "versionTag": "0.0.1",
  "infra": "appsApi",
  "deployments": [...]
}
```

---

## Step 3 — Set up Flows auth

Run the `setup-flows-auth` skill now. It handles everything auth-related: package installation, Vite plugin updates, entry file changes, and wiring up `connectToHostApp`.

---

## Step 4 — Create or update `manifest.json`

The Flows host uses `manifest.json` to enforce a Content Security Policy for the app. It must exist at the repo root.

**Create if missing:**

```json
{
  "manifestVersion": 1,
  "permissions": {
    "network": []
  }
}
```

**Populate network permissions** by scanning for outbound calls to external domains:

```bash
grep -rn "fetch\|axios\|new XMLHttpRequest" src/ --include="*.ts" --include="*.tsx"
```

For each group of external URLs found, add an entry to the `network` array using the `sources`/`directives` shape:

```json
{
  "manifestVersion": 1,
  "permissions": {
    "network": [
      {
        "sources": ["https://api.example.com", "https://maps.googleapis.com"],
        "directives": ["connect-src"]
      }
    ]
  }
}
```

Rules:
- Use full origin (scheme + hostname) in `sources`, not just the hostname.
- `"connect-src"` covers `fetch`/`XMLHttpRequest`. Use `"img-src"` for image URLs, `"font-src"` for fonts.
- The CDF cluster URL is allowed automatically; do not list it.
- If no external calls exist, leave `"network": []`.
- Flag any dynamic URLs the user needs to verify manually.

---

## Step 5 — Update deploy scripts

Replace any `dune deploy` or `npx @cognite/dune` commands in `package.json`:

```json
{
  "scripts": {
    "deploy": "npx @cognite/cli@latest apps deploy --interactive --published",
    "deploy-preview": "npx @cognite/cli@latest apps deploy --interactive"
  }
}
```

Keep all other scripts (`start`, `build`, `test`, etc.) unchanged.

---

## Step 6 — Final check

```bash
grep -rn "DuneAuthProvider\|useDune\|@cognite/dune" src/ vite.config.ts 2>/dev/null
```

List any remaining hits for the user to resolve. Then report:

```
Migration complete:
✓ app.json: infra set to "appsApi"
✓ Auth: setup-flows-auth applied
✓ manifest.json: network permissions set
✓ Deploy scripts: updated to @cognite/cli
```
