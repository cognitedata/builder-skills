---
name: handle-startup-state
description: >-
  MUST be used when a Flows/Fusion app needs to read state it was launched
  with — a deep link, a shareable URL, or startup/bootstrap arguments set by
  a host embedding the app (e.g. an EOS dashboard widget). Triggers:
  initialState, connectToHostApp initialState, startup arguments, bootstrap
  state, initial state, deep link, restore state on mount, syncInternalState,
  customAppInternalState.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

# Handle Startup State

Reads the optional `initialState` string returned by `connectToHostApp()`
and restores it before first render, so the app opens directly into the
right view instead of always starting from defaults.

**Requires `@cognite/app-sdk`'s `connectToHostApp()` handshake already wired
up.** If auth isn't wired up yet, run the
[setup-flows-auth](../setup-flows-auth/SKILL.md) skill first.

## What `initialState` actually is

`initialState` is a single opaque string, present on the object returned
by `connectToHostApp()`:

```typescript
const { api, initialState } = await connectToHostApp();
```

Your app never needs to know **how** it got there — treat it the same way
regardless of source:

- A user opened a shareable URL your app previously wrote via
  `api.syncInternalState(...)` (the `customAppInternalState` URL param).
- A host embedded your app with a startup argument baked in (an EOS
  dashboard widget, or any other surface that programmatically launches your
  app with initial arguments). There's no UI for this on the host side —
  it's set in the host's own config, not by your app.
- The app was reloaded and the current URL still has the param from an
  earlier `syncInternalState` call.

All three arrive through the same field. Design your restore logic once and
it covers all of them.

## Step 1 — Decide your encoding

Pick one encoding and use it consistently:

- **Serialized route** (a path string) — if your app's state maps cleanly
  onto a URL you'd otherwise navigate to.
- **JSON string** — if you need multiple independent fields (active tab,
  filters, selected IDs). This is the more common choice and the one used
  below.

## Step 2 — Read `initialState` on mount, defensively

Restore before the first meaningful render. Malformed state must never
crash the app — the host cannot guarantee the string is well-formed (it
never parses it either), and an older app version may have written a
different shape.

```tsx
import { useEffect, useRef, useState } from 'react';
import { connectToHostApp, type HostAppAPI } from '@cognite/app-sdk';

interface AppState {
  activeTab: string;
  selectedAssetId?: string;
  filters: { status: string };
}

const DEFAULT_STATE: AppState = {
  activeTab: 'overview',
  filters: { status: 'all' },
};

export function parseInitialState(initialState: string | undefined): AppState {
  if (!initialState) return DEFAULT_STATE;
  try {
    const parsed = JSON.parse(initialState) as Partial<AppState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    // Malformed or from an incompatible app version — fall back to defaults.
    return DEFAULT_STATE;
  }
}

export function useAppState() {
  const [api, setApi] = useState<HostAppAPI | null>(null);
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const apiRef = useRef<HostAppAPI | null>(null);

  useEffect(() => {
    connectToHostApp()
      .then(({ api: resolvedApi, initialState }) => {
        apiRef.current = resolvedApi;
        setApi(() => resolvedApi);
        setState(parseInitialState(initialState));
      })
      .catch(() => {
        // Outside Fusion (standalone `vite dev`) — continue with defaults.
      });
  }, []);

  return { api, state, setState, apiRef };
}
```

Key points:

- **Merge, don't replace**: `{ ...DEFAULT_STATE, ...parsed }` so a partial or
  older-shaped payload still yields a usable state object, instead of
  `undefined` fields breaking downstream components.
- **`try`/`catch` around `JSON.parse`, always** — this is the one part of
  this skill that is not optional.
- Comlink proxies are callable, so `setApi(proxy)` makes React treat the
  proxy as a state *updater function*. Always wrap it: `setApi(() => resolvedApi)`.
- Extract the parsing logic (`parseInitialState`) into a plain function so
  it's unit-testable without mounting a component or mocking
  `connectToHostApp`.

## Step 3 — Wire restored state into your UI

Use the restored fields to drive initial render — don't restore into state
and then immediately overwrite it with a default in a later effect.

```tsx
function App() {
  const { api, state, setState } = useAppState();

  return (
    <TabBar
      activeTab={state.activeTab}
      onChange={(tab) => setState((s) => ({ ...s, activeTab: tab }))}
    />
  );
}
```

## Step 4 — Only if you also want shareable URLs: sync state back

Reading `initialState` and writing `syncInternalState` are independent —
implement Step 4 only if you want users to be able to copy the current URL
and share it. If your app is only ever launched with host-provided startup
arguments (never itself producing shareable links), you can stop after
Step 3.

```typescript
function updateState(patch: Partial<AppState>) {
  setState((prev) => {
    const next = { ...prev, ...patch };
    void apiRef.current?.syncInternalState(JSON.stringify(next));
    return next;
  });
}
```

`syncInternalState` **replaces** the stored value on every call — always
pass the complete state object, not just the changed field. See
[App state in URLs](https://docs.cognite.com/cdf/flows/guides/shareable-app-state-with-urls)
for the full write-side guide, including what to include/exclude from
persisted state and the URL length caveat.

## Step 5 — Add tests

Test `parseInitialState` directly — no component mount, no mocking
`connectToHostApp`:

```typescript
import { describe, expect, it } from 'vitest';
import { parseInitialState } from './use-app-state';

describe('parseInitialState', () => {
  it('returns defaults when initialState is undefined', () => {
    expect(parseInitialState(undefined)).toEqual({
      activeTab: 'overview',
      filters: { status: 'all' },
    });
  });

  it('merges a valid payload over the defaults', () => {
    const result = parseInitialState('{"activeTab":"trends"}');
    expect(result.activeTab).toBe('trends');
    expect(result.filters).toEqual({ status: 'all' });
  });

  it('falls back to defaults on malformed JSON', () => {
    expect(parseInitialState('not json')).toEqual({
      activeTab: 'overview',
      filters: { status: 'all' },
    });
  });
});
```

## Checklist

- [ ] `initialState` restored before first meaningful render, not in a
      later effect that races with default rendering
- [ ] `JSON.parse` (or route-string parsing) wrapped in `try`/`catch` with a
      safe fallback — never lets malformed state crash the app
- [ ] Parsed state is merged with defaults, not used as-is
- [ ] Parsing logic extracted into a plain, unit-testable function
- [ ] `connectToHostApp().catch()` handled — app still renders with
      defaults when run standalone (outside Fusion)
- [ ] If shareable URLs are also needed: `syncInternalState` called with
      the full state object on every change, not just the changed field

## Related

- [setup-flows-auth](../setup-flows-auth/SKILL.md) — prerequisite `app-sdk`
  connection.
- [integrate-fusion-agent](../integrate-fusion-agent/SKILL.md) — a
  registered agent resource can expose the same restored state to the
  Atlas sidebar agent.
- [App state in URLs](https://docs.cognite.com/cdf/flows/guides/shareable-app-state-with-urls) —
  full public guide for the `syncInternalState` write side.
