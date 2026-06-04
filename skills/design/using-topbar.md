# Using the Topbar

The Topbar is the single, compliant top navigation bar for every authenticated Flows/Fusion app — app mark, breadcrumbs, an optional center control, a right utility strip, and light/dark theming. It ships in the Aura npm package as a compound component.

> Use this file for composition and the layout contract. Use Storybook and the [Aura design system docs](https://cognite-dune-docs.mintlify.app/aura-design-system/index) for exact props, variants, and `size` values — see `storybook-links.md` for the Topbar, Breadcrumb, and Segmented Control URLs.

**Non-negotiables:** exactly one Topbar per page, composed only from Aura Topbar primitives. Never build a custom header, a second header row, or a sidebar for primary navigation. If the package can't be installed, surface the blocker — don't hand-roll a fallback.

---

## Install & setup

`Topbar` lives in the **`@cognite/aura`** npm package (not a separate `@aura/topbar` registry component). Install it like any dependency:

```bash
pnpm add @cognite/aura     # or npm install / yarn add
```

- **Peer deps:** `react ^18.3.1`, `tailwindcss ^4` (optional). Aura is built for Tailwind v4 — there is no `tailwind.config` `darkMode: 'class'` step; dark mode is driven by Aura's stylesheet.
- **Import the styles once** at your app root (e.g. `main.tsx`):

  ```ts
  import '@cognite/aura/styles.css';
  import '@cognite/aura/colors.css';
  ```

- **Import components** from the `@cognite/aura/components` subpath.

If `@cognite/aura` cannot be installed, stop and tell the user exactly what failed. Do not build a custom component or any workaround.

---

## The compound API

The Topbar is composed, not configured by props. Import the parts from `@cognite/aura/components`:

```ts
import {
  Topbar, TopbarLeft, TopbarIcon, TopbarBreadcrumbs, TopbarMetadata,
  TopbarCenter, TopbarRight, TopbarThemeSwitcher, TopbarAction,
  type TopbarTheme, // 'light' | 'dark'
} from '@cognite/aura/components';
```

| Part | Role |
|------|------|
| `Topbar` | Root container — one per page |
| `TopbarLeft` | Left cluster (app mark → breadcrumbs → metadata) |
| `TopbarIcon` | App mark; wraps `Avatar` and controls its size/variant internally — pass the image/icon as children |
| `TopbarBreadcrumbs` | Wraps the `Breadcrumb` composition |
| `TopbarMetadata` | Optional inline status string, left-aligned after the breadcrumb |
| `TopbarCenter` | Optional global nav slot (`Tabs` or `SegmentedControl`) |
| `TopbarRight` | Utility strip |
| `TopbarAction` | Button for Share / Notifications / Atlas (`variant`, `size` — e.g. `variant="ghost" size="icon-sm"`) |
| `TopbarThemeSwitcher` | Built-in theme menu — controlled via `theme` / `onThemeChange` |

Breadcrumbs and the avatar are their own compound sets, also from `@cognite/aura/components`:

- **Breadcrumb:** `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink` (interactive `<a>`), `BreadcrumbPage` (current, non-link), `BreadcrumbPageButton` (object-dropdown trigger), `BreadcrumbSeparator`, `BreadcrumbEllipsis`/`BreadcrumbEllipsisButton`.
- **Avatar:** `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarIcon`. The app-mark colorway is the `variant="fjord"` value (the prop is `variant`, not `colorway`); sizing uses `sizes` (`default | xsm | xxsm` — there is no `"small"`). `TopbarIcon` sets these for the app mark, so you only set them on the standalone user `Avatar`.

---

## Layout contract (three regions)

### Left — `TopbarLeft` (required)

One left-aligned cluster, in order:

1. **App mark** — `TopbarIcon` (renders a fjord `Avatar`). Use the app image/branding from Flows/Fusion config when available.
2. **Breadcrumbs** — every segment is an **interactive link**, never static text.
   - The **app name** is always the first segment. When an object is open, clicking it navigates to the app's home/root. When **no** object is open, the app name is the current location and is **not** a link (use `BreadcrumbPage`).
   - The **object name** appears as the last segment **only** when a specific object is open.
   - An object-level dropdown (rename, duplicate, export, delete…) may hang off the **object name only**, only when an object is open, and may contain **object-scoped actions only**. There is **no dropdown on the app name** — put app-level settings in the content area below the Topbar.
3. **Inline metadata** *(optional)* — `TopbarMetadata`, a plain string (e.g. "Updated 3 hours ago", "Read-only") immediately after the breadcrumb. String only; never centered; omit when unused.

### Middle — `TopbarCenter` (optional, global nav only)

- **Tabs** for mutually exclusive **page-level routes** (one tab = one destination).
- **SegmentedControl** for switching **modes/layouts** within the app (e.g. canvas vs code).
- Always the **small** size to match the bar. Verify the exact `size` value in Storybook.
- Never a sidebar. Never an app-specific **primary CTA** here — primary actions live in the content area **below** the Topbar. Leave empty if the app has one view or no global nav.

### Right — `TopbarRight` (utility strip)

Fixed order when shown — apps choose which controls are visible, but never reorder:

**Share → Notifications → Theme → Atlas → user Avatar**

- **Share** / **Notifications** — `TopbarAction variant="ghost" size="icon-sm"`.
- **Theme** — `TopbarThemeSwitcher` (see below).
- **Atlas** — `TopbarAction variant="secondary" size="sm"` with a leading icon + "Atlas".
- **User Avatar** — a small `Avatar` (`sizes="xsm"`).
- Theme and user Avatar are typically always on for authenticated apps.

---

## Theme switching

`TopbarThemeSwitcher` renders the sun/moon trigger and the Light/Dark menu (with the checkmark on the active row) for you. It's **controlled** — you keep the theme in state and apply the `dark` class; the switcher just reports changes via `onThemeChange`.

```ts
// src/hooks/use-theme-mode.ts
import { useEffect, useState } from 'react';
import type { TopbarTheme } from '@cognite/aura/components';

export function useThemeMode() {
  const [theme, setTheme] = useState<TopbarTheme>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
```

Apply the initial class before render in `main.tsx` to avoid a flash:

```ts
const stored = localStorage.getItem('theme');
if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}
```

If the app already has a theme system (`useTheme`, `ThemeProvider`, etc.), wire `TopbarThemeSwitcher` into that instead of adding a second one.

---

## Composition example

Verify icon and prop names against Storybook — the structure below is the contract; exact props may differ.

```tsx
import {
  Topbar, TopbarLeft, TopbarIcon, TopbarBreadcrumbs, TopbarMetadata,
  TopbarCenter, TopbarRight, TopbarThemeSwitcher, TopbarAction,
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
  Avatar, AvatarImage, AvatarFallback,
} from '@cognite/aura/components';
import { IconShare3, IconBell, IconSparkles } from '@tabler/icons-react'; // verify names
import { useThemeMode } from '@/hooks/use-theme-mode';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeMode();

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <AvatarImage src={appMarkSrc} alt="" />
            <AvatarFallback>AB</AvatarFallback>
          </TopbarIcon>

          <TopbarBreadcrumbs>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">My App</BreadcrumbLink>
                </BreadcrumbItem>
                {/* Render the separator + object segment only when an object is open */}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Root Cause Analysis</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </TopbarBreadcrumbs>

          <TopbarMetadata>Updated 3 hours ago</TopbarMetadata>
        </TopbarLeft>

        {/* Optional: <Tabs size="sm" …/> for routes, or <SegmentedControl …/> for modes */}
        <TopbarCenter />

        <TopbarRight>
          <TopbarAction variant="ghost" size="icon-sm" aria-label="Share"><IconShare3 /></TopbarAction>
          <TopbarAction variant="ghost" size="icon-sm" aria-label="Notifications"><IconBell /></TopbarAction>
          <TopbarThemeSwitcher theme={theme} onThemeChange={setTheme} />
          <TopbarAction variant="secondary" size="sm"><IconSparkles /> Atlas</TopbarAction>
          <Avatar sizes="xsm" variant="fjord">
            <AvatarImage src={userPhotoSrc} alt={userName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </TopbarRight>
      </Topbar>

      <main className="flex-1">
        {/* page content — primary actions for the current screen live here */}
        {children}
      </main>
    </div>
  );
}
```

---

## Decisions to confirm

Before wiring a Topbar, settle these with the user (skip any the app config already answers — `displayName`/`name`, branding, routing):

- **App mark** — branded image from config, or the default fjord Avatar treatment?
- **App structure** — single app name only (no objects), or does it open named objects (canvas, report, …)? This sets the breadcrumb pattern.
- **Object dropdown** — when an object is open, is there an object-scoped action menu on its breadcrumb segment? Which actions?
- **Inline metadata** — any short left-aligned status string after the breadcrumb?
- **Center nav** — none (default), Tabs (routes), or SegmentedControl (modes)? Labels and destinations?
- **Right strip** — which of Share / Notifications / Theme / Atlas / user Avatar are visible? (Order is fixed; theme + avatar are usually on.)
- **Excluded routes** — anywhere the Topbar should *not* render (login/auth, fullscreen flows)? Default is everywhere.

Then confirm: primary/app-specific actions live **below** the Topbar, not in it.

---

## Where the Topbar may be omitted

- Login / auth-only screens
- Fullscreen modal or flows that hide global chrome by design
- Other explicit shell exceptions from the platform team

If unsure whether a route qualifies, **default to including the Topbar**.

---

## Do / Don't

**Do**

- Keep exactly **one** Topbar per page, composed from `@cognite/aura` primitives.
- Use `TopbarIcon` (fjord Avatar) for the app mark at the far left.
- Make every breadcrumb segment an interactive link; link the app name to home only when an object is open.
- Scope the object dropdown to the object name and to object-level actions only.
- Keep inline metadata in the left cluster, after the breadcrumb — never centered.
- Use the center slot for small Tabs (routes) or SegmentedControl (modes) only.
- Respect the fixed right-strip order; ghost icon buttons for Share/Notifications, secondary for Atlas.
- Use `TopbarThemeSwitcher` for theming and apply the `dark` class on change.

**Don't**

- Don't build a custom top bar, a second header row, or fake breadcrumbs outside the Topbar.
- Don't render multiple Topbars on one page (including embedded/nested views).
- Don't use a sidebar for primary navigation — ever.
- Don't put page-specific or app-primary CTAs in the Topbar — they belong below it.
- Don't add a dropdown to the app name, or mix app-level actions into the object dropdown.
- Don't hardcode styles or override Aura token semantics on the Topbar or its children.
- Don't reach for a removed `@aura/topbar` registry component or `@cognite/dune-industrial-components/navigation` (deprecated) — use `@cognite/aura`.

---

## Compliance checklist

- [ ] Exactly **one** Topbar per page, from `@cognite/aura/components`.
- [ ] `@cognite/aura/styles.css` + `@cognite/aura/colors.css` imported once at the app root.
- [ ] Left: `TopbarIcon` app mark → interactive breadcrumbs → optional left-aligned metadata string.
- [ ] App name links to home only when an object is open; object dropdown (if any) on the object segment only, object-scoped actions only.
- [ ] Center: small Tabs or SegmentedControl if present; no sidebar; no primary CTA in the bar.
- [ ] Primary / app-specific actions live in the content area **below** the Topbar.
- [ ] Right strip order when shown: **Share → Notifications → Theme → Atlas → user Avatar** (ghost icon buttons; Atlas secondary).
- [ ] Theme via `TopbarThemeSwitcher`, with the `dark` class applied to `document.documentElement`.

---

## Resources

- Storybook URLs (Topbar, Breadcrumb, Segmented Control): `storybook-links.md`
- [Aura design system docs](https://cognite-dune-docs.mintlify.app/aura-design-system/index) — component APIs, props, foundations
- Component props and exact `size`/`variant` values: Storybook (this file does not duplicate them)
