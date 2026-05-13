---
name: setup-flows-auth
description: "MUST be used when migrating a legacy Dune app to the new Flows infrastructure (appsApi), or when wiring up @cognite/app-sdk auth in a new Flows app. Detects whether the app is already on the new infrastructure and is a no-op if so. Covers: updating app.json infra field, swapping DuneAuthProvider/useDune() for connectToHostApp from @cognite/app-sdk, updating vite plugins, adding manifest.json, and updating the deploy script to use @cognite/cli. Triggers: migrate to Flows, migrate to appsApi, migrate from dune to flows, migrate to new infrastructure, migrate legacy app, setup flows auth, connectToHostApp, @cognite/app-sdk, Flows app hosting, new app infrastructure."
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
metadata:
  argument-hint: ""
---

# Set Up Flows Auth (appsApi infrastructure)

Wire a React app for the new Flows app hosting infrastructure. This replaces the legacy `@cognite/dune` auth pattern (`DuneAuthProvider` / `useDune()`) with `connectToHostApp` from `@cognite/app-sdk`.

## Step 1 — Detect current state, decide whether to act

Read `app.json`, `package.json`, and `src/main.tsx` (or `src/index.tsx`).

**Already migrated — report no-op and stop if all of these are true:**
- `app.json` has `"infra": "appsApi"`
- `@cognite/app-sdk` is in `package.json` dependencies
- `connectToHostApp` from `@cognite/app-sdk` is used in the entry or App component
- `manifest.json` exists at the repo root

**Legacy app that needs migration — proceed if any of these is true:**
- `app.json` is missing the `infra` field, or `infra` is not `"appsApi"`
- `DuneAuthProvider` or `useDune()` is imported from `@cognite/dune` in source files
- `@cognite/app-sdk` is absent from `package.json`

