---
name: mentor
description: >-
  Onboarding guide for new Flows app developers using the Cognite CLI. Use this
  skill whenever someone is getting started with Flows, asks how to create a
  Flows app, wants to understand the app lifecycle, needs help with the Cognite
  CLI `apps` commands, or is confused about where to begin building on CDF.
  Also triggers for: "how do I start", "create my first app", "what is a Flows
  app", "new to Cognite CLI", "how does deployment work", "what's the app
  lifecycle", "mentor", "onboarding", "getting started", "first Flows app".
allowed-tools: Read, Glob, Grep, Bash
---

# Mentor — Getting Started with Flows Apps

Welcome! This skill guides new developers through building and shipping their first Flows app on Cognite Data Fusion (CDF). Work through the sections below in order, or jump to the section that matches where you are.

---

## What is a Flows App?

A **Flows app** is a React + TypeScript web application that runs inside Cognite Fusion — the Cognite platform UI. It sits in an iframe, gets an authenticated CDF SDK for free from the host, and is deployed to CDF as a versioned artifact.

The mental model:

```
Cognite Fusion (host)
  └── Your Flows App (iframe)
        ├── Auth is provided by the host (no OAuth config needed)
        ├── CDF SDK is available via @cognite/app-sdk
        └── You build the UI on top of CDF data
```

Key packages:

| Package | Role |
|---|---|
| `@cognite/app-sdk` | Auth handshake with the Fusion host, CDF SDK access |
| `@cognite/dune` | CLI — scaffold, develop, deploy apps |
| `@cognite/cli` | Alias for `@cognite/dune`; use `npx @cognite/cli@latest` |
| `@aura/*` | Cognite design system components |

---

## Step 1 — Prerequisites

Before creating your app, make sure you have:

- **Node.js ≥ 20** — check with `node -v`
- **A CDF project** with credentials (org, project name, cluster URL)
- **Access to Cognite Fusion** — you'll open your app there during dev

No global install needed. Everything runs via `npx`.

---

## Step 2 — Create the App

Run the scaffold command and answer the prompts:

```bash
npx @cognite/cli@latest apps create
```

**Example session:**

```
? App name (kebab-case): my-production-dashboard
? Display name: My Production Dashboard
? Description: Real-time production monitoring
? Deployment org: acme-corp
? Deployment project: acme-production
? Cluster/baseUrl: westeurope-1
```

This creates a fully wired project:

```
my-production-dashboard/
├── src/
│   ├── App.tsx          ← your entry component; auth is wired here
│   └── main.tsx         ← React root, no auth boilerplate needed
├── app.json             ← deployment config (org, project, cluster)
├── manifest.json        ← network permissions (CSP)
├── vite.config.ts       ← Vite + Fusion dev plugins
├── package.json
├── tsconfig.json
└── index.html
```

**Install dependencies:**

```bash
cd my-production-dashboard
npm install   # or pnpm install / yarn install
```

---

## Step 3 — Pull AI Skills

Pull the builder skills so your AI agent (Claude Code, Cursor, etc.) can help you work effectively inside this project:

```bash
npx @cognite/cli@latest apps skills pull
```

This copies skills like `setup-flows-auth`, `design`, `code-quality`, and others into `.claude/skills/` in your project. They guide the AI on Cognite-specific patterns automatically.

To add a specific skill only:

```bash
npx @cognite/cli@latest apps skills pull --skill integrate-atlas-chat
```

---

## Step 4 — Run Locally

Start the dev server:

```bash
npm run dev   # or pnpm start
```

The app opens at `https://localhost:3001` (HTTPS is required for the Fusion iframe). The `fusionOpenPlugin` in `vite.config.ts` automatically opens your app inside Fusion in your browser.

**How auth works in development:**

`@cognite/app-sdk`'s `connectToHostApp()` (already in `App.tsx`) does a Comlink handshake with the Fusion host. In dev mode the Fusion host is the real Fusion UI at your cluster URL — no mock needed.

**Anatomy of `App.tsx`:**

```tsx
import { connectToHostApp } from "@cognite/app-sdk";
import { useEffect, useState } from "react";

function App() {
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    connectToHostApp({ applicationName: "my-production-dashboard" })
      .then(({ api }) => api.getCogniteClient())
      .then(setClient)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div>Connecting...</div>;
  return <MyDashboard client={client} />;
}
```

`client` is a fully authenticated `CogniteClient` — use it to query assets, time series, data models, and any other CDF resource.

