---
version: alpha
name: Aura
description: Cognite's design system for composable UI primitives in data-heavy industrial software.
colors:
  primary: '#212426'
  secondary: '#E4E6E8'
  tertiary: '#486AED'
  neutral: '#F1F2F3'
  background: '#FFFFFF'
  foreground: '#191B1D'
  alternate-background: '#F9FAFA'
  card-background: '#F9FAFA'
  muted-background: '#F1F2F3'
  muted-foreground: '#6D767E'
  primary-background-hover: '#40464A'
  secondary-background-hover: '#D4D7D9'
  foreground-on-primary: '#F1F2F3'
  secondary-foreground: '#40464A'
  link-foreground: '#486AED'
  border: '#E4E6E8'
  border-emphasized: '#D4D7D9'
  ring: '#7081C7'
  ring-muted: '#B5BEE2'
  info-background: '#D0D6ED'
  info-foreground-on-info: '#32417F'
  success-background: '#BBF3D0'
  success-foreground-on-success: '#0F5026'
  warning-background: '#FFE3A2'
  warning-foreground-on-warning: '#755200'
  destructive-background: '#FCCAD2'
  destructive-foreground-on-critical: '#8D081F'
  overlay-background: '#7C868E80'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: 600
    lineHeight: 44px
    letterSpacing: -0.08px
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: -0.08px
  h2:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 600
    lineHeight: 32px
    letterSpacing: -0.08px
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.04px
  h4:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 500
    lineHeight: 24px
    letterSpacing: -0.04px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: -0.04px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 18px
    letterSpacing: -0.04px
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 14px
    letterSpacing: -0.04px
  code:
    fontFamily: Source Code Pro
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  2xl: 16px
  3xl: 24px
  4xl: 32px
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  3xl: 32px
  prose-max: 600px
  container-2xl: 640px
  container-8xl: 1536px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.foreground-on-primary}'
    rounded: '{rounded.lg}'
    padding: '{spacing.md}'
    height: 36px
  button-primary-hover:
    backgroundColor: '{colors.primary-background-hover}'
  button-secondary:
    backgroundColor: '{colors.secondary}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.lg}'
    padding: '{spacing.md}'
    height: 36px
  button-destructive:
    backgroundColor: '{colors.destructive-background}'
    textColor: '{colors.destructive-foreground-on-critical}'
    rounded: '{rounded.lg}'
    height: 36px
  button-sm:
    height: 28px
    rounded: '{rounded.lg}'
  button-lg:
    height: 40px
    rounded: '{rounded.lg}'
  button-secondary-hover:
    backgroundColor: '{colors.secondary-background-hover}'
  input-default:
    backgroundColor: '{colors.background}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.lg}'
    height: 36px
  input-muted:
    backgroundColor: '{colors.muted-background}'
    textColor: '{colors.muted-foreground}'
    rounded: '{rounded.lg}'
    height: 36px
  dialog-overlay:
    backgroundColor: '{colors.overlay-background}'
  divider-default:
    backgroundColor: '{colors.border}'
  divider-emphasized:
    backgroundColor: '{colors.border-emphasized}'
  badge-neutral:
    backgroundColor: '{colors.neutral}'
    textColor: '{colors.secondary-foreground}'
    rounded: '{rounded.sm}'
  panel-alternate:
    backgroundColor: '{colors.alternate-background}'
    textColor: '{colors.foreground}'
  card-default:
    backgroundColor: '{colors.card-background}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.xl}'
    padding: '{spacing.lg}'
  link-default:
    textColor: '{colors.link-foreground}'
    typography: '{typography.body-md}'
  badge-xs:
    height: 20px
    rounded: '{rounded.sm}'
  alert-info:
    backgroundColor: '{colors.info-background}'
    textColor: '{colors.info-foreground-on-info}'
    rounded: '{rounded.lg}'
  alert-success:
    backgroundColor: '{colors.success-background}'
    textColor: '{colors.success-foreground-on-success}'
    rounded: '{rounded.lg}'
  alert-warning:
    backgroundColor: '{colors.warning-background}'
    textColor: '{colors.warning-foreground-on-warning}'
    rounded: '{rounded.lg}'
  alert-destructive:
    backgroundColor: '{colors.destructive-background}'
    textColor: '{colors.destructive-foreground-on-critical}'
    rounded: '{rounded.lg}'
---

## Overview

Aura is the official design system for Cognite experiences: composable UI primitives for data-heavy industrial software.

Aura should feel like an **industrial control room**: quiet surfaces, stable hierarchy, immediate status signals, and controls that stay out of the operator's way until action is needed. The interface is engineered, not decorated. It gives dense operational data enough structure to scan quickly, reserves color for meaning, and makes interaction states predictable under pressure.

Light and dark themes share the same semantic roles; fixed tokens support persistent shell chrome.

**Tokens:** Reference values live in the YAML front matter at the top of this file. They provide context for agents and humans — the prose sections below carry design intent, constraints, and reasoning. Reference tokens in prose as `{colors.<name>}`, `{spacing.<name>}`, `{typography.<name>}`, `{rounded.<name>}`, and `{components.<name>}`.

**Implementation:** Package imports, component APIs, and host-shell integration live in the Aura [README](./README.md) — not in this file.

### For agents: how to read this file

Before editing or generating from this file, read Google's [DESIGN.md Philosophy](https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md). The philosophy applies directly to how Aura's spec should be used:

1. **Start with prose, not tokens.** The quality of generated UI depends more on understanding _intent_ than on copying hex values. Read **Overview**, **Do's and Don'ts**, **Heuristics**, **Interaction states**, and **Content** before implementing from the YAML block. Use **Heuristics** for detailed feedback, disclosure, error, layout, and accessibility decisions.
2. **Tokens are context, not rendering instructions.** YAML values anchor names and approximate light-theme references. Runtime styling comes from `@cognite/aura/colors.css`, `@cognite/aura/styles.css`, and component APIs — not from reimplementing token literals in product code.
3. **Prefer specific constraints over adjectives.** Aura targets data-heavy industrial software: flat hierarchy, semantic color only for status and feedback, predictable interaction states, and calm surfaces. When prose and a token disagree, follow the prose rationale.
4. **Negative constraints matter.** **Do's and Don'ts** and the **Avoid** / **Must not** rules in Heuristics define character as much as the palette.
5. **Extension sections are intentional.** Sections beyond the core design.md spec order — **Assets & Motion**, **Heuristics**, **Interaction states**, **Content** — extend the format for Aura. UX playbook guidance lives in this file.

### Alignment with Google design.md

| Philosophy principle                  | Aura approach                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Prose carries design intent           | Overview, colors, interaction states, content, and do's/don'ts are the primary identity guidance         |
| Tokens referenced in prose            | Key roles use `{colors.*}`, `{spacing.*}`, etc. inline; full ramps stay in tables and CSS                |
| Specific reference > vague adjectives | Overview names data-heavy industrial UI; heuristic rules carry constraints                               |
| Do's and don'ts as guardrails         | Dedicated **Do's and Don'ts** section plus compact severity-rated heuristics                             |
| Format extends beyond the spec        | Motion, iconography, elevation, copy, accessibility, and extended UX guidance live in extension sections |

---

## Colors

Aura color behaves like instrumentation in a control room. Most of the interface is neutral structure; important changes appear as clear signals; decorative color is rare and never competes with status. A screen should still make sense when color is removed, but color should make state faster to recognize.

Use **Base** color for the operating surface: page backgrounds, cards, text, borders, focus, and persistent chrome. This is ~80–90% of the UI.

Use **Semantic** color only for status and feedback: info, success, warning, destructive, validation, and operational state. This is ~5–10% of the UI.

Use **Decorative** color only for non-status differentiation: accents, avatars, illustrations, and small visual markers that do not imply system health. This is ~5–10% of the UI.

Light-theme reference values for key roles are defined as `colors.*` tokens in the YAML front matter (referenced in tables as `{colors.<name>}`); full ramps and dark-theme values are in the tables below.

Do not hardcode hex, font sizes, or shadow strings in product UI when a token exists.

Aura supports **light** (`:root`) and **dark** (`.dark` / `prefers-color-scheme: dark` per library setup). Semantic and base tokens **resolve to different ramps** per theme. **`background-fixed-dark`**, **`background-fixed-light`**, **`foreground-fixed-*`**, and related **fixed** tokens keep the same appearance in both themes (persistent chrome such as sidebars). Always verify contrast in both themes before shipping.

Reference tokens by **full CSS name** or Tailwind token. Never use raw `hex` / `rgb` / `hsl` in product code. If no semantic token fits, use a documented **base** token; **step colors** on ramps (`mountain/*`, `fjord/*`, …) are only for custom, branding, or marketing surfaces where no semantic token exists yet.

### Common Tailwind mappings

Tables in this section use **CSS role names** (e.g. `link-foreground`, `card-background`). Each role maps to a `--color-{role}` custom property and Tailwind v4 utilities (`text-{role}`, `bg-{role}`, `border-{role}`, and `ring-{role}` where applicable). Prefer these utilities over raw `var(--…)` when the theme wire-up matches.

| Role (suffix after `text-` / `bg-` / `border-`) | Typical utilities                                                                   | Notes                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `background`                                    | `bg-background`                                                                     | Page base                                             |
| `foreground`                                    | `text-foreground`                                                                   | Primary text                                          |
| `muted-foreground`                              | `text-muted-foreground`                                                             | Tertiary copy                                         |
| `card-background`                               | `bg-card-background`                                                                | Cards (see **Card** component)                        |
| `muted-background`                              | `bg-muted-background`                                                               | Static fills, inputs, secondary chrome                |
| `border`                                        | `border-border`                                                                     | Default strokes                                       |
| `link-foreground` (`{colors.link-foreground}`)  | `text-link-foreground`                                                              | Text links — same value as `{colors.tertiary}`        |
| `primary-background`                            | `bg-primary-background`, `text-foreground-on-primary`                               | Default **Button** (`variant="default"`) pattern      |
| `destructive-background`                        | `bg-destructive-background`, `text-destructive-foreground-on-critical` (on surface) | Destructive actions — pairings in **Semantic colors** |
| `info-background`, `success-background`, …      | `bg-info-background`, `text-info-foreground`, …                                     | Full names match **Semantic colors** token columns    |

Semantic utilities use the **full token name** as the Tailwind segment (e.g. `bg-info-background`, not `bg-info`). For **charts**, utilities follow the **Chart tokens** names (`bg-chart-fjord-color-1`, `bg-chart-gridlines`, …).

Tables below list **light-theme** values as `{colors.<name>}` token references in the YAML front matter and **dark-theme** resolved values in the second column; the published `colors.css` is the runtime source of truth (some entries are `rgba()`).

### Base — Background

| Token                           | Light (reference)                     | Dark (reference) | Use                                                                |
| ------------------------------- | ------------------------------------- | ---------------- | ------------------------------------------------------------------ |
| `background`                    | `{colors.background}`                 | `#191B1D`        | Primary surface — lowest layer                                     |
| `alternate-background`          | `{colors.alternate-background}`       | `#111213`        | Distinct layer or block separate from `background`                 |
| `card-background`               | `{colors.card-background}`            | `#212426`        | Cards without drop shadow on `background` / `alternate-background` |
| `muted-background`              | `{colors.muted-background}`           | `#2D3134`        | Static fills for controls, rows, segmented controls                |
| `primary-background`            | `{colors.primary}`                    | `#F9FAFA`        | Primary actions (default button); use sparingly                    |
| `primary-background-hover`      | `{colors.primary-background-hover}`   | `#E4E6E8`        | Hover on `primary-background`                                      |
| `secondary-background`          | `#E4E6E8`                             | `#40464A`        | Secondary actions, switch track                                    |
| `secondary-background-hover`    | `{colors.secondary-background-hover}` | `#5E666D`        | Hover on `secondary-background`                                    |
| `accent-background`             | `#F1F2F3`                             | `#2D3134`        | Neutral hover on `background` / `card-background` (e.g. tabs)      |
| `accent-background-strong`      | `#E4E6E8`                             | `#40464A`        | Neutral hover on `muted-background` / `active-muted-background`    |
| `highlight-background`          | `#F1F2F3`                             | `#2D3134`        | Focused / active fields (inputs, selects, comboboxes)              |
| `highlight-background-strong`   | `#E4E6E8`                             | `#40464A`        | Stronger focused / active field fill                               |
| `active-background`             | `#191B1D`                             | `#F9FAFA`        | High-contrast “on” (switch, checkbox, radio)                       |
| `active-background-hover`       | `#2D3134`                             | `#F1F2F3`        | Hover on `active-background`                                       |
| `active-muted-background`       | `#F1F2F3`                             | `#2D3134`        | Lower-contrast selected (e.g. tabs)                                |
| `active-muted-background-hover` | `#E4E6E8`                             | `#40464A`        | Hover on `active-muted-background`                                 |
| `popover-background`            | `#FFFFFF`                             | `#212426`        | Top-layer surfaces with shadow (dialogs, popovers)                 |
| `raised-background`             | `#2D3134`                             | `#40464A`        | Tooltips, Sonner toasts — floats above page                        |
| `disabled-background`           | `#F1F2F3`                             | `#2D3134`        | Disabled inputs and controls                                       |
| `overlay-background`            | `{colors.overlay-background}`         | `#7C868E80`      | Scrim behind modals                                                |
| `background-fixed-dark`         | `#212426`                             | `#212426`        | Must stay **dark** in both themes                                  |
| `background-fixed-light`        | `#FFFFFF`                             | `#FFFFFF`        | Must stay **light** in both themes                                 |
| `accent-background-fixed-dark`  | `#2D3134`                             | `#2D3134`        | Persistent dark accent chrome (e.g. sidebar)                       |

### Base — Foreground

| Token                              | Light (reference)                | Dark (reference) | Use                            |
| ---------------------------------- | -------------------------------- | ---------------- | ------------------------------ |
| `foreground`                       | `{colors.foreground}`            | `#F1F2F3`        | Primary text and icons         |
| `secondary-foreground`             | `{colors.secondary-foreground}`  | `#D4D7D9`        | Supporting text and icons      |
| `muted-foreground`                 | `{colors.muted-foreground}`      | `#A5ABB1`        | Tertiary / low emphasis        |
| `disabled-foreground`              | `#D4D7D9`                        | `#5E666D`        | Disabled text and icons        |
| `link-foreground`                  | `{colors.link-foreground}`       | `#1742E7`        | Text links                     |
| `foreground-on-primary`            | `{colors.foreground-on-primary}` | `#191B1D`        | On `primary-background`        |
| `foreground-on-active`             | `#F1F2F3`                        | `#191B1D`        | On `active-background`         |
| `active-foreground`                | `#191B1D`                        | `#F1F2F3`        | On `active-muted-background`   |
| `foreground-fixed-dark`            | `#191B1D`                        | `#191B1D`        | Must stay dark in both themes  |
| `foreground-fixed-light`           | `#FFFFFF`                        | `#FFFFFF`        | Must stay light in both themes |
| `foreground-secondary-fixed-dark`  | `#40464A`                        | `#40464A`        | Secondary copy, always dark    |
| `secondary-foreground-fixed-light` | `#D4D7D9`                        | `#D4D7D9`        | Secondary copy, always light   |
| `muted-foreground-fixed-light`     | `#BBC0C4`                        | `#BBC0C4`        | Muted copy, always light       |

### Base — Borders and focus

| Token               | Light (reference)            | Dark (reference) | Use                                              |
| ------------------- | ---------------------------- | ---------------- | ------------------------------------------------ |
| `border`            | `{colors.border}`            | `#2D3134`        | Default strokes                                  |
| `border-emphasized` | `{colors.border-emphasized}` | `#40464A`        | Stronger separation                              |
| `border-on-dark`    | `#2D3134`                    | `#2D3134`        | Strokes on dark chrome (both themes)             |
| `border-active`     | `#191B1D`                    | `#F9FAFA`        | Active / toggled outlines                        |
| `ring`              | `{colors.ring}`              | `#7081C7`        | Focus ring outer (maps to `--shadow-focus-ring`) |
| `ring-muted`        | `{colors.ring-muted}`        | `#B5BEE2`        | Focus ring inner companion                       |

