---
name: setup-python-tools
description: "MUST be used when adding Pyodide or Python tool support to a Flows app. Do NOT manually configure usePyodideRuntime or wire pythonRuntime into useAtlasChat — this skill handles pyodide installation, hook setup, loading UI, and chat hook wiring. Prerequisite: integrate-atlas-chat (vendored src/atlas-agent + atlas chat wiring). Triggers: Pyodide, Python tools, pythonRuntime, usePyodideRuntime, runPythonCode, Python execution, client-side Python."
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
metadata:
  argument-hint: "[tool-names or agent-external-id]"
---

# Set Up Python Tool Execution

Add client-side Python tool execution via Pyodide to this Flows app.

Target: **$ARGUMENTS**

## Prerequisite

**`integrate-atlas-chat`** must already be complete: the app should have vendored atlas-agent code under `src/atlas-agent/` (including `react.ts` for `useAtlasChat`) and the peer dependencies from that skill (`@sinclair/typebox`, `ajv`, `ajv-formats`). Copy the Python-related modules from the **`integrate-atlas-chat`** skill `code/` directory into `src/atlas-agent/` when adding Pyodide (`python.ts`, `pyodide.ts`, `pyodide-react.ts`, `pyodide-runtime.ts` — see **`integrate-atlas-chat`** Step 5).

## Background

Atlas agents can have Python tools defined in their CDF config (`type: "runPythonCode"`).
When the agent calls one, it arrives as a `toolConfirmation` (auto-allowed) followed by a
`clientTool` action. The library fetches the tool's Python code from the agent config
automatically and executes it via the provided `pythonRuntime`.

You only need to:
1. Set up `usePyodideRuntime` to get a runtime instance
2. Pass `pythonRuntime` to `useAtlasChat`

No `PythonToolConfig` entries — the library reads the code from the agent's CDF config.

The flow is:
1. `usePyodideRuntime` loads Pyodide (~30MB, cached after first load), installs packages,
   and injects Cognite SDK credentials into the Python environment
2. When the agent calls a Python tool, the library fetches its code from the agent's CDF
   config (cached per session), wraps it, executes it in Pyodide, and returns the result

---

## Step 1 — Understand the app

Read these files before touching anything:

- `package.json` — detect package manager and existing deps
- The component that calls `useAtlasChat` — understand current tools/config

---

## Step 2 — Install Pyodide

Install **exactly** `pyodide@0.29.3` using the app's package manager.
This version must match the CDN artifacts loaded at runtime — installing a different version will cause errors.

- pnpm → `pnpm add pyodide@0.29.3`
- npm  → `npm install pyodide@0.29.3`
- yarn → `yarn add pyodide@0.29.3`

> **Note**: After **`integrate-atlas-chat`**, `@sinclair/typebox`, `ajv`, and `ajv-formats` should
> already be installed. If anything is missing, install the versions listed in that skill's **Dependencies** table.

---

## Step 3 — Set up usePyodideRuntime

In the component that calls `useAtlasChat`, add the Pyodide runtime hook:

```tsx
import { loadPyodide } from "pyodide";
import { usePyodideRuntime } from "./atlas-agent/pyodide-react";
import { useAtlasChat } from "./atlas-agent/react";

function MyChat() {
  const { sdk, isLoading } = useDune();

  // Initialize Python runtime (loads Pyodide, installs packages, sets up Cognite SDK)
  const {
    runtime: pythonRuntime,
    loading: pythonLoading,
    progress: pythonProgress,
    error: pythonError,
    isReady: pythonReady,
  } = usePyodideRuntime({
    loadPyodide,
    client: isLoading ? null : sdk,
    requirements: ["pandas", "numpy"],    // optional — additional packages
  });

  // ... useAtlasChat below
}
```

### Hook API reference

| Return field | Type | Description |
|---|---|---|
| `runtime` | `PythonRuntime \| undefined` | The initialized runtime, or undefined if not ready |
| `loading` | `boolean` | True while Pyodide is loading / initializing |
| `error` | `string \| null` | Error message if initialization failed |
| `progress` | `{ stage: string; percent: number }` | Current init progress for UI display |
| `isReady` | `boolean` | Convenience: `!loading && !error && runtime !== undefined` |

### Loading state UI

Place the loading indicator **above the chat input**, not in the message list.
Keep it compact — a pill/badge showing stage text and percent. Show an error badge separately.
First load is ~30-60s (downloads ~30MB); subsequent loads are <2s from browser cache.

```tsx
{/* Loading — shown above the input while Pyodide initializes */}
{pythonLoading && (
  <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
    {/* Optional: <IconBrandPython /> from @tabler/icons-react */}
    <span>{pythonProgress.stage || "Initializing Python..."}</span>
    {pythonProgress.percent > 0 && pythonProgress.percent < 100 && (
      <span className="text-xs opacity-70">({pythonProgress.percent}%)</span>
    )}
  </div>
)}

{/* Error — shown if init fails (after loading finishes) */}
{pythonError && !pythonLoading && (
  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
    <span>Python runtime failed to load</span>
  </div>
)}
```

---

## Step 4 — Wire into useAtlasChat

Pass the runtime to `useAtlasChat`. That's all — no tool configs needed:

```tsx
const { messages, send, isStreaming, progress, error, reset, abort } = useAtlasChat({
  client: isLoading ? null : sdk,
  agentExternalId: "my-agent",
  tools: [renderTimeSeries],   // regular client tools (declared to agent), if any
  pythonRuntime,               // from usePyodideRuntime — enables Python tool execution
});
```

**Note**: Python tools are NOT declared to the agent via `tools`. The agent already knows
about them from its CDF config. The library fetches the code automatically when needed.

---

## Step 5 — Disable input while Python loads

The user shouldn't send messages before the runtime is ready. Disable the **entire input area**
(not just the send button) so the state is unambiguous:

```tsx
<ChatInput
  onSend={handleSend}
  disabled={isStreaming || pythonLoading}
  // ...
/>
```

If you have a home page with suggestion chips, disable those too:

```tsx
<ChatHomePage
  onSuggestionClick={handleSuggestionClick}
  disabled={pythonLoading}
/>
```

---

## Done

The app can now execute Python tools client-side via Pyodide. When the agent calls a Python
tool, the library automatically fetches its code from the agent config, runs it in the
browser, and returns the result to the agent.