Detect the package manager from the lock file (`pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, otherwise npm).

## Step 2 — Update `app.json`

Add or update the `infra` field:

```json
{
  "name": "My App",
  "description": "...",
  "externalId": "my-app",
  "versionTag": "0.0.1",
  "infra": "appsApi",
  "deployments": [
    {
      "org": "<org>",
      "project": "<project>",
      "baseUrl": "https://<cluster>.cognitedata.com",
      "published": false,
      "deployClientId": "<client-id>",
      "deploySecretName": "<SECRET_NAME>"
    }
  ]
}
```

If `deployments` is missing or incomplete, flag this to the user — they will need to fill in the deployment target. The `deployClientId` and `deploySecretName` come from a service account set up in CDF for CI/CD deployment.

## Step 3 — Install `@cognite/app-sdk`

Install as a runtime dependency:

```bash
pnpm add @cognite/app-sdk   # or npm install / yarn add
```

## Step 4 — Update the Vite config

The new infrastructure uses plugins from `@cognite/app-sdk/vite` instead of `@cognite/dune/vite`.

Replace:

```ts
import { fusionOpenPlugin } from '@cognite/dune/vite';
// ...
plugins: [react(), mkcert(), fusionOpenPlugin()],
```

With:

```ts
import { fusionOpenPlugin, manifestCspPlugin } from '@cognite/app-sdk/vite';
// ...
// manifestCspPlugin() MUST be first — its middleware sets the CSP header before any HTML is sent
plugins: [manifestCspPlugin(), react(), mkcert(), fusionOpenPlugin()],
```

Keep any other plugins (tailwindcss, etc.) in place. Don't remove existing config.

If `vite-plugin-mkcert` is not already installed, add it as a dev dep (`pnpm add -D vite-plugin-mkcert`).

## Step 5 — Add `manifest.json`

Create `manifest.json` at the repo root if it doesn't exist:

```json
{
  "manifestVersion": 1,
  "permissions": {
    "network": []
  }
}
```

The `network` array lists external hostnames the app is allowed to fetch from. Add entries here if the app calls third-party APIs (e.g., `["api.example.com"]`). The CDF cluster hostname is allowed automatically and does not need to be listed.

## Step 6 — Migrate the entry file (`src/main.tsx`)

Remove `DuneAuthProvider` — auth is now handled inside `App.tsx`, not in the entry file.

Before:
```tsx
import { DuneAuthProvider } from '@cognite/dune';
// ...
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DuneAuthProvider>
        <App />
      </DuneAuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

After:
```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

Keep `QueryClientProvider` and `@tanstack/react-query` — they're still required.

## Step 7 — Migrate auth in `App.tsx`

Replace `useDune()` with `connectToHostApp`. The handshake is async — render a loading state until it resolves.

```tsx
import { connectToHostApp } from '@cognite/app-sdk';
import { useEffect, useState } from 'react';

import appConfig from '../app.json';

function App() {
  const [project, setProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    connectToHostApp({ applicationName: appConfig.externalId })
      .then(async ({ api }) => {
        if (cancelled) return;
        setProject(await api.getProject());
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // render authenticated UI
}
```

Use `appConfig.externalId` from `app.json` as the `applicationName` so the host can identify the app.

## Step 8 — Create an authenticated CogniteClient

If the app makes CDF API calls directly, create a `CogniteClient` using the credentials the host provides. The recommended pattern is to initialise the client once and store it in React state or context:

```tsx
import { connectToHostApp } from '@cognite/app-sdk';
import { CogniteClient } from '@cognite/sdk';
import { useEffect, useState } from 'react';

import appConfig from '../app.json';

function App() {
  const [sdk, setSdk] = useState<CogniteClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    connectToHostApp({ applicationName: appConfig.externalId })
      .then(async ({ api }) => {
        if (cancelled) return;
        const project = await api.getProject();
        const baseUrl = await api.getBaseUrl();
        const client = new CogniteClient({
          project,
          baseUrl,
          getToken: () => api.getAccessToken(),
        });
        if (!cancelled) setSdk(client);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // pass sdk down to children or into a context
}
```

This replaces the `sdk` that `useDune()` used to provide directly. Share it through a React context (e.g., `SdkContext`) or pass it as a prop to child components.

## Step 9 — Replace remaining `useDune()` call sites

Search for all `useDune` imports across the codebase:

```bash
grep -r "useDune" src/
```

For each call site:
- Replace `const { sdk } = useDune()` with the `sdk` received from context or props (set up in Step 8).
- Replace `const { isLoading } = useDune()` with the loading state threaded from `App`.
- Remove `import { useDune } from '@cognite/dune'` once all call sites are replaced.

## Step 10 — Update deploy scripts in `package.json`

Replace any `dune deploy` or `npx @cognite/dune` commands with `@cognite/cli`:

```json
{
  "scripts": {
    "deploy": "npx @cognite/cli@latest apps deploy --interactive --published",
    "deploy-preview": "npx @cognite/cli@latest apps deploy --interactive"
  }
}
```

## Step 11 — Clean up `@cognite/dune` (if safe)

Once auth, vite plugins, and deploy scripts no longer use `@cognite/dune`, remove it:

```bash
pnpm remove @cognite/dune   # or npm uninstall / yarn remove
```

First verify there are no remaining imports:
```bash
grep -r "@cognite/dune" src/ vite.config.ts package.json
```

If other features from `@cognite/dune` are still in use (e.g., `AppSdkAuthProvider`, `DuneTopbar`), keep the package and flag to the user which usages remain.

## Step 12 — Add `CLAUDE.md` / `AGENTS.md` (recommended)

The new Flows template ships with coding standards that guide AI agents. If the project doesn't have a `CLAUDE.md` or `AGENTS.md`, ask the user whether they'd like you to add one. These files are identical in content — `CLAUDE.md` is picked up by Claude Code and `AGENTS.md` by Cursor/other agents.

The canonical content for new Flows apps includes: dependency injection via React context, interface-based services, the ViewModel pattern, test-first development with Vitest, TypeScript rules (no `any`), and Conventional Commits. Ask the user if they want to adopt any or all of these conventions before adding the file.
