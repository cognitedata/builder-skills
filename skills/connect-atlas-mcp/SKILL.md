---
name: connect-atlas-mcp
description: >-
  MUST be used when a Fusion Custom apps Start building or Build app prompt
  is in chat and Industrial / Atlas MCP must be connected. Triggers:
  ---Start Building---, Intent sketch from Fusion Custom apps, createdVia
  fusion.customApps.buildPrompt, MCP URL from Fusion, the Fusion MCP login
  command. Expects those injected strings. Do not use for docs MCP or
  dm-graph-traversal.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

# Connect Atlas MCP (Fusion launch)

The Fusion prompt already has this project's Industrial MCP URL(s) and the
exact login / add command for the tool they launched. Use those strings as
written. Do not rebuild the URL from cluster or project. Do not invent
client ids, callback ports, or `claude mcp add` vs `add-json`.

If `---Start Building---` is missing, or the MCP URL / login command is
missing, the desktop URL was truncated. Ask the builder to Copy from Fusion
and paste, then continue.

Do not paste tokens. Do not scrape the CLI keychain. `npx @cognite/cli auth
login` is only the MCP credential if Fusion printed that command.

## 1. Run Fusion's command

Run the login / add command from the prompt. If Fusion also gave MCP JSON,
merge the `cognite` server into the template config and keep `cognite-docs`.

## 2. Finish OAuth in the IDE

Enable the `cognite` server and complete the browser flow. Success is
connected in the IDE, not a file on disk.

## 3. Explore this project's data models

Prefer MCP list/query. Name models relevant to the Fusion intent. Do not
invent spaces or views. Graph reads in app code: `dm-graph-traversal`.
