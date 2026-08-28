---
name: integrate-atlas-chat
description: >-
  Exception path. Use integrate-fusion-agent for Atlas/chat/agent. Only when the
  user explicitly requires in-app useAtlasChat after the EOS sidebar cannot work
  (typically: not hosted in Fusion/EOS). Triggers: useAtlasChat, in-app atlas
  chat, embedded chat, vendored atlas-agent. Not for generic "add a chat".
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
metadata:
  argument-hint: "[agent-external-id]"
---

# Integrate Atlas Agent Chat (exception path)

**Stop.** Use **`integrate-fusion-agent`** (Atlas / EOS sidebar) unless all of:

1. The user asked for an **in-app / embedded** chat — not "add Atlas" / "add a chat"
2. The EOS sidebar cannot work (not hosted in Fusion/EOS, or a documented requirement)
3. The user accepted this as the non-standard path

Then follow https://docs.cognite.com/cdf/flows/guides/ai_agent_integration and wire `useAtlasChat` for **$ARGUMENTS**. Keep the product UI; do not replace the app with a chat view.

Do not map `send()` / chat completions over DMS rows. If per-item completions are required: **5** per user action, ceiling **50**, cache by `space:externalId:lastUpdatedTime`. See `integrate-fusion-agent`.