---

## Step 5 — Understand the App Lifecycle

A Flows app moves through these phases:

```
scaffold → develop → preview → publish → maintain
```

### Scaffold
Create the project once with `npx @cognite/cli@latest apps create`. After this, the CLI manages the rest.

### Develop
Iterate locally. The Vite dev server reloads on every save. Auth and data come from your real CDF project, so you're always testing against real data.

### Preview Deploy
Deploy a non-published version to share with stakeholders or test in the real Fusion environment:

```bash
npx @cognite/cli@latest apps deploy --interactive
```

This opens a browser for OAuth authentication, then uploads the build and gives you a preview link inside Fusion. Preview versions don't appear in the app launcher by default.

### Publish (Production)
Publish so the app appears in the Fusion app launcher for all users:

```bash
npx @cognite/cli@latest apps deploy --interactive --published
```

Or via `package.json`:

```bash
npm run deploy   # typically runs: npx @cognite/cli@latest apps deploy --interactive --published
```

### CI/CD
For automated deployment on merge to `main`, see `references/cicd.md` for GitHub Actions workflow templates. Use a service account client ID + secret stored as repo secrets.

### Maintain
- **Update dependencies** with `npm update` — especially `@cognite/app-sdk` and `@aura/*` packages.
- **Run the app review** before submitting to the Cognite app catalog: invoke the `flows-app-review` skill.
- **Version tracking**: `app.json`'s `versionTag` is updated automatically on each deploy.

---

## Step 6 — Key Files Reference

| File | Purpose | Touch it? |
|---|---|---|
| `app.json` | Deployment config — org, project, cluster, version | Yes — set up once |
| `manifest.json` | CSP network permissions for external API calls | Yes — add domains you fetch from |
| `vite.config.ts` | Dev server, plugins, build settings | Rarely |
| `src/App.tsx` | Your root component; auth handshake lives here | Yes — your starting point |
| `src/main.tsx` | React root mount; QueryClient setup | Rarely |
| `.claude/skills/` | Builder skills for your AI agent | Via CLI only |

---

## Step 7 — What to Build Next

Once your app is running locally, these skills guide the next steps:

| Goal | Skill to use |
|---|---|
| Add a standard top navigation bar | `use-topbar` |
| Add an AI chat interface (Atlas Agent) | `integrate-atlas-chat` |
| Preview CDF files (PDFs, images) | `integrate-file-viewer` |
| Query CDF data models efficiently | `dm-limits-and-best-practices` |
| Review code quality before deploying | `code-quality` or `flows-app-review` |
| Set up auth in an existing app | `setup-flows-auth` |

Run any skill by asking your AI agent: *"Run the `<skill-name>` skill"*.

---

## Common First-Timer Questions

**Q: Do I need to configure CDF credentials in `.env`?**
No. In Flows apps, the Fusion host injects auth into your app via `connectToHostApp`. You don't manage tokens or API keys — just call the returned `CogniteClient`.

**Q: How do I fetch data from CDF?**
Use the `CogniteClient` from the `connectToHostApp` handshake. Example:

```ts
const assets = await client.assets.list({ filter: { root: true } });
```

**Q: My app works locally but fails inside Fusion — why?**
Check `manifest.json`. If your app calls external APIs (anything other than the CDF cluster), those domains must be listed under `permissions.network`. The `migrate-app-to-flows` skill can audit this for you.

**Q: How do I add more pages / routing?**
Install `react-router-dom` and wrap your app in `<BrowserRouter>`. Use `<Routes>` and `<Route>` inside `App.tsx`. The Fusion host forwards hash and path routing correctly.

**Q: Can I use a monorepo with both CDF Toolkit (backend) and a Flows app (frontend)?**
Yes — the recommended layout is `modules/` for CDF resources and `app/` for the Flows frontend. This is also the direction for a future `cdf init --flows-app` scaffold command.

---

## Quick Reference Card

```bash
# Create a new app
npx @cognite/cli@latest apps create

# Pull/update AI skills
npx @cognite/cli@latest apps skills pull

# Start local dev server
npm run dev

# Build for production
npm run build

# Deploy preview (not in app launcher)
npx @cognite/cli@latest apps deploy --interactive

# Deploy to production (appears in app launcher)
npx @cognite/cli@latest apps deploy --interactive --published

# Explore CLI commands
npx @cognite/cli@latest --help
npx @cognite/cli@latest apps --help
```