Also generated: `ring-destructive`, `ring-destructive-muted` for destructive / invalid focus (see **Effects — Focus rings**).

### Semantic colors

Semantic tokens are **only** for status and system feedback (Alert, Banner, Sonner, badge status variants, validation). Do not use them as generic fills or decoration.

Each family has **default** pairings (theme-switching surfaces) and **muted** pairings (blocks on **persistent dark chrome**). On muted surfaces, use the same `*-foreground-on-*` token names with the muted background; verify contrast in context.

**Info**

| Token                     | Light (reference)                  | Dark (reference) | Use                                                                           |
| ------------------------- | ---------------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| `info-background`         | `{colors.info-background}`         | `#B5BEE2`        | Info surface                                                                  |
| `info-background-hover`   | `#B5BEE2`                          | `#D0D6ED`        | Hover on `info-background`                                                    |
| `info-foreground`         | `#4A5FB8`                          | `#9DA9D9`        | Text near info context on standard surfaces                                   |
| `info-foreground-on-info` | `{colors.info-foreground-on-info}` | `#1A2242`        | Text **on** `info-background`                                                 |
| `info-muted-background`   | `#F0F2F9`                          | `#2D3134`        | Info tint on dark chrome                                                      |
| _(pairing)_               | —                                  | —                | On `info-muted-background`, use `info-foreground-on-info` for on-surface copy |

**Success**

| Token                           | Light (reference)                        | Dark (reference) | Use                                                                |
| ------------------------------- | ---------------------------------------- | ---------------- | ------------------------------------------------------------------ |
| `success-background`            | `{colors.success-background}`            | `#8BDEAE`        | Success surface                                                    |
| `success-background-hover`      | `#8BDEAE`                                | `#BBF3D0`        | Hover on `success-background`                                      |
| `success-foreground`            | `#1C984A`                                | `#24C45E`        | Text near success on standard surfaces                             |
| `success-foreground-on-success` | `{colors.success-foreground-on-success}` | `#0A381C`        | Text **on** `success-background`                                   |
| `success-muted-background`      | `#DDF9E7`                                | `#2D3134`        | Success on dark chrome                                             |
| _(pairing)_                     | —                                        | —                | On `success-muted-background`, use `success-foreground-on-success` |

**Warning**

| Token                           | Light (reference)                        | Dark (reference) | Use                                    |
| ------------------------------- | ---------------------------------------- | ---------------- | -------------------------------------- |
| `warning-background`            | `{colors.warning-background}`            | `#FFE3A2`        | Warning surface                        |
| `warning-background-hover`      | `#FFD062`                                | `#FFF1D0`        | Hover on `warning-background`          |
| `warning-foreground`            | `#C18800`                                | `#D8BF00`        | Text near warning on standard surfaces |
| `warning-foreground-on-warning` | `{colors.warning-foreground-on-warning}` | `#5B4000`        | Text **on** `warning-background`       |
| `warning-muted-background`      | `#FFF1D0`                                | `#2D3134`        | Warning on dark chrome                 |

**Destructive**

| Token                                | Light (reference)                             | Dark (reference) | Use                                                |
| ------------------------------------ | --------------------------------------------- | ---------------- | -------------------------------------------------- |
| `destructive-background`             | `{colors.destructive-background}`             | `#FAA9B7`        | Error / destructive surface                        |
| `destructive-background-hover`       | `#FAA9B7`                                     | `#FCCAD2`        | Hover on `destructive-background`                  |
| `destructive-foreground`             | `#CB0B2C`                                     | `#F65E78`        | Text near destructive context on standard surfaces |
| `destructive-foreground-on-critical` | `{colors.destructive-foreground-on-critical}` | `#8D081F`        | Text **on** `destructive-background`               |
| `destructive-muted-background`       | `#FDDEE4`                                     | `#2D3134`        | Destructive on dark chrome                         |
| `destructive-muted-background-hover` | `#FCCAD2`                                     | `#40464A`        | Hover on `destructive-muted-background`            |

**Neutral** (status: draft, archived — not “semantic calm” in the same sense as info/success)

| Token                           | Light (reference) | Dark (reference) | Use                              |
| ------------------------------- | ----------------- | ---------------- | -------------------------------- |
| `neutral-background`            | `#E4E6E8`         | `#D4D7D9`        | Neutral status surface           |
| `neutral-background-hover`      | `#D4D7D9`         | `#E4E6E8`        | Hover on `neutral-background`    |
| `neutral-foreground`            | `#52595F`         | `#A5ABB1`        | Text near neutral status         |
| `neutral-foreground-on-neutral` | `#40464A`         | `#2D3134`        | Text **on** `neutral-background` |
| `neutral-muted-background`      | `#F1F2F3`         | `#2D3134`        | Neutral on dark chrome           |

**Naming:** CSS uses full role names (`info-foreground-on-info`, `neutral-foreground-on-neutral`, `destructive-foreground-on-critical`). There is no shortened alias in the theme.

### Decorative colors

For **small accents** (badges, avatars, empty states) where color differentiates but does **not** signal status — use **Chart tokens** for plot colors, not this ramp, unless a design explicitly maps a tile to a series color. Pattern: `decorative-background-{ramp}`, `decorative-background-{ramp}-hover`, `decorative-foreground-{ramp}`.

**Preference order for new work:**

| Priority | Ramp     | Background                       | Foreground                       |
| -------- | -------- | -------------------------------- | -------------------------------- |
| 1        | Fjord    | `decorative-background-fjord`    | `decorative-foreground-fjord`    |
| 2        | Nordic   | `decorative-background-nordic`   | `decorative-foreground-nordic`   |
| 3        | Aurora   | `decorative-background-aurora`   | `decorative-foreground-aurora`   |
| 4        | Dusk     | `decorative-background-dusk`     | `decorative-foreground-dusk`     |
| 5        | Orange   | `decorative-background-orange`   | `decorative-foreground-orange`   |
| 6        | Sky      | `decorative-background-sky`      | `decorative-foreground-sky`      |
| 7        | Mountain | `decorative-background-mountain` | `decorative-foreground-mountain` |

Example (fjord ramp): light `decorative-background-fjord` → `#CCD5FA` (fjord-200), `decorative-foreground-fjord` → `#1234B6` (fjord-700); dark → `#AEBDF7` / `#0D2582` (fjord-300 / fjord-800).

### Chart tokens

**Priority rule:** use `chart-*` for any data plotted on axes or series; use `decorative-*` for non-data visual differentiation (tiles, avatars, accents); use semantic tokens (`info-*`, `success-*`, `warning-*`, `destructive-*`) for operational status and feedback only. Never swap between these groups.

| Token                                           | Use                                                         |
| ----------------------------------------------- | ----------------------------------------------------------- |
| `chart-{ramp}-color-1` … `chart-{ramp}-color-6` | Alpha-based series / area-fill steps (strongest → lightest) |
| `chart-gridlines`                               | Grid lines                                                  |

Default series order: **fjord → nordic → aurora → dusk → orange**.

---

## Typography

Aura uses **Inter** for product UI, **Space Grotesk** for marketing display, and **Source Code Pro** for monospace. The type scale balances density for data interfaces with readable body copy at `{typography.body-md.fontSize}`.

| Token                          | Font            | Use                                 |
| ------------------------------ | --------------- | ----------------------------------- |
| `--font-sans` / `--font-inter` | Inter           | Default UI — copy, labels, dense UI |
| `--font-marketing`             | Space Grotesk   | Marketing / display headings only   |
| `--font-mono`                  | Source Code Pro | Code, technical strings             |

**Type scale** — values live in the YAML `typography` tokens. Typical **semantic styles** map as follows:

| Style     | Token                  | Tailwind class | Use                      |
| --------- | ---------------------- | -------------- | ------------------------ |
| `display` | `{typography.display}` | `text-5xl`     | Hero / marketing display |
| `h1`      | `{typography.h1}`      | `text-4xl`     | Page title               |
| `h2`      | `{typography.h2}`      | `text-3xl`     | Section title            |
| `h3`      | `{typography.h3}`      | `text-2xl`     | Subsection               |
| `h4`      | `{typography.h4}`      | `text-xl`      | Group label              |
| `body-md` | `{typography.body-md}` | `text-base`    | Default body             |
| `body-sm` | `{typography.body-sm}` | `text-sm`      | Secondary body           |
| `label`   | `{typography.label}`   | `text-xs`      | Form labels, compact UI  |
| `code`    | `{typography.code}`    | `text-sm`      | Monospace content        |

---

## Layout

### Dashboard quick start (agent checklist)

For pages with data-heavy layouts — cards, charts, metric tiles — work through these steps before writing component code.

