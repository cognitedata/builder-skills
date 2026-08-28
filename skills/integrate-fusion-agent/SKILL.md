---
name: integrate-fusion-agent
description: >-
  MUST be used whenever adding AI, an agent, a chat UI, Atlas, an assistant,
  or any LLM-backed feature to a Flows/Fusion app. Default to the Atlas / EOS
  sidebar (Fusion PAIA panel) via @cognite/app-sdk. Do NOT embed a custom chat
  UI, vendor atlas-agent, wire useAtlasChat, or loop chat completions over
  query results. Triggers: atlas, atlas chat, EOS sidebar, EOS, agent chat,
  chat UI, chat interface, chat component, assistant, PAIA, fusion agent,
  sendAgentMessage, sendAgentLayoutMode, registerAgentServer, connectToHostApp,
  agent panel, agent sidebar, useAtlasChat, chat completions, LLM. Use
  integrate-atlas-chat only when the user explicitly requires an in-app chat
  after confirming the platform sidebar cannot work.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

# Integrate Atlas / EOS Sidebar

The default — and almost always the only — way to add AI to a Flows/Fusion app is the **platform Atlas sidebar** (EOS / Fusion PAIA panel) via `@cognite/app-sdk`.

Do **not** embed a custom chat UI (`useAtlasChat`, vendored `atlas-agent`, a third-party chat widget, or OpenAI/Anthropic completions in the app). Those duplicate the shell, split conversation history from Atlas, and make it easy to fan out unbounded LLM calls against CDF data.

`integrate-atlas-chat` is an exception path only: the user must explicitly require an in-app chat **and** confirm the EOS sidebar cannot work (typically: the app is not hosted in Fusion/EOS). If that is not both true, implement this skill instead.

There are three independent capabilities — implement only the ones needed:

1. **Open the Atlas sidebar** — Topbar Atlas button (preferred) plus `sendAgentLayoutMode` for in-app triggers
2. **Send the agent a message** — inject context into the platform chat (e.g. on item click)
3. **Register an agent server** — expose app state (resources) and actions the agent can call

---

## Step 0 — Understand the app

Before writing any code, read:

- `package.json` — detect package manager and whether `@cognite/app-sdk` is already installed
- `src/App.tsx` (or main entry) — understand current structure, existing SDK usage

Ask the user which of the three capabilities they need if it's not clear from context. Do not offer an in-app chat UI as an option unless they already insisted on the exception path.

---

## Step 1 — Install the SDK

If `@cognite/app-sdk` is not already in `package.json`, install it:

```shell
pnpm add @cognite/app-sdk     # or npm/yarn depending on the app
```

Minimum required version: `0.3.1`

---

## Step 2 — Connect to the host app

All capabilities require a `HostAppAPI` instance. Obtain it once on mount and store it in React state or context. Always catch the rejection — the SDK throws when running outside Fusion (e.g. standalone `vite dev`).

**Pattern for React apps:**

```typescript
// src/hooks/useHostApp.ts
import { useState, useEffect } from 'react';
import { connectToHostApp, type HostAppAPI } from '@cognite/app-sdk';

export function useHostApp(): HostAppAPI | null {
  const [api, setApi] = useState<HostAppAPI | null>(null);

  useEffect(() => {
    connectToHostApp({ applicationName: 'my-app' })
      .then(({ api: resolvedApi }) => {
        // IMPORTANT: use the updater form here. Comlink proxies are callable
        // objects, so setApi(proxy) causes React to invoke the proxy as a
        // state-updater function — storing a Promise instead of the proxy.
        // setApi(() => proxy) returns the proxy as the new state value.
        setApi(() => resolvedApi);
      })
      .catch(() => {
        // Running outside Fusion — agent features disabled, no-op
      });
  }, []);

  return api;
}
```

Call `useHostApp()` at the root of your app and pass `api` down (or put it in context). When `api` is `null`, all agent UI triggers should be hidden or disabled — not shown as broken.

