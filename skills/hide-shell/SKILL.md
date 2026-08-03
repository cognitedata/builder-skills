---
name: hide-shell
description: >-
  Adds full-screen mode to a Flows/Dune app by hiding the Fusion sidebar and
  topbar via api.setHideShell() from @cognite/app-sdk. Use this skill whenever
  a developer wants their app to take over the full viewport, remove the
  navigation sidebar, hide the topbar, toggle full-screen mode, enter
  immersive mode, or use the hideShell API. Always use this skill instead of
  hand-rolling setHideShell calls — it provides the correct hook pattern,
  cleanup on unmount, and a Aura-native toggle button.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

# /hide-shell

Wire full-screen mode into a Flows/Dune app so it can hide the Fusion sidebar
and topbar, giving the app the entire viewport.

**Usage**: `/hide-shell`

---

## How it works

`api.setHideShell(true)` tells the Fusion host to hide its sidebar and topbar
for the current browser tab. Fusion automatically renders a small floating
"reveal shell" button in the corner so users can always restore navigation
without touching the app.

Call `api.setHideShell(false)` to restore the shell programmatically — always
do this on unmount so the shell isn't permanently hidden if the user navigates
to a different app.

---

## Step 0 — Understand the app

Before writing any code, read:

- `package.json` — confirm `@cognite/app-sdk` is installed and check version (≥ 0.7.0 required for `setHideShell`)
- `src/App.tsx` (or main entry) — find where `connectToHostApp` is called and where `api` is held

If `@cognite/app-sdk` is missing or below `0.7.0`, install/upgrade it first:

```bash
pnpm add @cognite/app-sdk@latest   # or npm/yarn
```

---

## Step 1 — Add the `useHideShell` hook

Create (or add to an existing hooks file) `src/hooks/use-hide-shell.ts`:

```typescript
import { useCallback, useEffect, useState } from 'react';
import type { HostAppAPI } from '@cognite/app-sdk';

/**
 * Manages the Fusion shell visibility for full-screen mode.
 *
 * - Calls api.setHideShell(true/false) to toggle the sidebar + topbar.
 * - Restores the shell automatically when the component unmounts so the
 *   shell is never left hidden if the user navigates away.
 *
 * Fusion renders its own floating "reveal" button while the shell is
 * hidden, so no in-app escape hatch is strictly required — but a toggle
 * button improves discoverability.
 */
export function useHideShell(api: HostAppAPI | null) {
  const [shellHidden, setShellHidden] = useState(false);

  const toggle = useCallback(async () => {
    if (!api) return;
    const next = !shellHidden;
    await api.setHideShell(next);
    setShellHidden(next);
  }, [api, shellHidden]);

  const hide = useCallback(async () => {
    if (!api || shellHidden) return;
    await api.setHideShell(true);
    setShellHidden(true);
  }, [api, shellHidden]);

  const reveal = useCallback(async () => {
    if (!api || !shellHidden) return;
    await api.setHideShell(false);
    setShellHidden(false);
  }, [api, shellHidden]);

  // Always restore the shell when the component using this hook unmounts.
  useEffect(() => {
    return () => {
      if (shellHidden && api) void api.setHideShell(false);
    };
  }, [api, shellHidden]);

  return { shellHidden, toggle, hide, reveal };
}
```

---

## Step 2 — Wire up in the component

Import the hook and pass `api` to it. `api` is the `HostAppAPI` instance
returned by `connectToHostApp`; surface it via React context or props so
deep components can reach it.

```typescript
// In a toolbar component, header, or wherever the trigger lives
import { useHideShell } from '../hooks/use-hide-shell';
import type { HostAppAPI } from '@cognite/app-sdk';

function FullScreenToggle({ api }: { api: HostAppAPI | null }) {
  const { shellHidden, toggle } = useHideShell(api);

  if (!api) return null; // running outside Fusion — no-op

  return (
    <button onClick={() => void toggle()} aria-label={shellHidden ? 'Exit full screen' : 'Enter full screen'}>
      {shellHidden ? 'Exit full screen' : 'Enter full screen'}
    </button>
  );
}
```

