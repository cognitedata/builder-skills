---
name: integrate-atlas-chat
description: "MUST be used whenever sending/receiving messages with an Atlas agent in code (streaming responses, running tool calls). Do NOT manually write useAtlasChat integration code — this skill handles installation and hook wiring. This skill does NOT build a chat UI/component — for the standard built-in Fusion agent chat panel, use integrate-fusion-agent instead. Triggers: useAtlasChat, atlas chat, streaming chat, agent chat, send message to atlas agent. For a full integration, run skills in order: (1) integrate-atlas-chat, (2) create-client-tool (per tool), (3) setup-python-tools (if Python tools needed)."
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
metadata:
  argument-hint: "[agent-external-id]"
---

# Integrate Atlas Agent Chat (code-level)

Wire up code-level access to Atlas Agent conversations in this Flows app: sending messages,
streaming responses, and running client/Python tool calls.

This sets up the **conversation engine only** — it does not build a chat UI. If you want the
standard built-in Fusion agent chat panel instead of writing your own UI, use
`/integrate-fusion-agent` (see https://docs.cognite.com/cdf/flows/guides/ai_agent_integration) —
that skill wires up `@cognite/app-sdk` and its panel handles rendering for you.

Agent external ID: **$ARGUMENTS**

## Dependencies

The atlas-agent library files (copied in Step 2) require these npm packages:

| Package | Version |
|---|---|
| `@sinclair/typebox` | `^0.33.0` |

`@cognite/sdk` is assumed to already be present in Flows apps.

---

## Your job

Complete these steps in order. Read each file before modifying it.

---

## Step 1 — Understand the app

Read these files before touching anything:

- `package.json` — detect package manager (`packageManager` field or lock file) and existing deps
- `src/App.tsx` (or equivalent entry component) — understand current structure

---

## Step 2 — Copy the atlas-agent source files

The atlas-agent library lives in the `code/` directory next to this skill file. Read and copy
the following files into `src/atlas-agent/` inside the app:

- `code/types.ts`
- `code/validation.ts`
- `code/client.ts`
- `code/session.ts`
- `code/react.ts`

> The Python-related files (`python.ts`, `pyodide.ts`, `pyodide-react.ts`, `pyodide-runtime.ts`)
> are only needed if the agent uses Python tools. The `setup-python-tools` skill copies those.

---

## Step 3 — Install dependencies

Install the required peer packages (see **Dependencies** above) using the app's package manager:

- pnpm → `pnpm add @sinclair/typebox@^0.33.0`
- npm  → `npm install @sinclair/typebox@^0.33.0`
- yarn → `yarn add @sinclair/typebox@^0.33.0`

---

## Step 4 — Send and receive messages in code

Use `useAtlasChat` from `./atlas-agent/react` wherever you need to talk to the agent. This hook
manages the session, message state, streaming, and abort support — it does not render anything.
How you expose that to the user (a custom widget, a sidebar, wiring it into existing UI, etc.) is
up to the app; this skill doesn't prescribe a component.

```ts
import { useAtlasChat } from "./atlas-agent/react";
import type { ChatMessage } from "./atlas-agent/react";

const { messages, send, isStreaming, progress, error, reset, abort } = useAtlasChat({
  client: isLoading ? null : sdk,   // null-safe — hook waits for a real client
  agentExternalId: "...",
  tools?: AtlasTool[],              // optional client-side tools
});

// messages[n].role          — "user" | "assistant"
// messages[n].text          — full text (streams chunk-by-chunk via isStreaming)
// messages[n].isStreaming   — true while this message is being written
// messages[n].toolCalls     — ToolCall[] once response is complete (client + server-side, in call order)
// progress                  — e.g. "Agent thinking" or "Executing: get_timeseries"
// isStreaming               — true for the entire duration of a response
```

Call `send(text)` to post a message and `abort()`/`reset()` to cancel/clear. If and when you do
build your own UI around this (rather than using the built-in Fusion panel), a few things worth
keeping in mind:

- Show streaming text in real time using `msg.isStreaming`
- Surface tool-call progress when `progress.startsWith("Executing:")`
- Each assistant `message.toolCalls` (after streaming completes) can be rendered as expandable detail

```tsx
{isStreaming && progress?.startsWith("Executing:") && (
  <div>⚙ {progress}</div>
)}

{msg.toolCalls?.map((tc, i) => (
  <ToolResult key={i} name={tc.name} output={tc.output} details={tc.details} />
))}
```

---

## Step 5 — Python tools (optional)

If the agent has Python tools (type `runPythonCode` in its CDF config), run the
`setup-python-tools` skill to add Pyodide-based client-side execution:

```
/setup-python-tools $ARGUMENTS
```

That skill copies the Python-related source files from `@skills/integrate-atlas-chat/code`,
installs `pyodide`, sets up `usePyodideRuntime`, and wires the runtime into
`useAtlasChat` via `pythonRuntime`. The library fetches Python tool code from the agent
config automatically — no `PythonToolConfig` entries needed.

You don't need this if the agent only uses built-in or regular client tools.

---

## Done

The app can now send messages to Atlas Agent `$ARGUMENTS` and read back streamed responses and
tool calls in code. There is no chat UI yet — build one, or run `/integrate-fusion-agent` instead
if the built-in Fusion chat panel is what you actually want.
