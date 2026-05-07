---
name: integrate-atlas-chat
description: "MUST be used whenever building a chat UI with Atlas agents in a Flows app. Do NOT manually write useAtlasChat integration code — this skill handles installation, component structure, and hook wiring. Triggers: useAtlasChat, atlas chat, streaming chat, agent chat, chat interface, chat component, chat UI. For a full chat app, run skills in order: (1) integrate-atlas-chat, (2) create-client-tool (per tool), (3) setup-python-tools (if Python tools needed)."
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
metadata:
  argument-hint: "[agent-external-id]"
---

# Integrate Atlas Agent Chat

Add a streaming Atlas Agent chat UI to this Flows app.

Agent external ID: **$ARGUMENTS**

## Dependencies

The atlas-agent library files (copied in Step 2) require these npm packages:

| Package | Version |
|---|---|
| `@sinclair/typebox` | `^0.33.0` |
| `ajv` | `^8.17.1` |
| `ajv-formats` | `^2.1.1` |

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

- pnpm → `pnpm add @sinclair/typebox@^0.33.0 ajv@^8.17.1 ajv-formats@^2.1.1`
- npm  → `npm install @sinclair/typebox@^0.33.0 ajv@^8.17.1 ajv-formats@^2.1.1`
- yarn → `yarn add @sinclair/typebox@^0.33.0 ajv@^8.17.1 ajv-formats@^2.1.1`

---

## Step 4 — Build the chat component

Replace (or create) the main `App.tsx` with a full chat UI. The component must:

1. **Import** `useAtlasChat` and `ChatMessage` from `./atlas-agent/react` (relative to the component)
2. **Get the SDK** via `useDune()` from `@cognite/dune`
3. **Pass `null` while loading** — `client: isLoading ? null : sdk`
4. **Show streaming text** in real time using `msg.isStreaming` with a blinking cursor
5. **Show tool call events** — when `progress.startsWith("Executing:")`, render it distinctly
   (e.g. a ⚙ icon + monospace tool name) so tool calls are clearly visible
6. **Show tool calls** — each assistant `message.toolCalls` (after streaming completes)
   should appear as expandable cards beneath the message
7. **Abort button** — show a "Stop" button while `isStreaming`, wired to `abort()`
8. **Reset button** — "New chat" button wired to `reset()`
9. **Auto-scroll** — scroll to bottom on new messages and progress updates
10. **Auto-resize textarea** — expand up to ~120px, submit on Enter, newline on Shift+Enter

### Key hook API

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

### Tool call display pattern

```tsx
// During streaming — show as a distinct "tool call" bubble above the message
{isStreaming && progress?.startsWith("Executing:") && (
  <div>⚙ {progress}</div>
)}

// After response — show tool calls on the assistant message
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

Start the app and you should see a streaming chat UI connected to Atlas Agent `$ARGUMENTS`.
