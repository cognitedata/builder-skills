---
name: design
description: Simplified Aura guidance for selecting primitives, keeping token usage consistent, and applying reliable layout/copy/state patterns in Flows and Fusion apps.
allowed-tools: Read, Glob, Grep, Edit, Write
---

## Role

Use Aura as the default UI system for customer-facing product work. Prefer decision-level guidance over exhaustive rules:
- choose the right primitive first,
- apply semantic tokens (no raw values),
- keep layouts and UX states consistent,
- write concise, action-oriented copy.

Use Storybook for component APIs and exact props. Use this skill for "what to choose and when."

<when-to-reference>

Consult this skill whenever you are:

- Creating or migrating interactive UI, forms, tables, navigation, or data display
- Writing or modifying styles, colors, spacing, or typography
- Choosing components, tokens, or layout patterns
- Creating or restructuring pages and responsive layouts
- Writing or editing any user-facing text
- Building forms, handling API responses, async actions, confirmations, or dynamic content
- Implementing accessibility (keyboard, focus, headings, ARIA, alt text)
- Applying Aura correctly in a Flows or React app

</when-to-reference>

<file-routing>

| If you are… | Open |
|-------------|------|
| Choosing primitives and deciding what to use when | `primitive-usage.md` |
| Where to look for Storybook, docs, and Figma (router) | `picking-components.md` |
| Structuring a page or choosing a layout pattern | `building-pages.md` |
| Writing any user-facing text | `writing-copy.md` |
| Forms, loading, errors, confirmations, or page-level accessibility | `handling-states.md` |
| Looking up Storybook URLs for foundations or components | `storybook-links.md` |

</file-routing>

## Operating principles

1. Use Aura primitives before custom UI.
2. Follow foundations through semantic tokens and Aura defaults; do not hardcode raw values.
3. If a primitive almost fits, do not override visuals to force it; check variants/props first, then document the gap.
4. Keep behavior predictable and accessible: keyboard support, visible focus, and clear feedback for loading/success/error.
5. Use `storybook-links.md` for canonical component/foundation URLs.
6. Use publicly reachable links — Aura design system docs (Mintlify), Fusion preview Storybook, and Figma as documented in `primitive-usage.md` and `picking-components.md`.
