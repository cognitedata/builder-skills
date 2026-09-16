---
name: connect-atlas-mcp
description: >-
  MUST be used when a Fusion Custom apps Start building or Build app prompt
  needs Industrial / Atlas MCP connected: ---Start Building---, Intent sketch
  from Fusion Custom apps, createdVia fusion.customApps.buildPrompt, or Follow
  the pulled skills (start-flows-app for MCP OAuth. Writes the official
  cognite MCP server into the app template mcp.json and finishes IDE browser
  OAuth. Do not use for docs MCP, dm-graph-traversal, or CLI auth login as
  the MCP credential.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

# Connect Atlas MCP (Fusion launch)

Fusion already injected this project's Industrial MCP URL and OAuth client
ids. Use those. Do not invent them. Do not paste tokens or scrape the CLI
keychain. `npx @cognite/cli auth login` is a separate CogIdP session for
deploy / inspect — it does not authenticate MCP.

If `---Start Building---` is missing, the desktop URL was truncated. Ask the
builder to Copy from Fusion and paste, then continue.

## 1. Merge `cognite` into the template MCP config

`apps create` already ships docs MCP as `cognite-docs`. Keep it. Add a
sibling server named `cognite` (Fusion's name). URL:

`{baseUrl}/api/v1/projects/{project}/ai/mcp`

**Cursor** — `.cursor/mcp.json`:

```json
"cognite": {
  "url": "<mcpUrl>",
  "auth": { "CLIENT_ID": "industrial-mcp-cursor" }
}
```

**Claude Code** — `.mcp.json`, then register (Fusion: `claude mcp add` cannot
pass client id / callback port):

```json
"cognite": {
  "type": "http",
  "url": "<mcpUrl>",
  "oauth": { "clientId": "industrial-mcp-claude", "callbackPort": 3118 }
}
```

```bash
claude mcp add-json cognite '<paste the cognite object as JSON>'
```

**Copilot / VS Code** — `.vscode/mcp.json` `servers.cognite`: `type: http`,
same URL, `oauth.clientId`: `industrial-mcp-copilot`.

## 2. Finish OAuth in the IDE

Enable the `cognite` server and complete the browser login. Success is the
server listed and connected — not a JSON blob on disk.

## 3. Explore this project's data models

Prefer MCP list/query tools. Name models relevant to the Fusion intent.
Do not invent spaces or views. Graph reads in app code: `dm-graph-traversal`.