If the project uses **Aura**, prefer the Aura `Button` and Tabler icons:

```typescript
import { Button } from '@cognite/aura/components/button';
import { IconMaximize, IconMinimize } from '@tabler/icons-react';

function FullScreenToggle({ api }: { api: HostAppAPI | null }) {
  const { shellHidden, toggle } = useHideShell(api);

  if (!api) return null;

  return (
    <Button variant="outline" onClick={() => void toggle()}>
      {shellHidden ? (
        <>
          <IconMinimize aria-hidden className="mr-2 size-4" />
          Exit full screen
        </>
      ) : (
        <>
          <IconMaximize aria-hidden className="mr-2 size-4" />
          Enter full screen
        </>
      )}
    </Button>
  );
}
```

---

## Step 3 — Add tests

Add tests alongside the hook at `src/hooks/use-hide-shell.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HostAppAPI } from '@cognite/app-sdk';
import { useHideShell } from './use-hide-shell';

function makeApi(): Pick<HostAppAPI, 'setHideShell'> {
  return { setHideShell: vi.fn(() => Promise.resolve()) };
}

describe('useHideShell', () => {
  let api: ReturnType<typeof makeApi>;

  beforeEach(() => {
    api = makeApi();
    vi.clearAllMocks();
  });

  it('starts with shell visible', () => {
    const { result } = renderHook(() => useHideShell(api as HostAppAPI));
    expect(result.current.shellHidden).toBe(false);
  });

  it('hides shell on toggle', async () => {
    const { result } = renderHook(() => useHideShell(api as HostAppAPI));
    await act(() => result.current.toggle());
    expect(api.setHideShell).toHaveBeenCalledWith(true);
    expect(result.current.shellHidden).toBe(true);
  });

  it('reveals shell on second toggle', async () => {
    const { result } = renderHook(() => useHideShell(api as HostAppAPI));
    await act(() => result.current.toggle());
    await act(() => result.current.toggle());
    expect(api.setHideShell).toHaveBeenLastCalledWith(false);
    expect(result.current.shellHidden).toBe(false);
  });

  it('restores shell on unmount when hidden', async () => {
    const { result, unmount } = renderHook(() => useHideShell(api as HostAppAPI));
    await act(() => result.current.hide());
    unmount();
    expect(api.setHideShell).toHaveBeenLastCalledWith(false);
  });

  it('does not call setHideShell on unmount when shell is already visible', () => {
    const { unmount } = renderHook(() => useHideShell(api as HostAppAPI));
    unmount();
    expect(api.setHideShell).not.toHaveBeenCalled();
  });

  it('is a no-op when api is null', async () => {
    const { result } = renderHook(() => useHideShell(null));
    await act(() => result.current.toggle());
    expect(result.current.shellHidden).toBe(false);
  });
});
```

---

## Notes

- **Minimum SDK version**: `setHideShell` requires `@cognite/app-sdk` ≥ 0.7.0. Check `package.json` before wiring this up.
- **Running outside Fusion**: `api` is `null` when the app runs standalone (e.g. `vite dev`). The `useHideShell` hook handles `null` gracefully — always guard renders with `if (!api) return null`.
- **One call per tab**: `setHideShell` affects the current browser tab only. Opening the app in a second tab starts with the shell visible.
- **URL param shortcut**: Navigating to the app with `?hideShell=true` in the URL also hides the shell immediately on load — no code required. This is useful for embedding the app in an iframe or sharing a deep link that opens in full-screen mode.
- **Do not use CSS to hide the shell**: Never attempt to hide Fusion's sidebar or topbar via CSS or DOM manipulation. Always go through `api.setHideShell`.
