# CI/CD Workflow Templates

Use these GitHub Actions workflow templates to automate building and deploying your Flows app.

## CI — Lint, type-check, and build on PRs

`.github/workflows/app-ci.yaml`:

```yaml
name: App CI

on:
  pull_request:
    paths:
      - "src/**"
      - "package.json"
      - "vite.config.ts"
      - "tsconfig.json"

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci

      - run: npm run lint

      - run: npm run typecheck

      - run: npm run build
```

## CD — Deploy to production on merge to `main`

`.github/workflows/app-cd.yaml`:

```yaml
name: App CD

on:
  push:
    branches: [main]
    paths:
      - "src/**"
      - "package.json"
      - "vite.config.ts"
      - "app.json"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci

      - run: npm run build

      - name: Deploy to Flows
        env:
          COGNITE_CLIENT_ID: ${{ secrets.COGNITE_CLIENT_ID }}
          COGNITE_CLIENT_SECRET: ${{ secrets.COGNITE_CLIENT_SECRET }}
        run: npx @cognite/cli@latest apps deploy --published
```

## Required Secrets

Add these to your GitHub repo under **Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
|---|---|
| `COGNITE_CLIENT_ID` | CDF → Access management → Service accounts → your deployment account |
| `COGNITE_CLIENT_SECRET` | Same service account — create a client secret |

The service account needs the `AppHosting:WRITE` capability in your CDF project.

## Deploy script in `package.json`

The CD workflow above calls `npm run deploy`. Make sure `package.json` has:

```json
{
  "scripts": {
    "deploy": "npx @cognite/cli@latest apps deploy --published",
    "deploy-preview": "npx @cognite/cli@latest apps deploy"
  }
}
```