---

## Step 3 — Opening the Atlas sidebar

The **primary** open affordance is the Aura Topbar **Atlas** button (`systemActions.atlas.visible: true`). Follow `use-topbar` — do not add a second "Open Assistant" / "Chat" control in the app chrome.

Use `api.sendAgentLayoutMode` for **in-app contextual triggers** (e.g. "Analyse this item"), not as a duplicate launcher.

```typescript
import { type AgentLayoutPayload } from '@cognite/app-sdk';

// Open as sidebar (most common)
await api.sendAgentLayoutMode({ mode: 'sidebar' });

// Other modes
await api.sendAgentLayoutMode({ mode: 'fullscreen' });
await api.sendAgentLayoutMode({ mode: 'closed' });
```

Hide or disable in-app triggers when `api` is null — agent features are unavailable outside Fusion. The Topbar Atlas button is also a no-op outside the host.

---

## Step 4 — Sending the agent a message

Use `sendAgentMessage` on contextual triggers (e.g. "Analyse this item" button). Always pair it with `sendAgentLayoutMode` so the panel is visible.

```typescript
// Open sidebar then inject context
await api.sendAgentLayoutMode({ mode: 'sidebar' });
await api.sendAgentMessage({
  message: `Analyse the schedule for "${itemName}" and suggest how to reduce total duration.`,
  newSession: true,   // clears previous conversation — appropriate for contextual entry points
});
```

Use `newSession: true` when the user is starting a new task from a specific item. Omit it when you want to continue an existing conversation.

The message text should include relevant context the agent can act on immediately — item names, IDs, current state summary. This is the alternative to looping chat completions over query rows: **one** sidebar message (or a resource the agent can read), not N LLM calls.

---

## Step 5 — Registering an agent server

An agent server exposes **resources** (read-only app state the agent can read) and **actions** (tools the agent can invoke). Register once on mount, unregister on unmount.

### Recommended file structure

Separate concerns so each piece is independently testable:

```
src/features/agent/
  agentActions.ts     — pure factory: (deps) => Action[]
  agentResources.ts   — pure factory: (deps) => Resource[]
  useAgentServer.ts   — useEffect lifecycle hook; calls the factories and registers
```

### Resources

Resources are the agent's window into app state. Write `description` as you would a function docstring — the agent reads it to decide when to fetch the resource.

```typescript
// src/features/agent/agentResources.ts
import { createAgentResource } from '@cognite/app-sdk';
import type { StorageService } from '../storage/StorageService';

export function buildAgentResources(storage: StorageService) {
  return [
    createAgentResource({
      uri: 'my-app://current-state',
      name: 'Current application state',
      description:
        'The current list of items visible in the app, their statuses, and any active filters. Read this before answering questions about what the user is looking at.',
      async read() {
        const data = storage.getAll();
        return [{ type: 'json', data }];
      },
    }),
  ];
}
```

Each resource's `read()` returns an array of content parts:
- `{ type: 'json', data: unknown }` — structured data (preferred; agent reasons over it directly)
- `{ type: 'text', text: string }` — free-form text

### Actions

Actions are tools the agent can invoke. Use `snake_case` names and Zod for parameter schemas. The `.describe()` on each field is the agent's documentation.

```typescript
// src/features/agent/agentActions.ts
import { createAgentAction } from '@cognite/app-sdk';
import { z } from 'zod';
import type { DataService } from '../data/DataService';

export function buildAgentActions(dataService: DataService) {
  return [
    createAgentAction({
      name: 'get_item_details',
      description: 'Retrieve full details for a specific item by ID. Returns all fields including history.',
      parameters: z.object({
        item_id: z.string().describe('The ID of the item to retrieve'),
      }),
      async handler({ item_id }) {
        const item = await dataService.getItem(item_id);
        return { content: [{ type: 'json', data: item }] };
      },
    }),
  ];
}
```