- [ ] **Tokens** — confirm all colors use semantic or chart tokens, no raw hex. Metric tiles: `decorative-*`. Data series: `chart-*`. Status: `info-*`, `success-*`, `warning-*`, `destructive-*`. See [Colors](#colors).
- [ ] **Layout** — use a 12-column grid with `gap-4` or `gap-6`. Tile widths: `col-span-12 sm:col-span-6 lg:col-span-3`. Cap the page frame with `max-w-[min(100%,var(--container-8xl))]`.
- [ ] **Cards** — use the `Card` component with title, description, and a primary action. Do not stack unrelated actions in the same card. See [Layout and hierarchy](#6-layout-and-hierarchy).
- [ ] **Loading states** — every data region must show `Shimmer` (known layout) or `Loader` (unknown layout) while fetching. See [Feedback and system status](#1-feedback-and-system-status).
- [ ] **Status signals** — default to **Badge** or compact status cards for repeated states; keep **Alert** to one page-level inline instance unless multiple independent incidents each need separate action. See [Alert vs Banner vs Badge vs Sonner](#alert-vs-banner-vs-badge-vs-sonner).
- [ ] **Navigation** — one primary app chrome; avoid duplicating global navigation inside content. See [Layout and hierarchy](#6-layout-and-hierarchy).
- [ ] **Accessibility** — every chart must have a text summary of key insights. Icon-only controls must have `aria-label` and a `Tooltip`. See [Accessibility and inclusive design](#7-accessibility-and-inclusive-design).

### Layout and spacing

Width and spacing values in this subsection follow the **`{spacing.base}`-based** spacing scale in **[Layout → Size and dimensions](#size-and-dimensions)**.

**Body text reading width**

- **Must** cap **continuous body text** (paragraphs, descriptions, long labels) at a **maximum width of `{spacing.prose-max}`** for comfortable reading.
- **Must** apply that limit to the **text column only** — companion UI (icons, thumbnails, side metadata, charts, code blocks) **may** sit outside that `{spacing.prose-max}` band in the same row or card; do not shrink the text measure to absorb those elements.
- **Should** implement the cap with `max-w-[{spacing.prose-max}]` / `max-w-[37.5rem]` (or an equivalent layout wrapper) on the text block, not by stretching typography alone inside an arbitrarily wide container.

Standard layout primitives used across all patterns:

**Content max widths**
- max-w-7xl — dashboards, full-width layouts
- max-w-4xl — detail pages
- max-w-2xl — forms, wizard step content
- max-w-sm — search inputs, narrow controls

**Section spacing**
- space-y-8 — between major page sections (e.g. form groups)
- space-y-6 — between sections within a page
- space-y-4 — between items within a section
- space-y-2 — between label and field, tight groupings

**Grid gaps**
- gap-6 — dashboard grids, chart grids, panel gaps
- gap-4 — card grids, metric grids
- gap-3 — toolbar items, button groups

**Page padding**
- px-6 py-8 — standard content area (desktop)
- px-4 py-6 — mobile content area
- p-4 — card/panel internal padding
- p-6 — larger card internal padding

### Layout patterns

#### Sidebar content
3+ top-level sections. Persistent navigation needed.
Most common for multi-page apps.

**Structure**

```
┌──────────┬─────────────────────────────┐
│          │  Page Header / Breadcrumb   │
│  Sidebar │─────────────────────────────│
│   Nav    │                             │
│  (dark)  │  Main Content Area          │
│          │  (bg-background)            │
│          │                             │
└──────────┴─────────────────────────────┘
```

**Responsive behavior**
Desktop (1440px+): Sidebar 240px, content fills rest.
Tablet (768px-1439px): Sidebar collapsible via hamburger.
Mobile (below 768px): Sidebar hidden. Hamburger menu.
  Consider bottom nav for 3-5 primary sections.

#### Full-width dashboard
Data visualizations, metrics, monitoring. Maximum horizontal space needed.

**Structure**

```
┌─────────────────────────────────────────┐
│  Top Navigation Bar                      │
├─────────────────────────────────────────┤
│  Page Header + Filters                   │
├─────────────────────────────────────────┤
│  ┌───────┐  ┌───────┐  ┌───────┐       │
│  │Metric │  │Metric │  │Metric │       │
│  └───────┘  └───────┘  └───────┘       │
├─────────────────────────────────────────┤
│  Charts / Visualizations                 │
├─────────────────────────────────────────┤
│  Data Table                              │
└─────────────────────────────────────────┘
```

**Responsive behavior**
Desktop: Multi-column grid (grid-cols-3 or grid-cols-4).
Tablet: 2-column grid. Charts stack.
Mobile: Single column. Metrics as horizontal scroll.

#### Form page
Data entry, creation flows, configuration, settings with form fields.

**Structure**

```
┌─────────────────────────────────────────┐
│  Page Header + Back navigation           │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────┐      │
│  │  Form Section 1 (heading)     │      │
│  │  [fields]                     │      │
│  ├───────────────────────────────┤      │
│  │  Form Section 2 (heading)     │      │
│  │  [fields]                     │      │
│  └───────────────────────────────┘      │
├─────────────────────────────────────────┤
│  Sticky footer: [Cancel]  [Save action] │
└─────────────────────────────────────────┘
```

**Responsive behavior**
Desktop: Form centered, max-w-2xl (672px) or max-w-3xl.
Tablet: Form fills width with px-6 padding.
Mobile: Full width. Sticky footer stays. Fields stack.

#### Detail page

Viewing a single record: report details, user profile, item information with related data.

**Structure**

```
┌─────────────────────────────────────────┐
│  Breadcrumb: Reports > Q2 Summary        │
├─────────────────────────────────────────┤
│  Record Header [Title, status, actions]  │
├─────────────────────────────────────────┤
│  ┌─────────────────┬───────────────┐    │
│  │  Main Content    │  Sidebar      │    │
│  │  (2/3 width)     │  (1/3 width)  │    │
│  └─────────────────┴───────────────┘    │
└─────────────────────────────────────────┘
```

**Responsive behavior**
Desktop: Two-column (grid-cols-3, main span-2, sidebar span-1).
Tablet: Sidebar below main content.
Mobile: Single column. Sidebar collapses.


#### Settings page
App preferences, account settings, notification config.

**Structure**

```
┌─────────────────────────────────────────┐
│  Page Header: Settings                   │
├───────────┬─────────────────────────────┤
│  Settings │  Section Content            │
│   Nav     │  [Form fields / toggles]    │
└───────────┴─────────────────────────────┘
```

**Responsive behavior**
Desktop: Left nav + content area.
Tablet: Top tabs replacing left nav.
Mobile: Category list → tap opens section full-screen.

#### Split screen
Comparison views, editor + preview, master-detail with equal emphasis on both sides.

**Structure**

```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│   Panel Left        │   Panel Right       │
│   (1/2 width)       │   (1/2 width)       │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

**Responsive behavior**
Desktop: grid-cols-2, equal columns.
Tablet: grid-cols-2 with narrower gap.
Mobile: Stack vertically (grid-cols-1), or use Segmented Control to switch between panels.


#### Three panel
Navigation + content + properties panel. IDE-style layouts. Complex editing workflows with context panels.

**Structure**

```
┌──────────┬───────────────────┬──────────┐
│          │                   │          │
│  Nav/    │   Main Content    │  Props/  │
│  Tree    │   (flexible)      │  Detail  │
│  (fixed) │                   │  (fixed) │
│          │                   │          │
└──────────┴───────────────────┴──────────┘
```

**Responsive behavior**
Desktop (1440px+): All 3 panels visible.
Tablet (768-1439px): Hide right panel, toggle via button.
Mobile (below 768px): Single panel with navigation as Drawer, right panel as bottom sheet or separate route.

#### List page
Browsing collections — reports, users, assets, items. The most common page type in data-heavy applications.


**Structure**

```
┌──────────────────────────────────────────┐
│  Page Header [Title]    [Create button]  │
├──────────────────────────────────────────┤
│  Filters toolbar  [Search] [Filters]     │
├──────────────────────────────────────────┤
│  Table / List                            │
│  (with empty state when no data)         │
├──────────────────────────────────────────┤
│  Pagination                              │
└──────────────────────────────────────────┘
```

**Responsive behavior**
Desktop: Full table with all columns visible.
Tablet: Hide non-essential columns, allow horizontal scroll.
Mobile: Switch to card/list view with stackable filters.

#### Wizard
Multi-step creation flows, onboarding, configuration wizards, setup processes.


**Structure**

```
┌──────────────────────────────────────────┐
│  Step indicator (1 — 2 — 3 — 4)         │
├──────────────────────────────────────────┤
│                                          │
│   Step Content Area                      │
│   (centered, max-w-2xl)                  │
│                                          │
├──────────────────────────────────────────┤
│  [Back]                    [Next/Submit] │
└──────────────────────────────────────────┘
```

**Responsive behavior**
Desktop: Centered content, horizontal numbered step indicator.
Tablet: Same layout with px-6 padding.
Mobile: Step indicator becomes compact ("Step 2 of 4"), content fills width.

### Size and dimensions

Aura aligns to a **`{spacing.base}` base grid**. Spacing in components follows **Tailwind spacing** (`p-*`, `gap-*`, `m-*`): one unit = **`{spacing.base}`** unless overridden. Common steps:

| Name | Token           | Tailwind | Typical use                      |
| ---- | --------------- | -------- | -------------------------------- |
| xs   | `{spacing.xs}`  | `1`      | Tight gaps, icon padding         |
| sm   | `{spacing.sm}`  | `2`      | Inline controls, compact padding |
| md   | `{spacing.md}`  | `3`      | Card / popover internal padding  |
| lg   | `{spacing.lg}`  | `4`      | Related groups                   |
| xl   | `{spacing.xl}`  | `5`      | Sections                         |
| 2xl  | `{spacing.2xl}` | `6`      | Page regions                     |
| 3xl  | `{spacing.3xl}` | `8`      | Large layout gaps                |

Layout helpers in theme: `--container-2xl` (`{spacing.container-2xl}`), `--container-8xl` (`{spacing.container-8xl}`), `--message-content-max-width` (80% for chat content).

### Width and max content

Aura adjusts Tailwind **container** breakpoints where the default scale is too wide or too narrow for data-dense product surfaces:

| Token             | Value                     | Role                                                                                                                                                                        |
| ----------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--container-2xl` | `{spacing.container-2xl}` | Narrower than Tailwind’s default `2xl` container — useful outer bound for regions; **body copy** inside can still follow the **`{spacing.prose-max}`** reading rule above   |
| `--container-8xl` | `{spacing.container-8xl}` | Wide upper bound for dashboards and full-bleed marketing rows                                                                                                               |

Prefer **`max-w-*`** (and other width utilities) tied to the theme over ad-hoc pixel `max-width` on wrappers. **Global frame** width (host chrome) is defined by the **host application**; **inside** the frame, combine these tokens with responsive utilities so regions reflow predictably.

### Specialized variables

| Variable                      | Value                                           | Use                                                                             |
| ----------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| `--message-content-max-width` | `80%`                                           | Primary column for chat / assistant **Message** content in wide threads         |
| `--drawer-max-height`         | `80vh`                                          | Maximum height for top/bottom drawer-style panels when the host implements them |
| `--alert-icon-width`          | `calc(var(--spacing) * 4)` (typically **16px**) | Fixed icon column in the **Alert** layout so titles and descriptions align      |

### Regional spacing

- **Must** use the **spacing scale** for padding, margin, and `gap` between regions (`gap-*`, `p-*`, `m-*`) — see **Layout → Size and dimensions**.
- **Should** keep major block **padding** and **gap** on **`{spacing.base}`** multiples so control heights, radii, and typography line up visually.
- **Should** group related regions in **Card** (and **Separator** when two unrelated groups share a container) before mixing unrelated actions into the same band — see [Layout and hierarchy](#6-layout-and-hierarchy).
- **Avoid** one-off pixel gutters that ignore the scale unless matching a fixed graphic asset.

### Responsive behavior

- **Should** move secondary work into **Dialog** or a shell **Drawer** on narrow widths instead of compressing multi-column chrome.
- **Avoid** single-breakpoint layouts tuned only to a static design frame — use breakpoints, wrapping, and flexible sizing utilities where content must grow and shrink.

### Shell vs content

**Global chrome** (workspace switcher, app-level navigation) is implemented by the **host application shell**, not the Aura component library. **Must** still theme that chrome with Aura **tokens** so shell and in-app surfaces feel continuous. **In-app content** should rely on Aura primitives (**Card**, **Banner**, **Dialog**, forms) plus the width and spacing rules above.

---

## Elevation & Depth

### Shadows

`--effect-shadow-sm` through `--effect-shadow-xl` are **alpha blacks** tuned per theme. Tailwind shadow utilities compose layered stacks from these tokens:

| Tailwind shadow  | Built from `--effect-shadow-*` | Light (α)   | Dark (α)    | Use (per theme comments in CSS)                    |
| ---------------- | ------------------------------ | ----------- | ----------- | -------------------------------------------------- |
| `shadow-sm`      | `--effect-shadow-sm`           | 0.04        | 0.2         | Tooltips, small floating containers                |
| `shadow-default` | md + sm layers                 | 0.05 + 0.04 | 0.302 + 0.2 | Menus, popovers, hover cards                       |
| `shadow-md`      | lg + md layers                 | 0.06 + 0.05 | 0.4 + 0.302 | Sonner toasts, temporary elevated elements         |
| `shadow-lg`      | xl + lg layers                 | 0.10 + 0.06 | 0.6 + 0.4   | Modals / dialogs **without** full backdrop overlay |
| `shadow-xl`      | xl + lg layers                 | 0.10 + 0.06 | 0.6 + 0.4   | Modals / dialogs **with** backdrop overlay         |

Exact pixel stacks are defined in the theme CSS alongside `--shadow-sm` … `--shadow-xl`.

### Focus rings

Shadow-based (not `outline`) for consistent rendering:

| Token                             | Composition                                                                                      | Use                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `--shadow-focus-ring`             | `0 0 0 1px var(--ring)` (`{colors.ring}`), `0 0 0 3px var(--ring-muted)` (`{colors.ring-muted}`) | Default focus on interactive controls |
| `--shadow-focus-ring-destructive` | `0 0 0 1px var(--ring-destructive), 0 0 0 3px var(--ring-destructive-muted)`                     | Destructive / invalid focus           |

### Opacity

| Token / concept                                  | Value                    | Use                               |
| ------------------------------------------------ | ------------------------ | --------------------------------- |
| `--opacity-10` … `--opacity-80` (+ `*-inverted`) | rgba steps               | Overlays, glass effects           |
| Overlay scrim                                    | via `overlay-background` | Modal backdrop (see color tables) |
| Chart fills                                      | `chart-*-color-*`        | See **Chart tokens**              |

---

## Shapes

### Corner radius

Defined in the theme. Default interactive radius in components is often **`rounded-lg`** (`{rounded.lg}`) for buttons/inputs; cards and overlays use **`rounded-lg`**–**`rounded-xl`** (`{rounded.lg}`–`{rounded.xl}`).

| CSS variable               | Token            | Use                                                            |
| -------------------------- | ---------------- | -------------------------------------------------------------- |
| `--radius-none`            | `{rounded.none}` | Dividers, full-bleed                                           |
| `--radius-xs`              | `{rounded.xs}`   | Tight inner chrome                                             |
| `--radius-sm`              | `{rounded.sm}`   | Small controls, badges                                         |
| `--radius-md` / `--radius` | `{rounded.md}`   | Maps to `rounded-md` — shared default in theme                 |
| `--radius-lg`              | `{rounded.lg}`   | **Default** for many controls (Button, Input) via `rounded-lg` |
| `--radius-xl`              | `{rounded.xl}`   | Dialogs, large cards, popovers                                 |
| `--radius-2xl`             | `{rounded.2xl}`  | Extra-large surfaces                                           |
| `--radius-3xl`             | `{rounded.3xl}`  | Marketing / hero panels                                        |
| `--radius-4xl`             | `{rounded.4xl}`  | Largest marketing rounding                                     |
| `--radius-full`            | `{rounded.full}` | Pills, avatars                                                 |

### Borders

Aura is visually **flat**; surfaces, spacing, and typography do most structure. Add borders only when separation or affordance needs extra clarity.

**Rules**

- **Must** treat borders/strokes as structural signals (inputs, table boundaries, critical separators), not decoration.
- **Should** distinguish line items inside cards with spacing, alignment, and type hierarchy before adding dividers.
- **Should** prefer one outer container boundary over many nested per-row outlines in the same card.
- **Avoid** drawing borders around every item in a list/card just to create visual rhythm.
- **Avoid** decorative outline stacks (`border` + `ring` + inset strokes) when no state or interaction meaning is conveyed.

| Concept          | Value                            | Use                                                                    |
| ---------------- | -------------------------------- | ---------------------------------------------------------------------- |
| Default width    | **1px**                          | Tailwind `border` — tables, inputs, and occasional structural dividers |
| Emphasized width | **2px**                          | Stronger separation or invalid/critical state emphasis                 |
| Border color     | `border`, `border-emphasized`, … | See **Base — Borders and focus**                                       |
| Style            | solid                            | Default                                                                |

---

## Primitive components

### Primitive component heights

Heights are **not** always single CSS variables; primitives use Tailwind height utilities. Representative values from core components:

| Size        | Component token               | Height         | Aura usage                                    |
| ----------- | ----------------------------- | -------------- | --------------------------------------------- |
| xs          | `{components.badge-xs}`       | 20px (`h-5`)   | Badge (default)                               |
| sm          | `{components.button-sm}`      | 28px (`h-7`)   | Button `sm`, compact rows                     |
| md          | `{components.button-primary}` | 36px (`h-9`)   | Button default, Input, Select, many menu rows |
| lg          | `{components.button-lg}`      | 40px (`h-10`)  | Button `lg`                                   |
| Icon button | sm / md / lg tokens           | 28 / 36 / 40px | `icon-sm` / default / `icon-lg`               |

**Topbar** height is **application-defined** (not a single Aura token). **Table / list row** density varies by product; menu and command patterns often use **`{components.button-primary.height}`** (`h-9`) rows.



### Global primitive rules

1. Prefer primitives over custom components.
2. Keep behavior accessible (keyboard activation, focus visibility, and clear state changes).
3. Do not hide critical information if users need fast comparison or repeated switching.
4. When selection is required before action, prefer contextual actions tied to that selection.
5. Use Storybook for exact variants, props, and implementation details.

### Primitive guidance

Sections are in alphabetical order. For each component, the Storybook link is the primary reference for variants and props; the docs link is the primary reference for usage and design guidance.

#### Storybook reference
Anytime you need to reference a component in Storybook, use the following URL and replace the slug with the component's Storybook slug: https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-{storybook-slug}--docs

#### Docs reference 
Anytime you need to reference a component in docs, use the following URL and replace the slug with the component's doc slug: https://docs.cognite.com/aura-design-system/primitives/{docs-slug}

#### Accordion

**Storybook-slug:** accordion
**Docs-slug:** accordion

**Definition**
Accordion reveals and hides grouped content sections to reduce cognitive load and page density.

**Use when**
- Grouping settings in side/config panels.
- Breaking long forms into manageable sections.
- Organizing docs/FAQ/help content.
- Showing nested information hierarchies.

**Use something else when**
- All content must stay visible for comparison/scanning.
- Content is short and easy to read without progressive disclosure.
- Users are making high-stakes or multi-step decisions where hidden content can cause errors.

**Dos and don'ts**
- Do use clear, specific section titles.
- Do keep icon and heading behavior consistent.
- Do not use for very short/simple content.
- Do not nest accordions.

**Behavior**
- Header controls expand/collapse via click/tap/Enter/Space.
- Support multi-expand unless product pattern requires single-expand.
- Keep expanded content available to assistive tech.

**Often used with**
- `Separator`, section headings, and form controls inside panel content.

#### Action Toolbar

**Storybook-slug:** actiontoolbar
**Docs-slug:** action-toolbar

**Definition**
Action toolbar is a transient bottom-aligned action row that appears when users select items (for example in data-heavy views).

**Use when**
- Actions apply only to selected items.
- You need to reduce persistent toolbar clutter in tables/lists/cards.
- The workflow depends on selected state before next actions are valid.

**Use something else when**
- Actions are page-level and do not require selection first (use a standard toolbar/page actions).

**Dos and don'ts**
- Do keep actions contextual to the current selection.
- Do keep the set focused (use overflow when needed).
- Do center it in the container/page scope.
- Do not make it draggable.

**Behavior**
- Hidden by default; appears after selection.
- Anchored to bottom area; remains until selection clears, action completes, or user navigates away.
- If no reload occurs, it exits after action completion.

**Often used with**
- Selection patterns in data views, `Checkbox`, `Button`, `Menu`, and `Tooltip` for icon-only actions.

#### Alert

**Storybook-slug:** alert
**Docs-slug:** alert

**Definition**
Alert communicates contextual, medium-emphasis information inside page/task flow. It is not a blocking modal.

**Use when**
- Providing inline guidance/recommendations in the current task.
- Calling attention to warnings/issues that need awareness but are not blocking.
- Offering direct actions that resolve the issue in context.

**Dos and don'ts**
- Do include action buttons only when actions are directly related to resolving/dismissing the alert.
- Do evaluate simpler feedback methods first (for example field-level validation).
- Do not attach unrelated actions.

**Placement**
- Align with surrounding content; do not pin flush against dividers.
- Use card style for wrapped content in constrained areas.
- Use strip style for short messages in wider areas.

**Behavior**
- Inline with page flow (not full-screen blocking).
- Dismissal removes/hides alert per variant.
- Action path should be clear and minimal.

**Often used with**
- `Button` for direct resolution actions.

#### Alert Dialog

**Docs-slug:** alert-dialog

**Definition**
Short, focused confirmation or acknowledgment that interrupts the user for a clear binary or limited choice.

**Use when**
- Confirming destructive or irreversible actions.
- Blocking until the user chooses from a small set of options.

**Use something else when**
- Inline persistence is enough (`Alert`).
- The flow requires a form or multi-field input (`Dialog`).
- A quick acknowledgment is sufficient (`Sonner Toast`).

**Often used with**
- `Button` (destructive variant) as the trigger.

#### Avatar

**Storybook-slug:** avatar
**Docs-slug:** avatar

**Definition**
Avatar visually represents a user, team, or concept and helps recognition in collaborative UI.

**Use when**
- Showing people in comments, chat, sharing, or collaborators.
- Representing accounts, teams, or organizations.
- Displaying AI/agent identities in conversational interfaces.

**Behavior**
- Choose size based on context density.
- Use overflow patterns for constrained spaces (for example +N with menu).
- Can be informational or interactive based on context.
- Can include status badges/dots.

**Often used with**
- `Badge`, `Tooltip`, `Menu`.

#### Badge

**Storybook-slug:** badge
**Docs-slug:** badge

**Definition**
Compact label for status, category, or metadata.

**Use when**
- Surfacing state at a glance (for example active, draft, error).
- Tagging items without taking primary focus from the page.

**Use something else when**
- The message needs explanation or recovery steps (consider `Alert` or inline text).
- You need a primary action (use `Button`).

**Often used with**
- `Avatar`, tables and lists, filter chips.

#### Banner

**Storybook-slug:** banner
**Docs-slug:** banner-alert

**Definition**
Persistent or dismissible message scoped at page or section level — stronger than inline helper text, broader than a single-field `Alert` in some layouts.

**Use when**
- Announcing environment or product state (maintenance, trial, feature preview).
- Page-wide outcomes that should stay visible while the user continues.

**Use something else when**
- Task-specific guidance inside a flow (`Alert`).
- Brief confirmation after an action (`Sonner Toast`).

#### Breadcrumb

**Storybook-slug:** breadcrumb
**Docs-slug:** breadcrumbs

**Definition**
Hierarchical navigation aid that shows users their current location within the product's structure. Location-based, not path-based.

**Use when**
- Users need to return to a parent page.
- Users need clarity on their current position in the product hierarchy.
- Quick access to ancestor pages is useful.

**Use something else when**
- The page structure is flat — there is no hierarchy to show.
- Users are switching between same-level content (use `Tabs` or `Segmented Control`).

**Dos and don'ts**
- Do not make the current breadcrumb clickable.
- Do not pair with a back button.
- Do not wrap breadcrumb labels to multiple lines; truncate and use `Tooltip` for full text.
- Show only one breadcrumb trail per page.

**Behavior**
- All links except the current page are interactive (Tab, Shift+Tab, Enter).
- When space is limited, condense middle items into an overflow menu showing the first and last two links.
- The active page link always remains visible.

**Often used with**
- `Tooltip` for truncated labels, `Menu` for overflow segments, `Topbar`.

#### Button

**Storybook-slug:** button
**Docs-slug:** button

**Definition**
Primary control for discrete actions.

**Use when**
- Committing, navigating a clear next step, or triggering destructive work (with confirmation pattern).

**Dos and don'ts**
- One primary action per logical section when possible.
- Match variant to risk: destructive actions use destructive variant and confirmation.
- Label with verb + object (see Content guidelines in `./DESIGN.md`).
- Icon-only actions need an accessible name (`aria-label`).

**Often used with**
- `Button Group`, `Dialog`, forms.

#### Button Group

**Storybook-slug:** button-group

**Definition**
Visually joins related buttons into a connected row, clarifying that the actions belong to the same context.

**Use when**
- Two or more actions are closely related and operate on the same target (for example, a split-button or segmented action row).
- Conserving horizontal space compared to individually spaced buttons.

**Use something else when**
- Actions are unrelated and should not appear grouped.
- You need more than a small set of actions (consider `Toolbar` or `Dropdown Menu`).

**Often used with**
- `Button`, `Tooltip` for icon-only variants.

#### Card

**Storybook-slug:** card
**Docs-slug:** card

**Definition**
A structural container with optional header, body, and footer slots for displaying data artifacts, widgets, or media. The Card with Count variant adds a numeric indicator to the header.

**Use when**
- Presenting charts, visualizations, or data widgets.
- Building grids of comparable items where list/grid view toggling is needed.
- Displaying media content (images, videos).

**Use something else when**
- You just need visual separation between sections — use `Separator` and spacing instead.
- You are comparing dense metadata across rows — use `Table` or a data grid instead.

**Dos and don'ts**
- Cards are structural containers only; interactive elements (`Button`, `Checkbox`) go inside the body or actions area.
- Exception: the entire card can serve as a single focusable target when it acts as a link or selection item.

**Often used with**
- `Button`, `Badge`, `Avatar`, `Separator`, charts, lists, or form fields in the body.

#### Checkbox

**Storybook-slug:** checkbox
**Docs-slug:** checkbox

**Definition**
Enables users to independently select one or multiple options. Can appear standalone or within menus, tree views, tables, or cards.

**Use when**
- Multiple independent selections are required (for example, column visibility in a table).
- Enabling or disabling settings where changes do not take immediate effect.
- Confirming agreement before an action (for example, delete verification).

**Use something else when**
- Only one option can be selected at a time (use `Radio`).
- Options are not displayed simultaneously (use `Select`).
- You need an immediate on/off toggle (use `Switch`).

**Dos and don'ts**
- Do provide a label for every checkbox.
- Do implement indeterminate states for partial group selection.
- Do not pre-select checkboxes automatically.
- Do not use a single checkbox unless it is confirming agreement.
- Do not use card variants for long option lists.

**Behavior**
- Space key toggles focused checkboxes.
- Indeterminate state is set programmatically, not by user interaction.
- Parent-child relationships follow selection cascading rules.

**Often used with**
- `Label`, helper text for groups, `Card` variant for options needing descriptions.

#### Collapsible

**Storybook-slug:** collapsible
**Docs-slug:** collapsible

**Definition**
A single inline expandable block that toggles content visibility. Designed for one independent optional section, not multiple stacked areas.

**Use when**
- Showing one optional or secondary block of content (for example, AI reasoning, advanced settings, a preview).
- Content is useful but not essential to the primary task.

**Use something else when**
- You have multiple expandable sections (use `Accordion`).
- Content is essential — show it by default.
- Users are navigating or filtering (use `Tabs` or filter controls).

**Dos and don'ts**
- Do default to collapsed unless the collapsible content is the main purpose of the view.
- Do keep the trigger label descriptive — it should communicate what's inside.
- Do not nest collapsibles; use `Accordion` for layered disclosure.
- Do not hide errors or required information.

**Behavior**
- One trigger controls one associated region with optional animation.
- State changes must be exposed to assistive technology.

**Often used with**
- `Separator` when stacking multiple collapsible regions on a page.

#### Combobox

**Storybook-slug:** combobox
**Docs-slug:** combobox

**Definition**
A searchable select input that filters options as users type. Supports single and multi-select modes with optional ability to add new items.

**Use when**
- More than approximately 12 options where search efficiency beats scrolling.
- Users have a general sense of what they're looking for (country, asset name, tag).
- Users need to add new options not in the predefined list.

**Use something else when**
- Fewer than ~12 options: prefer `Select`, `Radio`, or `Checkbox`.
- Users are unfamiliar with available options and need a visible list.
- Very large datasets risk performance lag: use a data grid with filtering.
- Pure text entry without selection (use `Input` or `Textarea`).

**Dos and don'ts**
- Do group related options into categories.
- Do position checkmarks right-aligned in menus.
- Do not use for simple binary choices or small option sets.
- Do not place icons or badges on the left side of menu items.

**Behavior**
- Single-select closes immediately on selection.
- Multi-select stays open until the user clicks outside, presses Escape, or Enter.

**Often used with**
- `Label`, helper text, `Badge`.

#### Command

**Storybook-slug:** command
**Docs-slug:** command

**Definition**
A keyboard-first search interface for discovering and executing actions, navigating pages, or looking up content application-wide. Typically activated via ⌘K / Ctrl+K and displayed inside a `Dialog` or `Popover`.

**Use when**
- Enabling keyboard-driven workflows across an entire application.
- Providing power-user shortcuts to actions and destinations.
- The application has too many actions or pages to surface in a standard nav.

**Use something else when**
- Filtering a specific list or dataset (use `Search`).
- Selecting from known form options (use `Combobox` or `Select`).
- Navigating between a small number of pages (use `Tabs` or nav links).

**Dos and don'ts**
- Do organize results into logical categories.
- Do use action-oriented labels ("Create asset," "Switch to dark mode").
- Do display the keyboard shortcut on triggering elements.
- Do surface frequently used items by default.
- Do not use for general content search.
- Do require confirmation steps for destructive actions.

**Behavior**
- Keyboard-first interface presenting categorized, scannable action lists.
- Shows loading indicators for async results and meaningful empty states.

**Often used with**
- `Dialog`, `Popover`, `Search`, `Empty State`.

#### Count

**Storybook-slug:** count

**Definition**
A compact numeric indicator used to surface quantities inline — for example, unread messages, selected items, or totals attached to labels or tabs.

**Use when**
- Showing a quantity associated with a label, tab, or list item.
- Surfacing unread counts or selection totals without taking primary focus.

**Use something else when**
- The value represents status or category rather than a quantity (use `Badge`).

**Often used with**
- `Tabs`, `Badge`, `Label`, list items.

#### Date Picker

**Storybook-slug:** datepicker
**Docs-slug:** date-and-time-picker

**Definition**
Allows users to select a single date through a calendar interface, ensuring proper formatting and avoiding input errors.

**Use when**
- Users need to select an exact date.
- Preventing manual date-formatting errors is important.

**Use something else when**
- Relative dates are more appropriate ("Last week") — add shortcut options instead.
- The date is fixed or recurring (consider a cron expression or plain `Input`).
- Exact timing is not critical (use basic `Input`).

**Behavior**
- Opens a calendar anchored to the input field.
- Keyboard users can type valid values directly without using the picker.
- Values commit in the configured locale format.

**Often used with**
- `Label`, helper text, `Date Range Picker`.

#### Date Range Picker

**Storybook-slug:** daterangepicker
**Docs-slug:** date-and-time-picker

**Definition**
Allows users to select a start and end date from a calendar interface. Used for filtering by date ranges, comparing periods, or scheduling.

**Use when**
- Users need to specify a date range for filtering or reporting.
- Comparing data across a period.

**Use something else when**
- Only a single date is needed (use `Date Picker`).
- Relative ranges like "Last 7 days" cover most use cases — add shortcut options.

**Behavior**
- Enforces start/end ordering with validation messages.
- Keyboard users can type valid values directly.

**Often used with**
- `Label`, helper text, `Date Picker`.

#### Date Time Range Picker

**Storybook-slug:** datetimerangepicker
**Docs-slug:** date-and-time-picker

**Definition**
Allows users to select start and end date and time values. Used when precise time boundaries matter, for example scheduling or time-series filtering.

**Use when**
- Users must specify both a date and time for a range (scheduling, time-series queries).

**Use something else when**
- Time precision is not required (use `Date Range Picker`).
- Only a single point in time is needed (use `Date Picker` or `Time Picker`).

**Behavior**
- Enforces start/end ordering; validates that end is after start.
- Keyboard users can type valid values directly.

**Often used with**
- `Label`, helper text, `Date Range Picker`.

#### Dialog

**Storybook-slug:** dialog
**Docs-slug:** dialog

**Definition**
Richer content surface: forms, multi-field flows, or explanations that do not fit a strip or inline pattern.

**Use when**
- Collecting input or showing structured content that needs focus without leaving the page.

**Use something else when**
- Inline persistence is enough (`Alert`).
- Only a quick acknowledgement is needed (`Sonner Toast`).
- The action is binary and destructive (use `Alert Dialog`).

**Often used with**
- `Button`, `Form`, `Alert Dialog` for confirmation steps.

#### Drawer

**Storybook-slug:** drawer

**Definition**
Secondary surface that slides in for filters, detail, or medium-length tasks without a full page change.

**Use when**
- Supporting the main view (filters, record details, auxiliary forms).

**Use something else when**
- The task needs full attention or multi-step wizard treatment (full page or `Dialog`).
- Content is very short (consider `Popover` or inline).

#### Dropdown Menu

**Storybook-slug:** dropdown-menu

**Definition**
A button-triggered overlay listing a set of related actions or options. One of the two menu variants (the other being a context menu, which is right-click triggered). See also: `Menu`.

**Use when**
- A button needs to reveal secondary or overflow actions without persistent UI.
- Grouping related actions behind a single trigger to reduce visual clutter.

**Use something else when**
- Options require complex selection or rich descriptions (use `Select Panel`).
- Actions need user confirmation (use `Dialog` or `Alert Dialog`).
- The action set is always visible and primary (use `Toolbar`).

**Behavior**
- Closes after selection by default.
- Positions above, below, or beside the trigger depending on viewport space.
- Submenus open on hover.

**Often used with**
- `Button`, `Separator`, `Badge`, checkbox toggles.

#### Empty State

**Storybook-slug:** empty
**Docs-slug:** empty-state

**Definition**
Placeholder when there is no data yet or results are empty.

**Use when**
- Lists, tables, charts, or artifacts have zero rows/points.

**Dos and don'ts**
- Explain what will appear and how to get started.
- Include a single clear CTA when creation/import applies.

#### Form

**Storybook-slug:** form

**Definition**
A structural wrapper for form fields that manages layout, spacing, validation state propagation, and submission handling.

**Use when**
- Collecting structured user input across one or more fields.
- Grouping related fields with shared validation and submission logic.

**Dos and don'ts**
- Do group semantically related fields together.
- Do associate every field with a `Label`.
- Do not use `Form` as a generic container when no submission or validation is needed.

**Often used with**
- `Input`, `Select`, `Combobox`, `Checkbox`, `Radio`, `Label`, `Button` (submit), `Dialog`.

#### Input

**Storybook-slug:** input
**Docs-slug:** input

**Definition**
Single-line text field for capturing short text-based information in forms and toolbars.

**Use when**
- Collecting specific text data (names, credentials, asset identifiers).
- A form field requires free text that doesn't fit a structured picker.

**Use something else when**
- Selecting from predefined options (use `Select`, `Combobox`, `Checkbox`, or `Radio`).
- Suggestions as the user types are needed (use `Combobox`).
- Selecting dates or times (use `Date Picker` / `Time Picker`).
- Multi-line text is expected (use `Textarea`).

**Dos and don'ts**
- Do not use long placeholder text that duplicates the label.
- Do not mimic pre-filled content with placeholder text.
- Do not wrap text in an input; truncate or switch to `Textarea`.

**Behavior**
- Single-line only; updates as the user types.
- Validation messages associate with the field for accessibility.
- Supports leading (icon, prefix) and trailing (button, suffix, stepper) slots.

**Often used with**
- `Label`, helper text, `Button`, `Tooltip`.

#### Label

**Storybook-slug:** label
**Docs-slug:** label

**Definition**
A form label that identifies and is programmatically associated with an input field. Not intended as general-purpose text.

**Use when**
- Every `Input`, `Select`, `Combobox`, `Textarea`, `Checkbox` group, `Radio` group, `Switch`, `Slider`, or `Date Picker` needs one.

**Use something else when**
- You need a heading or section title (use appropriate heading levels).
- You need descriptive text below a field (use helper text).
- You are labeling a non-interactive element like a status indicator (use plain text or `Badge`).

**Dos and don'ts**
- Do associate labels with fields via `htmlFor`/`id` for accessibility.
- Do mark required fields consistently (asterisk or explicit text).
- Do not replace labels with placeholder text — placeholders disappear and are inaccessible.
- Do not hide labels for visual cleanliness; use `Tooltip` to supplement shortened labels.

**Often used with**
- `Input`, `Select`, `Combobox`, `Checkbox`, `Radio`, `Switch`, `Slider`, `Textarea`, `Date Picker`.

#### Menu

**Storybook-slug:** menu
**Docs-slug:** menu

**Definition**
Presents a list of actions, options, or states for the current selection or context. Two variants: context menu (right-click/long-press trigger) and dropdown menu (button trigger). See also: `Dropdown Menu`.

**Use when**
- Offering action choices from a button, select, or combobox when space is constrained.
- Exposing contextual actions via right-click without dedicated trigger UI.

**Use something else when**
- Options require reordering or rich descriptions (use `Select Panel`).
- Actions need user confirmation before executing (use `Dialog`, `Alert Dialog`, or `Popover`).

**Dos and don'ts**
- Do keep items left-aligned and styled consistently within sections.
- Do separate actions into labeled sections using `Separator`.
- Do not mix items with and without leading content (icons/toggles) in the same section.

**Behavior**
- Closes after selection unless multi-select is enabled.
- Positions above, below, left, or right of the trigger with a 4px gap, adapting to viewport space.
- Submenus open on hover.

**Often used with**
- `Button`, `Select`, `Combobox`, `Separator`, `Badge`, checkbox toggles.

#### Pagination

**Storybook-slug:** pagination
**Docs-slug:** pagination

**Definition**
Divides large datasets into pages, giving users control over navigation and improving load performance.

**Use when**
- Datasets are large (tables, search results, galleries).
- Performance concerns rule out infinite scroll.
- Users need to bookmark or return to a specific page position.

**Use something else when**
- The context is a discovery feed (use infinite scroll or "Load more").
- Users are completing a sequential task (use a wizard/stepper).
- You need to switch between unrelated modes (use `Segmented Control` or `Tabs`).

**Dos and don'ts**
- Do place pagination below content, left-aligned.
- Do provide "Next" and "Previous" buttons, disabled when irrelevant.
- Do include "Results per page" options for large datasets.
- Do not use pagination when fewer than ~20 items per page exist.

**Behavior**
- Each page should have its own shareable URL.
- Content loads without full page reloads; use loaders and skeletons while data fetches.
- Teleport variant allows direct page number entry.
- Filters, searches, and selections persist across pages.

**Often used with**
- `Table`, data grids, `Search`, `Skeleton`.

#### Popover

**Storybook-slug:** popover
**Docs-slug:** popover

**Definition**
A click-triggered panel for interactive or structured supplemental content. Stays open until dismissed.

**Use when**
- User needs to pick options, fill short fields, or read formatted content on demand without leaving the page.

**Use something else when**
- Content is essential to the task — surface it inline or in `Dialog` / `Drawer`.
- A brief, non-interactive hint is needed (use `Tooltip`).

**Often used with**
- `Button` or icon as trigger, `Command`, form controls inside the panel.

#### Radio

**Storybook-slug:** radio
**Docs-slug:** radio

**Definition**
Allows users to select exactly one option from a small set of mutually exclusive choices.

**Use when**
- Single selection from a small, visible set of predefined options.
- All options should be visible side by side for comparison.

**Use something else when**
- Multiple selections are needed (use `Checkbox`).
- There are more than ~5 options or space is limited (use `Select` or `Combobox`).
- The choice is binary and takes immediate effect (use `Switch`).

**Dos and don'ts**
- Do pair each radio with a descriptive label.
- Do not group unrelated options.
- Do not exceed 5 options.

**Behavior**
- Clicking or pressing Space selects the focused option and deselects others in the group.

**Often used with**
- `Label`, helper text, `Card` variant for options needing supporting descriptions.

#### Search

**Storybook-slug:** search
**Docs-slug:** search

**Definition**
A specialized input for locating and filtering content, with built-in search and clear affordances.

**Use when**
- Lists, tables, or datasets need quick item location.
- Content-heavy pages where scrolling is impractical.
- Application-wide search (in conjunction with `Command`).

**Use something else when**
- Selecting from predefined options (use `Combobox` or `Select`).
- Multi-attribute filtering requires dedicated filter controls.
- General text input unrelated to content discovery (use `Input`).

**Dos and don'ts**
- Do make it clear whether search covers the current list, the page, or the whole app.
- Do display a no-results state when queries return nothing.
- Do debounce live search to avoid excessive requests.
- Do use descriptive placeholder text ("Search assets").
- Do not leave empty results without explanation.

**Often used with**
- `Table`, data grids, `Command`, adjacent filter controls (`Select`, `Combobox`).

#### Segmented Control

**Storybook-slug:** segmented
**Docs-slug:** segmented-control

**Definition**
Switches between a small number of peer views or modes on the same page.

**Use when**
- Two to several comparable sections (for example overview vs details vs activity).

**Use something else when**
- Content is hierarchical or lengthy and users must open multiple sections at once (consider `Accordion` or visible sections).
- Navigating separate routes (tabs/sidebar patterns — see `building-pages.md`).

**Relationship to Accordion**
- Segmented control swaps visibility of peer panels; accordion stacks expandable sections. Prefer segmented control when users switch modes frequently; accordion when progressive disclosure matters.

#### Select

**Storybook-slug:** select
**Docs-slug:** select

**Definition**
Enables users to choose one or more predefined options from a dropdown list. Used in forms and filtering when space is constrained.

**Use when**
- Multiple predefined options exist and space prevents showing them all at once.
- Options are familiar and don't require explanation.
- A single or multi-select form input is needed.

**Use something else when**
- 12+ options or search is needed (use `Combobox`).
- Few options or a binary choice (use `Checkbox`, `Radio`, or `Switch`).
- User-created values are needed (use `Combobox`).
- Options need lengthy descriptions (use `Checkbox` or `Radio`).
- Selection triggers immediate mode-switch (use `Segmented Control` or `Tabs`).

**Dos and don'ts**
- Do provide a clear label and placeholder.
- Do use helper text when clarification is needed.
- Exercise caution with default selections — users may overlook them.

**Behavior**
- Single-select closes after selection; multi-select may remain open.
- Checkmarks appear right-aligned in the list.

**Often used with**
- `Label`, helper text, `Button`.

#### Separator

**Storybook-slug:** separator
**Docs-slug:** separator

**Definition**
A 1px visual divider between distinct content sections. Improves readability while remaining visually subtle.

**Use when**
- Creating visual relief between related groups of content.
- Dividing sections within toolbars, menus, cards, or forms.

**Use something else when**
- The layout is sparse — whitespace alone is sufficient.
- Sections need semantic grouping (use headings, `Card`, or background regions instead).

**Dos and don'ts**
- Do use 16px vertical separators for button or horizontal form element separation.
- Do not place separators between every element.
- Do not use bold or colorful separators — keep them subtle.
- Do not replace semantic headings or landmarks with separators.

**Often used with**
- `Toolbar`, `Card` headers/footers, `Accordion`, menus, dense form sections.

#### Skeleton

**Storybook-slug:** skeleton

**Definition**
A loading placeholder that mimics the shape of incoming content, reducing perceived wait time and preventing layout shift.

**Use when**
- Content is loading and the shape of the result is predictable (cards, lists, table rows).
- Reducing layout shift while data fetches in the background.

**Use something else when**
- The loading duration is very short (<300ms) — no loader is needed.
- The content shape is unpredictable (use a spinner or progress indicator).

**Dos and don'ts**
- Do match skeleton shapes to the actual content layout.
- Do not animate excessively — subtle pulse is sufficient.

**Often used with**
- `Card`, `Table`, `Pagination`, lists.

#### Slider

**Storybook-slug:** slider
**Docs-slug:** slider

**Definition**
An interactive control for selecting a single value or a range from a continuous scale. Provides visual feedback and quick approximate value selection.

**Use when**
- Adjusting continuous values where precision is less important than visual feedback (volume, brightness, pricing filter).
- Providing immediate visual feedback (media scrubbing, live previews).
- Selecting a minimum and maximum range.

**Use something else when**
- Precise numeric entry is required (use `Input` or `Select`).
- The choice is categorical, not continuous (use `Radio` or `Select`).

**Behavior**
- Supports immediate feedback (changes apply as the user drags) and deferred feedback (changes apply on submit).
- Use deferred feedback when slider adjustments trigger screen reloads or visual disruptions; pair with helper text explaining that the user must submit to apply.

**Often used with**
- `Label`, helper text, optional adjacent `Input` for precise numeric entry.

#### Sonner Toast

**Storybook-slug:** sonner
**Docs-slug:** sonner

**Definition**
Lightweight, auto-dismiss feedback for outcomes that do not need a blocking surface.

**Use when**
- Confirming save, delete, or background completion.
- Non-critical notices the user can miss without breaking a workflow.

**Use something else when**
- User must read and act before continuing (`Alert Dialog`, `Dialog`, or persistent `Alert` / `Banner`).

#### Switch

**Storybook-slug:** switch
**Docs-slug:** switch

**Definition**
A binary toggle control that turns a setting on or off, with changes taking effect immediately.

**Use when**
- Toggling a setting that takes immediate effect (for example, dark mode, notifications).

**Use something else when**
- The change is form-dependent and deferred (use `Checkbox` or `Button`).
- The action is one-time or destructive (use `Button`).
- Multiple related toggles need grouping (use `Toggle Group`, `Checkbox`, or `Select`).

**Dos and don'ts**
- Do apply a clear, descriptive label explaining the switch's function.
- Do not embed switches inside `Menu` components — use menu checkmarks instead.
- Do not use for destructive actions.

**Behavior**
- Responds instantly to user interaction without requiring separate form submission.

**Often used with**
- `Label`, helper text.

#### Table

**Storybook-slug:** table

**Definition**
Dense, scannable display of rows and columns with optional selection and actions.

**Use when**
- Comparing rows, scanning many attributes, or operating on multiple items.

**Use something else when**
- A simple fixed list of links or single-column items (`List`).
- A primary chart or narrative view (`Card`, charts — see Storybook).

**Often used with**
- Selection + `Action Toolbar` (when selection-gated actions apply), `Pagination`, `Empty State`, row `Checkbox`, `Dropdown Menu` for row actions.

#### Tabs

**Storybook-slug:** tabs
**Docs-slug:** tabs

**Definition**
Organizes related content into switchable sections, allowing users to navigate between different views without leaving the page.

**Use when**
- Organizing content into sections users switch between frequently.
- Displaying related, mutually exclusive content.
- Navigation within pages, dashboards, settings, or data views.

**Use something else when**
- Filtering a list or dataset (use `Segmented Control`, `Button`, or `Menu`).
- Multiple sections must be visible simultaneously (use `Accordion` or filters).
- The choice is a binary toggle (use `Switch`).

**Dos and don'ts**
- Do use a minimum of two tabs.
- Do keep content above tabs stable across all tab states.
- Do use leading icons consistently across all tabs or not at all.
- Do not use tabs for basic filtering.
- Do not apply to binary options.

**Behavior**
- Exactly one tab panel is visible at a time.
- Tab buttons manage selection state and keyboard focus.
- Supports default, vertical, and full-width alignment options.

**Often used with**
- `Table`, `Form`, `Card`, `Empty State`. Keep global page actions outside tab panels.

#### Textarea

**Storybook-slug:** textarea
**Docs-slug:** textarea

**Definition**
A multi-line text field for extended free-form input such as comments, feedback, messages, descriptions, or notes.

**Use when**
- Multi-line text is expected (comments, notes, bios, explanations).
- Editing large chunks of existing text.

**Use something else when**
- A single line of text is all that is needed (use `Input`).
- Structured data is expected (use masked `Input`, `Date Picker`, `Select`, or `Combobox`).
- Rich formatting is needed (use a rich-text editor).

**Dos and don'ts**
- Do use concise labels and placeholder text.
- Do allow scroll when content exceeds the maximum height.
- Do not set a small fixed height for expected lengthy input.
- Do not pre-fill with default text users might overlook.

**Behavior**
- Supports optional user resizing via a drag handle.
- Restrict resizing when layout integrity is critical (forms in modals or sidebars) or when the textarea auto-expands programmatically.

**Often used with**
- `Label`, helper text (optionally with character count).

#### Time Picker

**Storybook-slug:** timepicker
**Docs-slug:** date-and-time-picker

**Definition**
Allows users to select a time value through a clock interface.

**Use when**
- Users need to select a precise time without a date.
- Scheduling tasks, alarms, or time-of-day settings.

**Use something else when**
- Both date and time are required (use `Date Picker` or `Date Time Range Picker`).
- Exact timing is not important (use basic `Input`).

**Behavior**
- Keyboard users can type valid values directly.
- Values commit in the configured locale format.

**Often used with**
- `Label`, helper text, `Date Picker`.

#### Toggle

**Storybook-slug:** toggle

**Definition**
A single pressable button with active/inactive state, used to toggle one option or formatting command on or off.

**Use when**
- A single binary option needs a visible pressed/unpressed state (for example, bold text, mute).

**Use something else when**
- Two or more related toggles should be grouped (use `Toggle Group`).
- The change takes immediate app-level effect (use `Switch`).
- The action is a one-time command (use `Button`).

**Often used with**
- `Toolbar`, `Tooltip` for icon-only variants, `Toggle Group`.

#### Toggle Group

**Docs-slug:** toggle-group

**Definition**
A set of 2–4 related toggle options for mutually exclusive or multi-select settings that are always visible.

**Use when**
- Toggling between 2–4 always-visible, mutually exclusive modes (for example, grid lines, text alignment, ruler visibility).
- The current selection must always be immediately clear.

**Use something else when**
- More than ~4–5 options exist (use `Select` or `Menu`).
- Options execute one-time commands (use `Button`).
- Multi-select filtering across a larger set (use `Checkbox` or filter chips).
- Single-select filtering of a small dataset (use `Segmented Control`).
- The context is page navigation (use `Tabs` or routing).

**Dos and don'ts**
- Do keep labels concise — one or two words or icons only.
- Do not mix icons and text labels within the same group.

**Behavior**
- Selection updates instantly.
- Supports single-select and multi-select configurations.

**Often used with**
- `Toolbar`, `Tooltip` for icon-only variants.

#### Toolbar

**Docs-slug:** toolbar

**Definition**
Persistent strip of primary tools or filters for a page or region — available without selecting rows first.

**Use when**
- Page-level create/filter/export actions.
- Tools that apply to the whole view or the current query.

**Use something else when**
- Actions apply only after row/item selection (use `Action Toolbar`).

#### Topbar

**Storybook-slug:** topbar
**Docs-slug:** topbar

**Definition**
The single, persistent navigation bar at the top of every authenticated CDF and Flows custom app. Provides the primary orientation layer across three fixed regions: left (identity/breadcrumbs), middle (optional global navigation), and right (system controls).

**Use when**
- Every authenticated screen in a CDF or Flows app — this component is mandatory.
- The app has two or more top-level views requiring global switching.
- Actions apply consistently across all app pages (for example, a persistent "Add data" button).

**Use something else when**
- Login or authentication-only screens.
- Full-screen flows or modals that intentionally hide global chrome.

**Dos and don'ts**
- Do use the middle section for primary global app navigation.
- Do use `Tabs` for distinct pages, `Segmented Control` for mode switching in the middle section.
- Do not place page-specific actions in the action slot.
- Do not reorder or restyle system controls.
- Do not use multiple topbars per page.

**Behavior**
- Left: app mark (small `Avatar`), breadcrumbs, optional inline metadata.
- Middle: optional; omit for single-view apps.
- Right (fixed order): Share → Notifications → Theme → Atlas.

**Often used with**
- `Breadcrumb`, `Tabs`, `Segmented Control`, `Avatar`.

#### Tooltip

**Storybook-slug:** tooltip
**Docs-slug:** tooltip

**Definition**
A short hint that appears on hover or focus. No heavy interaction inside.

**Use when**
- Clarifying a control or icon in one line or sentence.
- Providing the full text of a truncated label (for example in `Breadcrumb`).

**Use something else when**
- Content is essential to the task — surface it inline or in `Dialog` / `Drawer`.
- Users need to interact with the content (use `Popover`).

**Often used with**
- Icon-only `Button`, `Toggle`, `Breadcrumb`, `Label`.

#### Tree

**Storybook-slug:** tree
**Docs-slug:** tree-view

**Definition**
Displays hierarchical data in a nested structure with expandable/collapsible rows. Supports optional selection and drag-and-drop.

**Use when**
- Presenting large structures with multiple nesting levels (folders, files, organizational hierarchies).
- Progressive disclosure of complex hierarchical relationships.

**Use something else when**
- Data is not hierarchical (use lists or `Table`).
- A sortable, tabular layout with multiple columns is needed (use `Table`).
- Non-hierarchical filtering is the goal (use `Tabs` or `Segmented Control`).
- Showing location in site hierarchy (use `Breadcrumb`).

**Behavior**
- Nodes expand and collapse independently.
- Keyboard navigation follows tree semantics (arrow keys, Home/End).
- Supports single and multi-selection.
- Optional drag-and-drop reordering (must maintain accessibility).

**Often used with**
- Row checkboxes, row menus, `Badge` for status, drag handles, selection highlights connecting to a side panel or `Table` in split-view layouts.

## Escalation guidance

If a primitive does not fit:
1. Check Storybook variants/props first.
2. Compose with existing primitives.
3. If still blocked, note the gap and keep implementation consistent with Aura foundations.

---

## Do's and Don'ts

Practical guardrails for Aura-based UI. For full rationale, see [Heuristics](#heuristics), [Interaction states](#interaction-states), and [Content](#content).

### Do

- Use semantic or base **color tokens** — never raw hex, rgb, or hsl when a token exists.
- Prefer Aura component **variants and APIs** over overriding styles with visual Tailwind utilities on primitives.
- Show **loading feedback** (`Shimmer`, `Loader`, `Skeleton`) for any wait the user is expected to sit through.
- Provide a **visible focus ring** on every interactive control (`shadow-focus-ring` / `shadow-focus-ring-destructive` on `:focus-visible`).
- Cap continuous **body text** at `{spacing.prose-max}` width; keep companion UI outside that measure.
- Use the **`{spacing.base}` spacing scale** for padding, margin, and gaps.
- Pair **icon-only controls** with `aria-label` and a `Tooltip`.
- Use **sentence case** for all UI copy; write action labels as verb + object ("Save changes", "Delete pipeline").
- Verify **contrast in both light and dark themes** before shipping.

### Don't

- Don't use semantic status colors (`info-*`, `success-*`, `warning-*`, `destructive-*`) as generic decoration or toggled selection fills.
- Don't remove focus styling or use `outline-none` / `ring-0` without an equivalent token-based focus ring.
- Don't stack multiple **Alerts** or **toasts** for a single user gesture.
- Don't use `alert()` or other native blocking dialogs for product UX.
- Don't hardcode **font sizes, shadows, or border radii** when theme tokens exist.
- Don't use icon-only targets without an accessible name and tooltip.
- Don't mix **chart**, **decorative**, and **semantic** color groups interchangeably.
- Don't override Aura primitive appearance with visual `className` utilities — use variants instead.

---

## Assets & Motion

**What this section is:** Rules for **illustrations**, **document icons**, **app icons**, and **system icons** in Aura-based products. It also includes rules and guidance for motion design. Each type has a distinct job; mixing types or bending the rules adds noise and weakens trust. Visual execution (where files live, export pipelines) belongs in brand tooling and engineering skills, not here.

### Illustrations

Illustrations add a human, expressive layer for **meaningful moments** — not general decoration. An illustration without a clear message is a distraction.

**Use for**

- Empty states — no content yet; user needs context or a clear next action
- Onboarding modals and product tours — first-use moments that should feel approachable
- Announcements — system-level messages that need more presence than copy alone
- Card visuals when photography or live data is not appropriate

**Do not use for**

- Decorative filler where the layout is already sufficient
- Stacking multiple illustrations in one context — **one illustration per context**
- Replacing copy — they **support** a message; they do not carry it alone

**Guidance**

- **Must** pair every illustration with supporting copy.
- **Must** use the asset variant that matches the active workspace theme (**light** or **dark**).
- **Must** preserve original aspect ratio — no non-uniform scaling or distortion.
- **Must** leave enough surrounding space so the asset reads clearly.
- **Must not** alter illustration artwork (cropping beyond safe bounds, filters, overlays, recolor).
- **Avoid** illustrations in dense data views or anywhere the primary task is scanning or acting on structured information.

**Accessibility**

- **Must** provide descriptive `alt` text on informative illustrations — describe the message, not every visual detail.
- Decorative illustrations that convey no extra information **should** use `alt=""` so assistive tech skips them.

### Document icons

Document icons signal **file type** so users can scan lists, tables, uploads, and attachments quickly.

**Use for**

- File-type identification in lists, tables, and previews
- Upload flows and pickers where type recognition matters

**Guidance**

- **Must** use only approved sizes: **36px**, **40px**, or **44px** — no other sizes.
- **Must** center and vertically middle-align icons with adjacent text.
- **Must** keep shipped colors — do not recolor or theme-swizzle document icons outside the provided set.
- **Must not** edit artwork (shapes, backgrounds, proportions).

**Accessibility**

- **Must** use `alt` text that names the file type (e.g. `alt="PDF"`).

### App icons

App icons identify **products, workspaces, or integrations** (launcher tiles, chrome, marketing surfaces). They are identity marks, not UI chrome.

**Guidance**

- **Must** use **official** Cognite or product marks from the brand system — no unofficial redraws.
- **Must** preserve clear space and minimum sizes defined by brand guidelines for each context (favicon, tile, splash).
- **Must not** distort, rotate for effect, add badges, or combine marks with decorative illustrations in the same glyph.

**Accessibility**

- Treat launcher and header marks as **informative** where they disambiguate apps; use `alt` or adjacent text consistent with the surface (e.g. app name next to the tile).

### System icons

System icons are **functional** shorthand for actions, state, and navigation. Aura standardizes on **Tabler Icons** (`@tabler/icons-react` in the library). Names describe intent — **do not repurpose** an icon for an unrelated meaning. For the full set of icons, visit [tabler.io/icons](https://tabler.io/icons), or search for a single icon by name with a query parameter: https://tabler.io/icons?icon={icon_name}.

**Sizes**

- **Default / recommended:** 16×16px
- **Accepted in UI components:** 12×12px, 14×14px, 16×16px, 24×24px (match the component’s density; Aura primitives often default to **16px** via `size-4` classes on icons) with a stroke weight of 1.5px.

**Guidance**

- **Must** use **filled** variants where brand or application chrome calls for weight or within sonner-toast or alert components (e.g. persistent app strip); use **outlined** variants for in-product actions and navigation unless a specific Aura component specifies otherwise.
- **Must not** edit, merge, or warp glyphs; icons stay **single-color** (typically `currentColor` so **Tokens** foreground colors apply). Exceptions: **branded** marks supplied as dedicated assets (see below).
- **Must not** hang hover, active, or focus styling on the raw icon — those states belong on the **control** (button, link, menu item).
- **Should** limit how many distinct icons compete on one view so each stays recognizable.
- **Avoid** icon-only interactive targets without a **Tooltip** or visible label (see accessibility).

**Action icons**

Action icons represent operations a user can perform that trigger a change in state, content, or system behavior. They typically appear in interactive, contextual components like buttons, toolbars, context menus, dropdown menus, and inline controls.

| Concept | Icon name | Source | Keywords / aliases | Accepted labels |
|---|---|---|---|---|
| Add / New | `plus` | [Tabler](https://tabler.io/icons?icon=plus) | create, add, new, insert | Add, Create |
| Cancel | `cancel` | [Tabler](https://tabler.io/icons?icon=cancel) | abort, stop | Cancel |
| Collapse (window) | `arrows-diagonal-minimize-2` | [Tabler](https://tabler.io/icons?icon=arrows-diagonal-minimize-2) | exit fullscreen, collapse, minimize | Collapse |
| Copy | `copy` | [Tabler](https://tabler.io/icons?icon=copy) | duplicate, clone | Copy |
| Delete | `trash` | [Tabler](https://tabler.io/icons?icon=trash) | delete, destroy | Delete |
| Download | `download` | [Tabler](https://tabler.io/icons?icon=download) | save to file, export file | Download |
| Edit | `pencil` | [Tabler](https://tabler.io/icons?icon=pencil) | modify, rename, update | Edit |
| Expand (window) | `arrows-diagonal` | [Tabler](https://tabler.io/icons?icon=arrows-diagonal) | fullscreen, expand, maximize | Expand |
| Filter | `filter` | [Tabler](https://tabler.io/icons?icon=filter) | narrow, refine, search filters | Filter |
| Hide | `eye-off` | [Tabler](https://tabler.io/icons?icon=eye-off) | hide; conceal, invisible, toggle visibility | Hide |
| Link | `link` | [Tabler](https://tabler.io/icons?icon=link) | hyperlink, relationship, connected | — |
| More options (menu opens above or below) | `dots-vertical` | [Tabler](https://tabler.io/icons?icon=dots-vertical) | overflow, actions, kebab menu | — |
| Notifications | `bell` | [Tabler](https://tabler.io/icons?icon=bell) | alerts, notification center | Notifications |
| Open external link | `external-link` | [Tabler](https://tabler.io/icons?icon=external-link) | open in new tab, link out | Open |
| Publish | `rocket` | [Tabler](https://tabler.io/icons?icon=rocket) | deploy, release, go live, launch | Publish |
| Redo | `arrow-forward-up` | [Tabler](https://tabler.io/icons?icon=arrow-forward-up) | step forward, redo | Redo |
| Refresh | `reload` | [Tabler](https://tabler.io/icons?icon=reload) | reload page, refresh view | Refresh |
| Remove / Close | `x` | [Tabler](https://tabler.io/icons?icon=x) | close, dismiss, remove, exit | Close, Remove |
| Save | `check` | [Tabler](https://tabler.io/icons?icon=check) | save changes, confirm, persist, write | Save |
| Search | `search` | [Tabler](https://tabler.io/icons?icon=search) | find, look up, query | Search |
| Settings | `settings` | [Tabler](https://tabler.io/icons?icon=settings) | configure, preferences, gear | Settings |
| Share | `share` | [Tabler](https://tabler.io/icons?icon=share) | send, distribute, invite | Share |
| Show | `eye` | [Tabler](https://tabler.io/icons?icon=eye) | show; reveal, visible, unhide | Show |
| Sync | `refresh` | [Tabler](https://tabler.io/icons?icon=refresh) | synchronize, pull latest, update data | Sync |
| Undo | `arrow-back-up` | [Tabler](https://tabler.io/icons?icon=arrow-back-up) | revert, undo, step back | Undo |
| Upload | `upload` | [Tabler](https://tabler.io/icons?icon=upload) | import from file, attach | Upload |

**Navigation icons**

Navigation icons represent spatial or positional concepts that help users understand where they are, where they can go, or how to move through an interface. They typically appear in structural, persistent components like sidebars, top bars, breadcrumbs, tabs, and pagination controls.

| Concept | Icon name | Source | Keywords / aliases | Accepted labels |
|---|---|---|---|---|
| App switcher | `grid-dots` | [Tabler](https://tabler.io/icons?icon=grid-dots) | apps, modules, switcher, launcher | — |
| Back | `arrow-left` | [Tabler](https://tabler.io/icons?icon=arrow-left) | back, go back, previous, navigate back | Back |
| Home | `home` | [Tabler](https://tabler.io/icons?icon=home) | root, dashboard, start, homepage | Home |
| Open | `chevron-down` | [Tabler](https://tabler.io/icons?icon=chevron-down) | expand, open, closed or opened state | — |
| Close | `chevron-up` | [Tabler](https://tabler.io/icons?icon=chevron-up) | collapse, close, opened state | — |
| Open, Next page | `chevron-right` | [Tabler](https://tabler.io/icons?icon=chevron-right) | expand, open, closed state, next, right | — |
| Last page, skip | `chevrons-right` | [Tabler](https://tabler.io/icons?icon=chevrons-right) | last page, pagination, skip to end | — |
| Previous page | `chevron-left` | [Tabler](https://tabler.io/icons?icon=chevron-left) | previous, left | — |
| First page, skip | `chevrons-left` | [Tabler](https://tabler.io/icons?icon=chevrons-left) | first page, pagination, skip to start | — |
| Location | `map-pin` | [Tabler](https://tabler.io/icons?icon=map-pin) | place, geographic, anchor, location, plant, site, rig, factory, warehouse | — |
| Sign in | `login-2` | [Tabler](https://tabler.io/icons?icon=login-2) | log in, authenticate, sign in | Sign in |
| Sign out | `login` | [Tabler](https://tabler.io/icons?icon=login) | log out, sign out, exit session | Sign out |

**Branded icons**

Rare exceptions (third-party or Cognite logos inside a cell) use **provided SVGs only** — same rules as app icons for distortion and clear space; color may be multi-hue **only** when the asset is the official brand mark.

**Accessibility**

- **Must** meet **4.5:1** contrast against the icon’s background (same bar as body text when the icon communicates meaning).
- **Must** give icon-only controls an accessible name (`aria-label` / `aria-labelledby`) **and** a
**Tooltip** on hover/focus where the design hides the text label.
- Icons that only repeat the meaning of adjacent visible text **should** be `aria-hidden="true"`.

### Motion (reference)

#### Motion

**What this is:** the rules for **when**, **how fast**, and **how** something should move in Aura-based UIs — durations, easing curves, and which properties to animate — so engineers and agents pick consistent motion instead of inventing values per component. 

**Motion roles**

Every animation plays one of two roles. Role determines how visible, fast, and expressive it should be.

- **Productive motion** — supports without drawing attention: menus opening, content fading in, cards rearranging, tooltips. **Must** be fast, subtle, and functional — barely conscious, but noticeably missing if removed.
- **Expressive motion** — motion people are meant to see: AI generating a response, a view transition, onboarding. **Should** take more time, use more of the aurora accent language, and be more visible — these are the moments that give Aura character.
- **Must not** let productive motion compete with whatever the user is actually focused on.

**Timing**

- **Must** scale duration to distance and area: small, local changes (checkbox, toggle) get shorter durations; large or page-level transitions get longer ones. Values are relative to each other within one experience, not absolute.
- Reference bands: **short** motion (state changes, small components) stays under **~200ms**; **longer** expressive transitions (page-level, content entrances) run **~400–500ms**.
- **Should** use **stagger** — a timing offset between elements animating in sequence rather than all at once — for groups of similar items (list rows, dashboard cards, revealed menu items). Typical offset: **~30–35ms per item**.
- **Must not** apply stagger to elements leaving the screen — exits animate together, without a staggered trail.
- **Should** make exits slightly quicker than entrances for the same element — once the user has acted, the UI does not need to hold their attention on the way out.

**Easing**

Easing is the rate of speed change — it makes motion feel physical rather than mechanical. Use `cubic-bezier` curves, not linear or default browser easing.

| Curve | cubic-bezier | Use |
| :--- | :--- | :--- |
| Standard | `(0.40, 0.00, 0.15, 1.00)` | Motion between two states — most repositioning and in-view transitions |
| Entrance | `(0.00, 0.00, 0.15, 1.00)` | Elements appearing — decelerates into place, arrives with momentum and lands softly |
| Exit | `(0.67, 0.00, 0.83, 0.83)` | Elements leaving — accelerates away, lifts off and clears the view decisively |
| Sine | `(0.33, 0.00, 0.67, 1.00)` | Near-linear; opacity fades and subtle color shifts where a strong ease would distract |

- **Should** treat heavier or larger elements as slower to start and more settled on arrival; lighter, smaller elements can respond and land more quickly.
- **Must not** let easings overshoot or bounce — restraint is part of the Aura feel (see **Animation anchors**, Calm).

**Tailwind implementation**

Aura has no custom `duration-*`/`ease-*` theme tokens — use [Tailwind's transition utilities](https://tailwindcss.com/docs/transition-duration) directly, matching existing components (`accordion.tsx`, `tabs.tsx`, `segmented-control.tsx`):

| Concept | Tailwind utility |
| :--- | :--- |
| Duration | `duration-150` / `duration-200` / `duration-300`, or an arbitrary value like `duration-[233ms]` for values off the default scale |
| Standard / Entrance / Exit / Sine easing | Tailwind's built-in `ease-*` keywords don't match Aura's curves — use an arbitrary value, e.g. `ease-[cubic-bezier(0.40,0.00,0.15,1.00)]` |
| Which properties animate | `transition-[property-list]`, e.g. `transition-[top,left,width,height]` (see `tabs.tsx`), rather than the broader `transition-all` |
| Stagger | `delay-[Nms]` per item (arbitrary value, since Tailwind has no stagger primitive), or `[animation-delay:Nms]` when using `@keyframes` |
| Respect reduced motion | Prefix with `motion-safe:` (already used in `tabs.tsx`, `segmented-control.tsx`) so the transition is skipped for users with reduced-motion enabled |

**What to animate**

Every animation is built from a combination of these properties:

| Property | Use |
| :--- | :--- |
| Position | Moving elements on screen — the most common property for entrances, exits, and layout transitions |
| Scale | Growing or shrinking — drawing attention or showing hierarchy |
| Rotation | Less common in UI; adds dynamism when used with restraint |
| Opacity | Fading in/out — often paired with position or scale for softer transitions |
| Color | Shifting an element's color — state changes, hover feedback, the aurora accent language |
| Mask / morph | Revealing through a mask or transforming one shape into another — expressive moments, progressive disclosure |

- **Should** combine 2–3 properties per transition (e.g. position + opacity) rather than relying on one alone.
- **Avoid** animating more properties than the moment needs — restraint keeps productive motion productive.

**Animation anchors**

Three qualities every Aura animation should reinforce. Use them to test a motion design, not as literal component names.

- **Flow** — continuity. Elements arrive and leave with direction and connection; nothing jumps or teleports. Groups reveal with a natural stagger. *Test: can I follow the motion with my eyes without losing my place?*
- **Calm** — confidence in restraint. Motion never competes with the industrial data it's presenting. Easings don't overshoot, staggers don't drag, nothing bounces when it should settle. Calm does not mean slow — most motion is quiet **and** fast. *Test: does this still feel good after 8 hours of use?*
- **Tactile** — motion builds intuition. Buttons snap, panels slide from the edge they belong to, cards lift when selected — the way something moves signals what's possible before the user thinks about it. *Test: can I tell what's interactive just by how it moves?*

**Reference example — anatomy of a transition**

Illustrative breakdown of a dropdown + content entrance, showing how role, timing, easing, and stagger combine (values are examples, not fixed tokens):

- **Dropdown open** (~233ms total): panel expands with **entrance easing**, 200ms — `transition-[height] duration-200 ease-[cubic-bezier(0.00,0.00,0.15,1.00)]`; list items fade in with a **33ms stagger** per item — `transition-opacity duration-150` plus `delay-[calc(var(--item-index)*33ms)]` (or per-item inline `style={{ transitionDelay: … }}` when the index isn't known at build time).
- **Dropdown close** (~233ms total, faster exit): panel and list items fade out together with **exit easing**, no stagger on the way out — `transition-[height,opacity] duration-150 ease-[cubic-bezier(0.67,0.00,0.83,0.83)]`; button copy cross-fades to the new selection with a brief accent wipe for confirmation.
- **Content entrance** (~467ms total, expressive): main content scales in from 110% with **entrance easing** — `transition-[transform,opacity] duration-[300ms] ease-[cubic-bezier(0.00,0.00,0.15,1.00)]`; supporting elements (buttons, separators) follow with a **~100–133ms stagger** via `delay-[100ms]`/`delay-[133ms]`; any internal line/chart animation runs slower and separately so it doesn't compete for attention.

---

## Heuristics

**What this section is:** The short interaction contract for Aura-based UIs. It keeps the design identity usable by agents and reviewers without turning this file into a full UX playbook.

This section contains Aura's decision rules, component selection guidance, and common failure modes. Severity terms carry specific meaning: **Must** / **must not** breaks usability, accessibility, or system conformance; **Should** is the strong default; **Avoid** is a known failure mode.

These rules apply to Aura primitives, host-shell components themed with Aura tokens, and standalone apps using Aura. Component props and enum names live in the component APIs, not in this spec.

### Aura vs. your responsibility

Aura components handle many accessibility concerns automatically. Composition, copy, focus management, and page structure remain the implementer's job.

| Concern              | Aura handles                                       | You verify                                   |
| --------------------- | --------------------------------------------------- | --------------------------------------------- |
| Focus indicators      | `shadow-focus-ring` on interactive elements         | Not hidden by `overflow` or `z-index`        |
| Keyboard activation    | Button: Enter/Space. Input: standard keys           | Custom elements also respond                  |
| ARIA roles             | Correct roles on Dialog, SegmentedControl, etc.     | Custom components declare correct roles       |
| Color contrast         | Token pairs designed for AA compliance              | Page backgrounds don't reduce contrast        |
| Dark mode              | Semantic tokens adapt automatically                 | Custom colors also work in dark mode          |
| Disabled states        | Communicated via `aria-disabled`                    | Reason for disabled is accessible             |
| Focus trapping         | Dialog traps focus while open                       | Focus returns to the trigger element on close |

---

### 1. Feedback and system status

Users must always know whether the system is waiting, succeeded, failed, or needs action.

- **Must** show loading for any wait the user is expected to sit through. Use **Shimmer** or **Skeleton** when the incoming layout is known, **Loader** for compact waits, and **Progress** when completion is measurable.
- **Must** acknowledge user-triggered mutations with visible feedback. Use a transient toast for low-stakes confirmations, inline feedback for scoped changes, and **Dialog** / shell **AlertDialog** before irreversible actions.
- **Must** surface persistent workflow-impacting problems until dismissed or resolved. Use **Banner** for high-priority degraded states, **Alert** for page-scoped awareness, and **Badge** or compact status rows for repeated entity state.
- **Avoid** blank loading areas, stacked toasts for one gesture, repeated Alert lists, and using **Banner** for routine connection handshakes.

### Alert vs Banner vs Badge vs Sonner

Use this matrix to pick the right feedback component. Priority is defined by whether the message requires immediate action and how long it needs to persist.

| Priority   | When                                                            | Components                                                                | Notes                                                                                                                                                                              |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Low**    | Non-disruptive updates, minor status, validation hints          | `Badge`, notification dot, inline `HelperText`                            | Does not interrupt the user. Badge for entity state; HelperText for field-level feedback.                                                                                          |
| **Medium** | Informative, occasionally actionable, not urgent                | `Sonner` (toast), `Alert`                                                 | Sonner for transient confirmations (~4 s, bottom-right). Alert for inline, page-scoped status that needs awareness but not immediate action (typically one per page section/view). |
| **High**   | Requires immediate attention or action; may interrupt task flow | `Banner` (system errors), `Dialog` / `AlertDialog`, full-page error state | Banner for persistent, region-scoped degraded states. Dialog for irreversible actions. Never use Sonner as the sole safety net for destructive work.                               |

**Rules**

- **Must not** use Banner for low-priority or transient notices — it occupies persistent chrome and dilutes high-priority signals.
- **Must not** use Sonner for errors that require user action — it auto-dismisses.
- **Must not** use repeated Alerts as a list visualization pattern; one Alert communicates the grouped situation, while item-level status belongs in Badge/status-card patterns.
- **Should** use `Badge` semantic variants (`warning`, `destructive`, `success`) on entities that carry that state, not as page-level alerts.
- **Avoid** stacking multiple Sonner toasts for a single user gesture.

**Industrial / operational states**

The matrix above covers standard cases. For domain-specific states (e.g. sensor offline, process limit breach, control system degraded), apply the same priority logic: does the user need to act now? -> Banner or Dialog. Informational? -> Alert or Badge on the asset. Transient confirmation? -> Sonner. When many entities share similar state, summarize once (Alert/Banner) and show per-entity state with Badge or status cards.

---

### 2. Affordance and discoverability

Controls must read as interactive; users should not guess what is clickable, expandable, editable, or destructive.

- **Must** use semantic controls for actions, links, form fields, menus, and disclosure. Do not make generic elements behave like buttons.
- **Must** match component variant to intent: primary for one main action, secondary or ghost for support, destructive only for irreversible work.
- **Must** pair every field with a visible **Label**. Placeholder text is not a label.
- **Must** give icon-only controls both an accessible name and a **Tooltip**.
- **Should** use recognizable signifiers: chevrons for menus and disclosure, magnifier icons for search, helper text for constraints, and empty-state cards with an explanation plus a next action.
- **Avoid** clickable text that looks identical to body copy or help that exists only in hover on touch-first flows.

---

### 3. Progressive disclosure

Introduce complexity only when needed; default views should stay scannable.

- **Must** use **Accordion** for stacked independent sections and **Collapsible** for one inline expandable block.
- **Must** use **Dialog** for modal tasks and shell **Drawer** / **Sheet** for secondary edge panels where the host provides them.
- **Must** split flows with 3 or more steps into discrete steps with visible progress.
- **Must** scope menu items to the entity they affect. Do not mix row actions, page actions, and global actions in one menu.
- **Should** keep advanced settings, rare metadata, and secondary actions behind disclosure when they are not needed for the main task.
- **Avoid** deeply nested accordions, long flat menus, and multiple irreversible primary decisions in one step.

---

### 4. Error handling and prevention

Prevent errors where possible. When errors happen, users must understand what failed, why it matters, and how to recover.

- **Must** confirm high-impact destructive actions before execution. Name the object and consequence; do not ask only "Are you sure?".
- **Must** label destructive confirmation with the specific action, such as "Delete report", not "OK" or "Confirm".
- **Must** show form errors inline on the affected field and explain how to fix them.
- **Must** protect unsaved work with auto-save where feasible, persistent unsaved state where not, and a discard warning before navigation.
- **Should** offer **Undo** for reversible destructive actions when recovery is cheap and contained in the same session.
- **Must** validate fields on blur, not on every keystroke.
- **Must** preserve user input on a failed submission — never clear the form.
- **Must** move focus to the first invalid field after a failed submission and announce the error via `aria-live`.
- **Avoid** using toast as the only safety net for irreversible work or revealing every validation error only on final submit.

**Field validation states**

Not every field type needs every validation kind. Use this to scope what to implement:

| Field type    | Required | Format | Length   | Range        | Uniqueness |
| ------------- | -------- | ------ | -------- | ------------ | ---------- |
| Text input    | Yes      | —      | Optional | —            | Optional   |
| Email input   | Yes      | Yes    | —        | —            | Optional   |
| Password      | Yes      | Yes    | Yes      | —            | —          |
| Number input  | Yes      | —      | —        | Yes          | —          |
| Date picker   | Yes      | —      | —        | Yes          | —          |
| Textarea      | Yes      | —      | Yes      | —            | —          |
| Select        | Yes      | —      | —        | —            | —          |
| Combobox      | Yes      | —      | —        | —            | —          |
| Checkbox      | —        | —      | —        | —            | —          |
| File upload   | Yes      | Yes    | —        | Yes (size)   | —          |

**Edge cases**

- Destructive action with undo? Still confirm — mention the undo window in the dialog body ("You can undo within 30 seconds").
- Bulk delete? One confirmation naming the count ("Delete 12 reports?"), not one per item.
- Auto-save? Use a subtle persistent "Saved" indicator, not a toast on every save.
- Error partway through a multi-step flow? Don't lose progress — show the error on the current step and let the user retry from there.

---

### 5. Enabling power users

Experts should move faster without harming first-time clarity.

- **Should** provide shortcuts for the top few high-frequency actions and render them with Aura shortcut components.
- **Should** align shortcuts with platform norms where they do not fight the browser or operating system.
- **Must** support multi-select in list or table UIs that offer per-row destructive or batch actions.
- **Must** show bulk action controls only when selection is non-empty, with selected count.
- **Must** use structured empty states for first use or no data: title, explanation, and one clear next action.
- **Avoid** bulk destructive work without confirmation, stealing reserved shortcuts, or using **Banner** for long onboarding tours.

---

### 6. Layout and hierarchy

Information must be scannable and oriented before action.

- **Must** group related fields and content in one **Card** or labeled section.
- **Must** separate unrelated groups with spacing, section labels, or **Separator** before adding nested borders.
- **Must** keep one clear primary CTA per view. Global actions belong in shell chrome; page actions belong in the page header or toolbar.
- **Must** use shell **Tabs** / **SegmentedControl** for primary view switching where the product uses that pattern; do not duplicate global navigation in content.
- **Should** use type scale, weight, and spacing to lead attention before using color or elevation.
- **Avoid** unrelated actions in the same card, hard-coded pixel widths, duplicated navigation, and destructive styling for non-destructive actions.

---

### 7. Accessibility and inclusive design

Aura targets **WCAG AA** for primitives — usage must preserve that.

- **Must** complete every task path with keyboard alone.
- **Must** keep visible focus treatment on every interactive control. Never use `outline-none` or `ring-0` without an equivalent Aura focus ring.
- **Must** preserve primitive roles and ARIA behavior when composing or wrapping Aura components.
- **Must** name icon-only controls and pair them with a **Tooltip**.
- **Must not** encode meaning with color alone. Pair color with text, icon, helper text, or label.
- **Must** meet contrast and target-size requirements for the shipped context.
- **Must** follow visual/reading order for tab order, with no keyboard traps; add a skip-to-content link on pages with complex navigation.
- **Must** use heading levels in strict sequential order: one `H1` per page, never skip a level, and never use a heading tag purely for visual sizing — use the Typography scale instead.
- **Avoid** pointer-only behavior, unreadable `muted-foreground` copy for required tasks, and sub-24px icon hit zones without expansion.

**Alt text and icon naming**

| Type                    | Approach                    | Example                              |
| ------------------------ | ---------------------------- | ------------------------------------- |
| Informational image      | Describe the content         | `alt="Chart: output up 20%"`         |
| Decorative image         | Empty                        | `alt=""`                              |
| Icon-only control        | `aria-label` on the control  | `aria-label="Delete report"`         |
| Icon paired with a label  | Hide the icon                | `aria-hidden="true"` on the icon      |

**Announcing dynamic content**

| Scenario              | Method                                       |
| ---------------------- | --------------------------------------------- |
| Search/list results update | `aria-live="polite"`                     |
| Form error              | `aria-live="assertive"`                     |
| Toast                   | Handled by the toast component               |
| Dialog opens            | Focus moves into the dialog (Aura handles)   |
| Dialog closes           | Return focus to the trigger element          |

### Common pitfalls (agent guidance)

These are the most frequent mistakes when generating or modifying Aura-based UI. Avoid all of them.

- Raw hex, `rgb(...)`, or arbitrary Tailwind colors in product UI.
- Visual `className` overrides that bypass Aura variants, props, or tokens.
- Duplicate shell navigation inside content.
- Cards that mix unrelated actions, unrelated data, and dense nested borders.
- Semantic, decorative, and chart colors used interchangeably.
- Icon-only controls without accessible names and tooltips.
- Disabled primary CTAs with no visible path to resolve the blocker.

### Verifying accessibility

**Self-check before shipping a page**

- [ ] Tab through all elements in logical order
- [ ] Every button/link works with Enter/Space
- [ ] Every dialog opens/closes with keyboard, and Escape closes dialogs, popovers, and dropdowns
- [ ] Every image has appropriate alt text; every form field has a visible label
- [ ] Non-color indicator present for every status
- [ ] Headings follow H1 → H2 → H3 with no skipped levels
- [ ] Dynamic updates are announced to screen readers
- [ ] Focus ring (`shadow-focus-ring`) is visible on all interactive elements

**Tooling**

- Automated: WAVE, axe DevTools, or Lighthouse in Chrome DevTools.
- Manual: unplug the mouse and complete primary tasks keyboard-only; spot-check critical flows with VoiceOver (Mac) or NVDA (Windows).

**Accessibility edge cases**

- Complex data visualization? Provide a text summary via `alt` or screen-reader-only text.
- Drag-and-drop? Requires a keyboard alternative.
- Real-time dashboard? Use `aria-live="polite"`, not `"assertive"` — frequent updates should not interrupt the user.
- Third-party embed? Give the `iframe` a descriptive `title`.

---

## Interaction states

**What this section is:** What each interaction state _means_ for users, which **Tokens** and patterns Aura uses, and rules for custom controls built outside the library. **How** to wire `focus-visible`, CVA variants, or component props belongs in code and engineering skills.

Every interactive control signals what is possible, what is happening, and what the system registered. **States are signifiers** — visual cues for affordances (what the element _can_ do). Using them consistently builds trust and keeps keyboard and assistive-tech use predictable.

| Concept        | Meaning                                                                                |
| -------------- | -------------------------------------------------------------------------------------- |
| **Affordance** | A property that makes an action possible (e.g. a control can be activated).            |
| **Signifier**  | A visible cue that communicates that affordance (shape, label, shadow, state styling). |

Aura primitives ship these states by default; the rules below describe the **design contract** and apply when extending Aura or building one-off interactives.

### Default (enabled)

The **resting** state: the element is available without shouting over neighboring content. Weight follows importance — a **primary** action reads stronger than a **table row** or **list item**. Match prominence to the action’s priority (see **Tokens** for `primary-background`, `muted-background`, `accent-background`, etc.).

### Hover

The pointer is over the element; hover confirms interactivity before commitment.

**Guidance**

- **Must** change visibly from default — usually a background shift (`accent-background`, `primary-background-hover`, `secondary-background-hover`) or stroke emphasis (`border-emphasized` on outlines).
- **Should** feel immediate (no intentional lag on hover feedback).
- **Must not** be the **only** cue for something critical — hover is absent on many touch and reduced-motion contexts.
- **May** add elevation (`shadow-*`) on hover for objects that already read as “cards” or panels — **sparingly**, only where elevation matches the metaphor.

### Pressed

Pointer or finger is **down** on the control; confirms input was received.

**Guidance**

- **Must** read clearly **stronger or “deeper”** than hover (darker/lighter fill step, or subtle scale / inset — within the same token family, not a new ad-hoc color).
- **Should** appear within about **one frame** of the gesture; duration is short and ends on release.

### Focused

Keyboard or assistive tech has moved focus to the element. This is the main non-pointer signal for “where am I?” and is required for accessibility.

**Guidance**

- **Must** show a **visible** focus indicator on every interactive control. Do not remove focus styling without replacing it with an equivalent that meets contrast rules.
- **Must** use Aura’s **token-based focus ring** — `shadow-focus-ring` (CSS variable `--shadow-focus-ring`, composed from `ring` + `ring-muted` tokens) for default controls, and **`shadow-focus-ring-destructive`** / `--shadow-focus-ring-destructive` for invalid or destructive fields. Shared utilities in the library pair `outline-none` **with** these rings on `:focus-visible` — never `outline-none` or `ring-0` **alone**.
- **Must** meet **WCAG AA** for the focus indicator against its immediate background.
- **Should** use **`:focus-visible`** (or library equivalents) so pointers do not get a keyboard ring on every click, while keyboard users always see one.
- **Invalid inputs:** on focus, use the **destructive** focus ring token pair above (see **Elevation & Depth → Focus rings**).

### Disabled

The control is present but **not** actionable in the current context; it does not respond to hover, press, or activation.

**Guidance**

- **Must** use **`disabled-background`** and **`disabled-foreground`** — not generic opacity on top of default colors unless a component API explicitly documents that pattern.
- **Must not** show hover, pressed, or focus styling that implies activation (disabled is inert).
- **Should** pair unexplained disabled controls with a **Tooltip** or inline hint (“Complete required fields to continue”) so users know how to re-enable.
- **Avoid** using disabled as the main pattern for “not yet allowed” flows — prefer hiding the action, an inline message, or a clear path to fix the blocker.
- **Avoid** disabling the **primary** CTA without a visible way to resolve the blocking condition.

### Selected (toggled)

Persistent **on/off**, **selected**, **active filter**, or **applied setting** until the user changes it.

**Guidance**

- **Must** use **`active-background`** / **`active-background-hover`** or **`active-muted-background`** / **`active-muted-background-hover`** (and matching foreground tokens such as **`foreground-on-active`**, **`active-foreground`**) — **not** semantic status colors (`info-`*, `success-`*, …) for generic toggles.
- **Must not** rely on **color alone** — combine fill with icon, checkmark, label, or border treatment where the pattern is ambiguous.
- **Must** implement **hover**, **pressed**, and **focus** for the **selected** variant as well as the default variant when both exist.
- **Must not** show “selected” visuals for controls that are not actually in a selected state.

### Loading

Work is **in progress**; the control or region may be temporarily inert or show progress.

**Guidance**

- **Must** expose busy state accessibly where appropriate (`aria-busy`, progress semantics, or an accessible name that includes “Loading”).
- **Should** use Aura **Loader** / **Skeleton** / **Shimmer** (or documented equivalents) instead of ad-hoc spinners that ignore motion and contrast tokens.
- **Should** read differently from **disabled** when the user can still cancel, navigate away, or understand wait time — disabled means “you cannot act here”; loading means “wait or observe progress.”

---

## Content

**What this section is:** Conventions for **Fusion monorepo UI copy** in Aura-based surfaces: action labels, date and time presentation, grammar and style, localization, voice and tone, and writing that supports accessibility. Use it with **Heuristics** and **Interaction states** when designing or implementing strings.

**Who:** Designers, product writers, engineers, and agents generating microcopy.

**Scope:** English UI strings authored in the Fusion monorepo unless a feature explicitly ships localized strings. Numeric date order and clocks follow the host platform `dateTime` configuration. Product naming, white-labeling policy, and market-facing terminology are owned by product documentation and brand guidance; this section covers in-product microcopy patterns that Aura surfaces should follow.

### Role

You are writing interface copy for Fusion applications. Every string must be purposeful, concise, conversational, and clear. Identify the target audience persona before writing; the persona determines reading level, technical vocabulary, and tone.

For code-level accessibility (keyboard navigation, ARIA, focus, headings, live regions), see `handling-states.md`.

### Audience personas

Canonical persona definitions live in the cogdocs repository (`cogdocs/cogdocs-metadata.mdx`, **Audience** section). This summary covers what matters for microcopy decisions.

| Persona                 | Technical level | UX copy implication                                                             |
| ----------------------- | --------------- | ------------------------------------------------------------------------------- |
| `businessUser`          | Low             | Plain language; outcomes over features; domain terms OK, avoid platform jargon  |
| `businessDecisionMaker` | Low             | Plain language; ROI, business value, strategic impact; minimal technical detail |
| `appMaker`              | Mid             | Configuration, automation, outcomes; avoid deep code/API detail                 |
| `dataAnalyst`           | Mid             | Analytics, insights, dashboards; data terms OK, keep explanations clear         |
| `partner`               | Mid–high        | Precise; balance technical accuracy with clarity                                |
| `administrator`         | High            | Technical terms OK; reliability, security, compliance, access; be precise       |
| `dataEngineer`          | High            | Technical terms OK; pipelines, ingestion, transformation                        |
| `developer`             | High            | Technical terms OK; APIs, SDKs, integrations; precise and concise               |
| `aiEngineer`            | High            | Technical terms OK; ML/AI, models, automation                                   |
| `dataScientist`         | High            | Technical terms OK; experiments, models, analytics                              |
| `securityEngineer`      | High            | Technical terms OK; IAM, threats, compliance                                    |
| `solutionArchitect`     | High            | Technical terms OK; integration, strategy, best practices                       |
| `internal`              | Varies          | Can use Cognite-internal jargon; match internal conventions                     |

**Reading level:** Low = 7th–8th grade; Mid = 9th–10th grade; High = 10th–11th grade.

When the persona is unknown, default to plain language and outcomes.

### Voice and tone

Voice is consistent; tone adapts to the user's emotional state.

| Scenario                | Tone                      | Example                                                                        |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------ |
| First-time onboarding   | Friendly, welcoming       | "Let's get started. Your workspace is ready when you are."                     |
| Technical documentation | Clear, direct, supportive | "Configure your endpoint and authenticate using your API key."                 |
| Error messages          | Empathetic, constructive  | "Something went wrong. Try refreshing, or check your connection."              |
| Success states          | Encouraging, concise      | "Your data is now flowing."                                                    |
| Product tours / help    | Conversational, helpful   | "Want a quick tour? We'll walk you through the essentials in under 2 minutes." |
| High-stakes actions     | Serious, transparent      | "Delete pipeline? All history will be permanently removed."                    |

### Grammar and style

#### Language and capitalization

- **American English**: color, center, organization, modeling
- **Sentence case everywhere**: "Create data model" — not "Create Data Model". No exceptions for UI text. Only proper nouns and product names are capitalized: Fusion, OPC-UA, Aura.
- **No all-caps**
- **No internal codenames** in customer-facing UI copy; use the feature or resource name users recognize.

#### Numbers and units

- **Numerals for all numbers**, including those under 10: "6 queries", "3 items", "1 result"
- Non-breaking space between number and unit: "50 Mbps"
- Don't use "(s)" or "(es)" — choose singular or plural based on context

#### Abbreviations and punctuation

- No Latin abbreviations: use "for example" not "e.g.", "and more" not "etc."
- Define acronyms and technical terms when first used (unless writing for technical personas)
- No ampersands (&): use "and" — including in headings
- **Oxford comma**: "apples, oranges, and pears"
- No exclamation marks in UI copy
- No period after labels, tooltip text, or single-sentence bulleted list items; use periods for multiple/complex sentences
- Ellipsis (…): only for ongoing processes or truncated text — use sparingly

#### Pronouns

- Don't mix "my" and "your" in the same context
- **"My [resource]"** for app-owned items: "My data", "My assets"
- Minimize "I" and "we" representing the application; focus on the user's perspective
- Avoid ambiguous pronouns ("this", "that") without an explicit referent — name the thing

### Action labels

Use sentence case with an object: "Edit model", "Delete asset".

#### Approved labels

| Label              | Use when                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| Add                | Taking an existing object into a new context ("Add to canvas")              |
| Apply              | Setting filtered values that affect subsequent system behavior              |
| Approve            | User agrees; initiates next step in a business process                      |
| Back               | Returning to the previous step in a sequence or hierarchy                   |
| Cancel             | Stopping the current action or closing a modal — warn of data loss          |
| Clear              | Clearing all fields/selections; restores defaults                           |
| Close              | Closing a page, panel, or secondary window — often icon-only                |
| Copy               | Copying an object to the clipboard                                          |
| Create             | Making a new object from scratch                                            |
| Delete             | Permanently destroying an object                                            |
| Discard            | Discarding unsaved changes during create/edit                               |
| Download           | Transferring a file from remote to local                                    |
| Duplicate          | Creating a copy in the same location as the original                        |
| Edit               | Changing data/values of an existing object                                  |
| Export             | Saving data in an external format; typically opens a dialog                 |
| Import             | Bringing data from an external source; typically opens a dialog             |
| Next               | Advancing to the next step in a wizard                                      |
| Finish             | Completing a multi-step wizard                                              |
| Open               | Opening a drawer, modal, or new page within current context                 |
| Publish            | Making content available to intended users                                  |
| Refresh            | Reloading a view that is out of sync with the source                        |
| Register           | Creating a new user account                                                 |
| Remove             | Removing an object from the current context without destroying it           |
| Reset              | Reverting to last saved or default state                                    |
| Save               | Saving pending changes without closing the window/panel                     |
| Search             | Goal-oriented action to find precise information                            |
| Select             | Choosing one or more options from a list                                    |
| Show / Hide        | Revealing or removing an element from view without deleting — use as a pair |
| Sign in / Sign out | Entering or exiting the application                                         |
| Undo / Redo        | Reversing or re-applying the most recent action                             |
| Upload             | Transferring a file from local to remote                                    |
| View               | Presenting additional information or properties for an object               |

#### Labels to avoid

| Avoid                 | Use instead                                 | Reason                           |
| --------------------- | ------------------------------------------- | -------------------------------- |
| Confirm               | The specific action verb ("Delete", "Send") | Too vague                        |
| Log in / Log out      | Sign in / Sign out                          | "Log" is technical jargon        |
| Sign up               | Register                                    | Avoids confusion with "Sign in"  |
| Submit, OK, Yes       | The specific outcome verb                   | Generic; tell users what happens |
| Click here, Read more | Descriptive link text                       | Inaccessible; not input-agnostic |

### UI text patterns

#### Titles

Noun phrases, sentence case. Examples: "Asset overview", "Pipeline runs", "Configure integration"

#### Buttons and CTAs

Active imperative verb + object. 2–4 words target, 6 max. Examples: "Save changes", "Delete pipeline", "View details"

#### Error messages

Pattern: `[What failed]. [Why/context if known]. [What to do].`
Examples:

- "Ingestion failed. Check your extractor configuration and try again."
- "Couldn't save changes. Connection lost. Reconnect and retry."
  Avoid: blame language, dead ends with no recovery path

#### Success messages

Past tense, specific, brief. Pattern: `[Action] [result]`
Avoid "successfully"; that's implied in the pattern
Examples: "Changes saved", "Pipeline started", "Integration configured"

#### Empty states

Explanation + CTA. Example: "No assets yet. Connect a data source to start exploring."

#### Tooltips

One to two sentences, present tense. Pattern: `[What it is]. [What it does or why it matters].`
Examples:

- "Asset ID. The unique identifier for this asset."
- "Time granularity. Controls how data points are aggregated in the chart."
  Never repeat the label. Never write more than 2 sentences.

#### Confirmation dialogs

State the consequence, not just the action. Pattern: `[What will be lost or affected]. [Reversibility]. [Specific action].`

- Primary CTA: match the specific action ("Delete pipeline", not "Confirm")
- Secondary CTA: always provide a clear exit ("Cancel")
  Examples:
- "Delete pipeline? All runs and history will be permanently removed. This can't be undone."
- "Remove team member? They'll lose access to all shared resources immediately."
  Avoid: "Are you sure?", manipulative phrasing

#### Form fields

- **Labels**: Clear noun phrases ("Time series ID", "Email address")
- **Placeholder text**: Use sparingly, only for standard formats like "[name@example.com](mailto:name@example.com)"
- **Helper text**: Verb-first; explain why the information is needed

#### Notifications

Verb-first title + contextual description. 10–15 words total.
Example: "Extractor disconnected. Check your network and reconnect."

### Accessibility

- Use **"Select"** not "Click" — input-agnostic: mouse, keyboard, touch, voice
- Avoid ambiguous pronouns — screen readers lose surrounding context
- Write descriptive link text: "Read pricing details" not "Click here"
- Alt text by image type:
  - Icon → describes function: "Download PDF" not "download icon"
  - Link image → describes destination: "Contact support" not "question mark"
  - Chart/diagram → summarizes meaning: "Bar chart showing pipeline throughput declining 20% in Q3"
  - Decorative image → empty alt text (`alt=""`)
  - Never write "image of" or "photo of"
- For charts and metrics, describe key trends or values in adjacent text — don't rely on visual encoding alone
- Target 8–14 words per sentence (8 = 100% comprehension, 14 = 90%)
- Pair visual indicators with text: "Error: field required" alongside a red icon

### Date and time formatting

- **Prefer written dates**: "2 January 2023" not "02/01/2023"
- **Relative vs absolute**: ≤24 h from now → relative ("32 min ago"); >24 h → absolute ("2 Jan 2023")
- Always include the year unless obvious from context
- No ordinal numbers: "2 January" not "2nd January"
- Separate date and time with "at": "2 Jan 2023 at 10:00 AM" — no comma
- **12-hour time**: uppercase AM/PM, no periods, space before: "10:00 AM"
- **Time zone**: UTC only; spell out "UTC" in text-only contexts
- Never make the user convert time zones — handle in code
- Ranges: consistent format across start and end; for ongoing processes use absolute start + "ongoing" until complete
- Duration: no comma between units ("10 minutes 3 seconds"); space between number and unit in running text ("3 min"); no space in controls ("3min")

**Time unit abbreviations** (no periods; same form singular/plural):
ms, s, min, hr, d, wk, mo, yr

**Day abbreviations** (3 chars for i18n):
Mon, Tue, Wed, Thu, Fri, Sat, Sun

**Month abbreviations** (4 chars for i18n):
Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec

### Localization

- Keep sentences short with the subject near the start — compound clauses increase translation cost
- Maintain consistent terminology and capitalization across strings (critical for translation memory)
- No Latin abbreviations in translatable strings: "for example" not "e.g.", "and more" not "etc."
- Avoid idioms and cultural references
- No ampersands: use "and"
- Small words (a, the, that, is): include in prose; may omit only in space-constrained labels and CTAs
- Short sentences and simple grammar translate more reliably; plan for text expansion in localized UI (e.g. German often adds 30–40% length) with flexible button and title widths, not fixed ones

### Benchmarks

| Element        | Target                   | Maximum       |
| -------------- | ------------------------ | ------------- |
| Buttons / CTAs | 2–4 words                | 6 words       |
| Titles         | 3–6 words, 40 characters | —             |
| Tooltips       | 10–20 words              | 2 sentences   |
| Error messages | 12–18 words              | —             |
| Instructions   | 14 words                 | 20 words      |
| Notifications  | 10–15 words total        | —             |
| Line length    | 40–60 characters         | 70 characters |
