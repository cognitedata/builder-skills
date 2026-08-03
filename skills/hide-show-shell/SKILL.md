---
name: hide-show-shell
description: >-
  MUST be used when a Flows/Fusion app needs full-screen "app-only" mode —
  hiding the Fusion sidebar and topbar so the app gets the whole viewport,
  and giving users a clear way to bring the shell back. Triggers: hideShell,
  full screen app, fullscreen mode, hide sidebar, hide topbar, hide shell,
  hide menu, setHideShell, app-only mode, kiosk mode, custom side nav, full
  viewport.
allowed-tools: Read, Glob, Grep, Edit, Write
---

# Hide & Show the Fusion Shell

Lets a Flows app hide the Fusion sidebar + topbar (the "shell") to use the
full browser viewport, and reveal it again — without leaving the user
stranded.

**Requires `@cognite/app-sdk`'s `connectToHostApp()` handshake already wired
up, and `@cognite/app-sdk >= 0.9.0`.** If auth isn't wired up yet, run the
[setup-flows-auth](../setup-flows-auth/SKILL.md) skill first.

## What it does

`HostAppAPI.setHideShell(hidden: boolean): Promise<void>` (from the `api`
object returned by `connectToHostApp()`):

- `setHideShell(true)` — hides the CDF sidebar and topbar, giving the app the
  full viewport.
- `setHideShell(false)` — reveals them again.

Under the hood this toggles a bookmarkable `?hideShell=true` URL parameter —
no server round-trip, and a shared link already opens in full-screen mode.
The shell also **auto-reveals** if the user navigates away from your app, as
a safety net — but don't rely on that as your only way back.

## When to use it

Good fit:

- Your app renders its **own** side navigation, so the CDF sidebar is
  redundant screen real estate.
- The app needs the full canvas — a dashboard, drawing surface, kiosk-style
  view, etc.

Not a fit:

- Hiding the shell "by default" with no user action — always gate it behind
  an explicit, reversible interaction (a toggle the user clicks), never on
  mount.

## Non-negotiable: always leave a way back

The #1 failure mode of this feature is trapping the user in full-screen with
no visible way to get the CDF navigation back. Every `setHideShell(true)`
call must ship with an equally discoverable reveal control:

- **App has its own side nav** — put a small "Show Cognite menu" control at
  the **bottom** of that nav, in the same spot the CDF sidebar's own
  collapse/expand toggle would be. This is the pattern the platform team
  converged on for Flows apps.
- **App has no side nav** — use a persistent, low-key icon button (e.g. fixed
  corner) that's always visible, not something that only appears on hover.
  Hover-only affordances don't work on touch/mobile.
- Icon-only toggles need an `aria-label` (e.g. `"Hide Cognite menu"` /
  `"Show Cognite menu"`) — don't ship an icon button screen readers can't
  interpret. A button with visible label text already has an accessible name
  and doesn't need one.

## Step 1 — Add the toggle

```tsx
import { useState } from 'react';
import type { HostAppAPI } from '@cognite/app-sdk';
import { Button } from '@cognite/aura/components/button';
import { IconArrowsMaximize, IconArrowsMinimize } from '@tabler/icons-react';

function FullScreenToggle({ api }: { api: HostAppAPI | null }) {
  const [isHidden, setIsHidden] = useState(false);

  async function toggle() {
    const next = !isHidden;
    setIsHidden(next);
    await api?.setHideShell(next);
  }

  return (
    <Button variant="secondary" size="sm" onClick={toggle}>
      {isHidden ? <IconArrowsMinimize aria-hidden /> : <IconArrowsMaximize aria-hidden />}
      {isHidden ? 'Show Cognite menu' : 'Hide Cognite menu'}
    </Button>
  );
}
```

Place `<FullScreenToggle api={api} />` wherever your best-practice placement
(above) calls for it — bottom of your custom nav, or a fixed corner control.

## Step 2 — Handle the case where the shell doesn't hide

Three conditions must **all** be true for `setHideShell(true)` to actually
hide anything:

1. The `NAVIGATION_HIDE_SHELL` Unleash flag is enabled for the environment.
2. Your app is the active route the shell recognizes as a managed Flows app.
3. Nothing else on the page has already re-shown the shell (e.g. the user
   navigated to a different Fusion area, which auto-reveals it).

Don't build extra fallback UI for the "flag off" case — the call is a no-op
and the shell simply stays visible. Just don't assume the toggle always
visibly does something in every environment while testing.

## Step 3 — Test both directions

- Click "Hide Cognite menu" → shell disappears, app fills the viewport, the
  URL now has `?hideShell=true`.
- Click "Show Cognite menu" → shell reappears, `hideShell` is removed from
  the URL.
- Reload the page with `?hideShell=true` in the URL → shell starts hidden
  (bookmarkable).
- Navigate to an unrelated Fusion route while hidden → shell auto-reveals.

## Related

- [setup-flows-auth](../setup-flows-auth/SKILL.md) — prerequisite `app-sdk`
  connection.
- [use-topbar](../use-topbar/SKILL.md) — if your app renders its own topbar,
  the shell toggle above is unrelated to (and composes fine with) that
  in-app Aura Topbar.