**Mutating actions:** The agent does NOT ask the user for confirmation before calling actions — so use caution with actions that write data. Be explicit in the `description` that the action is destructive, and require the user to have approved before the agent calls it.

```typescript
createAgentAction({
  name: 'update_item_status',
  description:
    'Update the status of an item. Call this ONLY when the user has explicitly approved the change. The UI updates immediately.',
  parameters: z.object({
    item_id: z.string().describe('The item to update'),
    status: z.enum(['active', 'closed', 'pending']).describe('The new status'),
  }),
  async handler({ item_id, status }) {
    storage.updateStatus(item_id, status);
    return { content: [{ type: 'json', data: { success: true } }] };
  },
})
```

### Lifecycle hook

```typescript
// src/features/agent/useAgentServer.ts
import { useEffect } from 'react';
import { createAgentServer, registerAgentServer, type HostAppAPI } from '@cognite/app-sdk';
import { buildAgentActions } from './agentActions';
import { buildAgentResources } from './agentResources';
import { useStorageService } from '../storage/StorageServiceContext';
import { useDataService } from '../data/DataServiceContext';

export function useAgentServer(api: HostAppAPI | null): void {
  const storage = useStorageService();
  const dataService = useDataService();

  useEffect(() => {
    if (!api) return;

    const server = createAgentServer({
      uri: 'my-app',   // namespaced by Fusion with instance ID — no need to be globally unique
      actions: buildAgentActions(dataService),
      resources: buildAgentResources(storage),
    });

    void registerAgentServer(api, server).catch((err: unknown) => {
      console.warn('[agent] registerAgentServer failed:', err);
    });

    return () => {
      void api.unregisterAgentServer('my-app').catch((err: unknown) => {
        console.warn('[agent] unregisterAgentServer failed:', err);
      });
    };
  }, [api, storage, dataService]);
}
```

Call `useAgentServer(api)` near the root of your component tree, after `api` is available.

---

## Step 6 — Wire it all together

Call `useHostApp()` at the root, pass `api` to `useAgentServer`, and thread it down to any UI triggers:

```tsx
// src/App.tsx
function App() {
  const api = useHostApp();
  useAgentServer(api);   // registers resources + actions when api is ready

  return (
    <AppLayout>
      {/* Topbar Atlas button is the launcher — see use-topbar */}
      <MainContent onAnalyseItem={async (item) => {
        if (!api) return;
        await api.sendAgentLayoutMode({ mode: 'sidebar' });
        await api.sendAgentMessage({
          message: `Analyse "${item.name}" (id: ${item.id}).`,
          newSession: true,
        });
      }} />
    </AppLayout>
  );
}
```

---

## Dev vs. production

| Environment | `connectToHostApp` | Effect |
|---|---|---|
| Inside Fusion | Resolves with `{ api }` | All features work |
| Standalone `vite dev` | Rejects | Agent features silently disabled |

This is handled by the `useHostApp` hook above — no extra conditionals needed elsewhere.

---

## Testing

Because `buildAgentActions` and `buildAgentResources` are pure factories that accept services as arguments, test them directly without mounting React:

```typescript
// agentActions.test.ts
const mockDataService = { getItem: vi.fn().mockResolvedValue({ id: '1', name: 'Test' }) };
const [getItemAction] = buildAgentActions(mockDataService);

const result = await getItemAction.handler({ item_id: '1' });
expect(result.content[0].data).toEqual({ id: '1', name: 'Test' });
```

---

## Hard gate — LLM calls over query results

Never fan out chat completions (Atlas `ai/internal/agents/chat`, OpenAI/Anthropic, or similar) across DMS/SDK result rows. One user action that maps an LLM call over a query can blow the project's AI budget.

**Do this instead:** put the data in an agent **resource**, or send **one** `sendAgentMessage` with a short summary and let the user continue in the Atlas sidebar.

If a product requirement still needs per-item completions (ask first; default is no):

