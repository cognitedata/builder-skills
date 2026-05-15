---
name: integrate-fusion-agent
description: >-
  Integrates a Flows/Dune app with the Fusion built-in PAIA agent panel using
  @cognite/app-sdk. Use this skill whenever a developer wants to: open the
  agent panel from their app, send the agent a contextual message, let the
  agent read app state (resources), or let the agent call actions in the app.
  Triggers: "fusion agent", "PAIA", "agent panel", "sendAgentMessage",
  "sendAgentLayoutMode", "agent server", "registerAgentServer",
  "connectToHostApp", "agent integration", "agent sidebar", "app-sdk agent".
  Always use this skill instead of manually writing agent integration code —
  it sets up the correct lifecycle, graceful fallback, and recommended file
  structure.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

# Integrate Fusion Agent Panel

Wire a Flows/Dune app into the Fusion built-in PAIA agent using `@cognite/app-sdk`.

There are three independent capabilities — implement only the ones needed:

1. **Open the agent panel** — a button that shows the sidebar/fullscreen agent UI
2. **Send the agent a message** — inject context into the chat (e.g. on item click)
3. **Register an agent server** — expose app state (resources) and actions the agent can call

---

## Step 0 — Understand the app

Before writing any code, read:

- `package.json` — detect package manager and whether `@cognite/app-sdk` is already installed
- `src/App.tsx` (or main entry) — understand current structure, existing SDK usage

Ask the user which of the three capabilities they need if it's not clear from context.

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

## Step 3 — Opening the agent panel

Wire a persistent toolbar button (or equivalent trigger) to `api.sendAgentLayoutMode`.

```typescript
import { type AgentLayoutPayload } from '@cognite/app-sdk';

// Open as sidebar (most common)
await api.sendAgentLayoutMode({ mode: 'sidebar' });

// Other modes
await api.sendAgentLayoutMode({ mode: 'fullscreen' });
await api.sendAgentLayoutMode({ mode: 'closed' });
```

The button should only render when `api` is not null — agent features are unavailable outside Fusion.

```tsx
{api && (
  <button onClick={() => api.sendAgentLayoutMode({ mode: 'sidebar' })}>
    Open Assistant
  </button>
)}
```

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

The message text should include relevant context the agent can act on immediately — item names, IDs, current state summary.

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
      <MainContent />
      {api && (
        <ToolbarButton onClick={() => api.sendAgentLayoutMode({ mode: 'sidebar' })}>
          Open Assistant
        </ToolbarButton>
      )}
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

## Known pitfalls

### `setApi(resolvedApi)` stores a Promise, not the proxy

Comlink proxies are callable objects. React's `useState` setter, when given a function, calls it as `fn(prevState)` to compute the new state. Because a Comlink proxy responds to function calls (forwarding them to the remote), `setApi(proxy)` causes React to invoke the proxy, and the resulting Promise becomes the state value.

**Symptom:** `api` appears non-null (a Promise is truthy), but calling `api.sendAgentLayoutMode(...)` or checking `typeof api.sendAgentLayoutMode` returns nonsense.

**Fix:** Always use the updater form: `setApi(() => resolvedApi)`.

### `typeof proxy.method === 'function'` is always `true`

Comlink Proxy objects return `'function'` for any property access via `typeof`. This means you cannot use `typeof` guards to detect whether a method is actually supported by the host. Use `try/catch` or `.catch()` on the call instead.

---

## Checklist

- [ ] `@cognite/app-sdk@0.3.1+` installed
- [ ] `useHostApp` hook uses `setApi(() => resolvedApi)` — NOT `setApi(resolvedApi)`
- [ ] `useHostApp` hook catches rejection (outside Fusion), stores `api` in state
- [ ] Agent UI buttons only render when `api` is not null
- [ ] `useAgentServer` registered on mount, unregistered on unmount
- [ ] `registerAgentServer` and `unregisterAgentServer` calls have `.catch()` handlers
- [ ] Resource `description` fields explain what data is returned and when to read it
- [ ] Action `name` fields are `snake_case`
- [ ] Mutating actions warn in their `description` that confirmation is required
- [ ] Services injected into action/resource factories (not imported directly) — enables unit testing
