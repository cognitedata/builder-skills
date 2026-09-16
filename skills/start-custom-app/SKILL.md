---
name: start-custom-app
description: >-
  MUST be used after `npx @cognite/cli@latest apps create` when Fusion Custom
  apps Start building, or whenever a builder needs Industrial MCP OAuth, CDF
  token/inspect appHostingAcl, data-model curiosity, local HTTPS, or the
  localhost-first path. Triggers: Start building, Fusion Custom apps, Industrial
  MCP, claude mcp add-json, token/inspect, appHostingAcl, local HTTPS,
  apps setup-https, mkcert, SME story, data models curiosity.
allowed-tools: Read, Glob, Grep, Bash
---

# Start a Custom app (localhost first)

Fusion Custom apps Start building injects CDF org, project, cluster, base URL,
intent, this project's Industrial MCP URL, and OAuth client ids. Use those
values. Do not invent them.

Get a clickable `https://localhost:<port>` prototype running quickly. The user
story, data-model curiosity, and App-Brief.md proceed in parallel after
localhost is up. Access is a parallel track, not a gate.

Do not paste this skill body into the chat. Follow it.

## 1. Clickable prototype on https://localhost

Serve the scaffold and get `https://localhost:<port>` opening in the browser.
Do not wait for a finished persona or App-Brief.

Fusion loads the app at `https://localhost:<port>`. Help them over cert
warnings with:

```bash
npx @cognite/cli@latest apps setup-https
```

Docs: https://docs.cognite.com/cdf/flows/guides/local-https

Do not invent mkcert steps. `vite-plugin-mkcert` in the scaffold is the local
HTTPS plugin; the CLI command is the supported recovery path.

Catalog listing in Fusion Custom apps needs deploy plus `appHostingAcl` WRITE.
Say that once so they do not think the catalog is broken, then keep going.

## 2. Connect Industrial MCP (browser OAuth)

Industrial MCP is an HTTP MCP server. Complete the OAuth web flow in the
browser. Do not use `claude mcp add-json` as the happy path.

MCP URL: use the URL from the Fusion prompt (pattern
`{baseUrl}/api/v1/projects/{project}/ai/mcp`).

OAuth client ids (Fusion also injects these):

- Cursor: `industrial-mcp-cursor`
- Claude Desktop: `industrial-mcp-claude`

Docs: https://docs.cognite.com/cdf/build/industrial_mcp

## 3. Check app hosting access — REST, not an MCP query tool

Industrial MCP is graph / time series / documents. It does not inspect IAM. Do
not invent an MCP query tool for this check.

```
GET {baseUrl}/api/v1/token/inspect
Authorization: Bearer <session>
```

There is no project in that path. Inspect itself needs `projectsAcl:LIST` and
`groupsAcl:LIST`. If the response is 403, treat access as unknown and keep
going.

In `capabilities[]`, find `appHostingAcl` (camelCase). Filter `projectScope` to
this project (`currentProject`, `allProjects`, or `projects` includes the
Fusion project). Actions are `READ | WRITE | RUN`.

Can create and deploy a hosted app: `WRITE` and `scope: { all: {} }`. Per-app
`appExternalIdScope` WRITE only edits those apps.

If WRITE (all apps) is missing: in one sentence, tell them to contact the CDF
project admin to grant it, and to take action to request access. Then keep
building (localhost, story, UI) while that request/ticket matures. Do not wait.
Do not dump IAM JSON, do not paste tokens, do not say Fusion will grant this.

## 4. Inspect this project's data models

Be curious. Prefer MCP list/query tools. Fallback:

```
GET {baseUrl}/api/v1/projects/{project}/models/datamodels?limit=1000&includeGlobal=true
```

Look for opportunities in the real data. Name which models are relevant to the
intent. Do not invent spaces or views.

For graph-native reads, follow `dm-graph-traversal` and
`dm-limits-and-best-practices`.

## 5. Stand in the SME's shoes

Put yourself in the shoes of that SME. Understand the craft and the pain in
their day-to-day. Help them formulate the persona, one-sentence user story, and
use cases. Do not wait for the admin.

## 6. App-Brief.md after the conversation

Only then write `App-Brief.md`. Follow `flows-app-brief`. Infer only what the
conversation and data models support. Leave unknowns empty. Do not invent
customer, owner, or repository. Do not paste a blank YAML template. Do not open
by asking the builder to fill App-Brief.md verbatim.

## 7. Deploy, sign, submit

Follow `flows-external-app-submit` to deploy, sign as builder, and submit for
review. If they are not a certified builder yet, tell them how to submit and
keep the app iterating locally until review lands.

Localhost, skills, deploy, sign, and submit can overlap with the access
request. Do not wait for access before scaffolding or serving localhost.