| Rule | Limit |
| --- | --- |
| Default budget | **5** completions per user-initiated action |
| Absolute ceiling | **50** — never generate code that can exceed this |
| Cache | Key by `space:externalId:lastUpdatedTime` (or equivalent). Cache hits do not spend budget |
| Batch | Prefer **one** prompt covering N items over N separate calls |
| UX | Tell the user when the cap truncated the set ("summarized 5 of 200") |
| Trigger | User-initiated only — never on render, poll, or an unbounded list |

```typescript
const MAX_LLM_CALLS_PER_ACTION = 5; // raise only with explicit product need; never above 50
const ABSOLUTE_CEILING = 50;
const cache = new Map<string, string>();

async function enrichWithLlm<T extends { space: string; externalId: string; lastUpdatedTime?: string | number }>(
  items: T[],
  complete: (item: T) => Promise<string>,
): Promise<string[]> {
  const budget = Math.min(MAX_LLM_CALLS_PER_ACTION, ABSOLUTE_CEILING);
  const out: string[] = [];
  let spent = 0;
  for (const item of items) {
    const key = `${item.space}:${item.externalId}:${item.lastUpdatedTime ?? ''}`;
    const cached = cache.get(key);
    if (cached !== undefined) {
      out.push(cached);
      continue;
    }
    if (spent >= budget) break;
    const text = await complete(item);
    cache.set(key, text);
    out.push(text);
    spent += 1;
  }
  return out;
}
```

Forbidden: `items.map((row) => chat.completions.create(...))`, `Promise.all` of completions over a query page, or calling Atlas chat once per instance from `instances.list` / `instances.query`.

---

## Known pitfalls

### Embedding a custom chat UI

Do not vendor `atlas-agent` or wire `useAtlasChat` because "the app needs a chat". That is the Atlas / EOS sidebar. Custom in-app chat is `integrate-atlas-chat` and only after the user confirms the host sidebar cannot work.

### `setApi(resolvedApi)` stores a Promise, not the proxy

Comlink proxies are callable objects. React's `useState` setter, when given a function, calls it as `fn(prevState)` to compute the new state. Because a Comlink proxy responds to function calls (forwarding them to the remote), `setApi(proxy)` causes React to invoke the proxy, and the resulting Promise becomes the state value.

**Symptom:** `api` appears non-null (a Promise is truthy), but calling `api.sendAgentLayoutMode(...)` or checking `typeof api.sendAgentLayoutMode` returns nonsense.

**Fix:** Always use the updater form: `setApi(() => resolvedApi)`.

### `typeof proxy.method === 'function'` is always `true`

Comlink Proxy objects return `'function'` for any property access via `typeof`. This means you cannot use `typeof` guards to detect whether a method is actually supported by the host. Use `try/catch` or `.catch()` on the call instead.

---

## Checklist

- [ ] Chose Atlas / EOS sidebar — no in-app `useAtlasChat`, vendored `atlas-agent`, or third-party chat widget
- [ ] Topbar Atlas button is the launcher (`use-topbar`); no duplicate "Open Assistant" chrome
- [ ] `@cognite/app-sdk@0.3.1+` installed
- [ ] `useHostApp` hook uses `setApi(() => resolvedApi)` — NOT `setApi(resolvedApi)`
- [ ] `useHostApp` hook catches rejection (outside Fusion), stores `api` in state
- [ ] In-app agent triggers only render when `api` is not null
- [ ] `useAgentServer` registered on mount, unregistered on unmount
- [ ] `registerAgentServer` and `unregisterAgentServer` calls have `.catch()` handlers
- [ ] Resource `description` fields explain what data is returned and when to read it
- [ ] Action `name` fields are `snake_case`
- [ ] Mutating actions warn in their `description` that confirmation is required
- [ ] Services injected into action/resource factories (not imported directly) — enables unit testing
- [ ] No unbounded LLM / chat-completion loops over DMS results; if any completions exist they are capped (default 5, max 50) and cached
