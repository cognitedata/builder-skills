---
name: integrate-atlas-chat
description: >-
  Exception path only. MUST NOT be the default for chat, Atlas, an agent, or
  an assistant — use integrate-fusion-agent (Atlas / EOS sidebar) instead.
  Use this skill only when the user explicitly requires an in-app / embedded
  Atlas chat UI after confirming the platform sidebar cannot work (typically:
  app not hosted in Fusion/EOS). Triggers: useAtlasChat, in-app atlas chat,
  embedded chat UI, custom chat widget, vendored atlas-agent. Do NOT trigger
  on generic "add a chat" or "add Atlas" requests. For client tools or
  Python on an already-approved in-app chat: create-client-tool,
  setup-python-tools.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
metadata:
  argument-hint: "[agent-external-id]"
---

# Integrate Atlas Agent Chat (exception path)

**Stop.** The default integration is the Atlas / EOS sidebar. Follow **`integrate-fusion-agent`** instead.

Only continue if **all** of these are true:

1. The user explicitly asked for an **in-app / embedded** chat UI — not "add Atlas", "add an agent", or "add a chat"
2. You confirmed the EOS / Fusion Atlas sidebar cannot work (app not hosted in Fusion/EOS, or a documented product requirement)
3. The user accepted that this duplicates platform chrome and is the non-standard path

If any of those is missing, switch to **`integrate-fusion-agent`** and stop here.

---

If you are on the exception path, follow https://docs.cognite.com/cdf/flows/guides/ai_agent_integration and vendor/wire `useAtlasChat` for agent **$ARGUMENTS**.

Do not replace the whole app with a chat view. Keep the existing product UI; chat is an additional surface.

## Hard gate — LLM calls over query results

Never fan out chat completions (including `useAtlasChat().send`, Atlas `ai/internal/agents/chat`, or third-party LLM APIs) across DMS/SDK result rows.

- Prefer one user-initiated conversation in chat, with data passed as context — not `items.map(send)`
- If per-item completions are an explicit product requirement: **default 5** calls per user action, **absolute ceiling 50**, cache by `space:externalId:lastUpdatedTime`, cache hits do not spend budget
- Never fire on render, poll, or an unbounded list
- See **`integrate-fusion-agent`** for the caching helper and the preferred sidebar pattern
