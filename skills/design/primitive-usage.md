# Aura primitive usage guidance (simplified)

## Purpose

Use this file for primitive-level decisions when building Flows and Fusion apps.
It captures usage guidance that is typically missing from component specs and prop tables.

## Resources

Links below must stay usable without Cognite VPN or internal auth. Do not use Cognite-internal short URL domains in this skill.

- Figma library: https://www.figma.com/design/pMnMQvfErZDJzWgrcWCIwZ/WIP---Aura-library
- Aura design system docs: https://cognite-dune-docs.mintlify.app/aura-design-system/index
- Aura Storybook (Fusion preview): https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/
- Storybook path index in this repo (same `/docs/...` paths; hosts may differ): `./storybook-links.md`

## What Aura is

Aura is Cognite's AI-native design system. It provides:
- visual language,
- primitive library,
- usage conventions for app UX.

Always prefer an Aura primitive before building custom UI.

## Guidance tiers

- Foundations: non-negotiable style decisions; use tokens and do not override with raw values.
- Primitives: default building blocks; use these unless there is a clear product reason not to.
- Patterns: repeatable workflows and compositions; use established patterns for consistency across apps.

## Global primitive rules

1. Prefer primitives over custom components.
2. Keep behavior accessible (keyboard activation, focus visibility, and clear state changes).
3. Do not hide critical information if users need fast comparison or repeated switching.
4. When selection is required before action, prefer contextual actions tied to that selection.
5. Use Storybook for exact variants, props, and implementation details.

## Primitive guidance

Storybook links below use the Fusion preview host; paths match `./storybook-links.md`.

### Accordion

**Storybook:** https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-accordion--docs

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

### Action toolbar

**Storybook:** coming soon

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

### Avatar

**Storybook:** https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-avatar--docs

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

### Alert

**Storybook:** https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-alert--docs

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

### Badge

**Storybook:** https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-badge--docs

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

### Banner

**Storybook:** https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-banner--docs

**Definition**
Persistent or dismissible message scoped at page or section level — stronger than inline helper text, broader than a single-field `Alert` in some layouts.

**Use when**
- Announcing environment or product state (maintenance, trial, feature preview).
- Page-wide outcomes that should stay visible while the user continues.

**Use something else when**
- Task-specific guidance inside a flow (`Alert`).
- Brief confirmation after an action (`Sonner Toast`).

### Button

**Storybook:** https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-button--docs

**Definition**
Primary control for discrete actions.

**Use when**
- Committing, navigating a clear next step, or triggering destructive work (with confirmation pattern).

**Dos and don'ts**
- One primary action per logical section when possible.
- Match variant to risk: destructive actions use destructive variant and confirmation.
- Label with verb + object (see `writing-copy.md`).
- Icon-only actions need an accessible name (`aria-label`).

**Often used with**
- `Button Group`, `Dialog` / `Alert Dialog`, forms.

### Dialog and Alert Dialog

**Storybook:** [Dialog](https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-dialog--docs) · [Alert Dialog](https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-alert-dialog--docs)

**Definition**
- **Alert Dialog** — short, focused confirmation or acknowledgment; interrupts for a clear binary or limited choice.
- **Dialog** — richer content: forms, multi-field flows, or explanations that do not fit a strip or inline pattern.

**Use Alert Dialog when**
- Confirming destructive or irreversible actions.
- Blocking until the user chooses a small set of options.

**Use Dialog when**
- Collecting input or showing structured content that needs focus without leaving the page.

**Use something else when**
- Inline persistence is enough (`Alert`).
- Only a quick acknowledgement is needed (`Sonner Toast`).

### Drawer

**Storybook:** https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-drawer--docs

**Definition**
Secondary surface that slides in for filters, detail, or medium-length tasks without a full page change.

**Use when**
- Supporting the main view (filters, record details, auxiliary forms).

**Use something else when**
- The task needs full attention or multi-step wizard treatment (full page or `Dialog`).
- Content is very short (consider `Popover` or inline).

### Empty State

**Storybook:** https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-empty-state--docs

**Definition**
Placeholder when there is no data yet or results are empty.

**Use when**
- Lists, tables, charts, or artifacts have zero rows/points.

**Dos and don'ts**
- Explain what will appear and how to get started.
- Include a single clear CTA when creation/import applies.

### Segmented Control

**Storybook:** https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-segmented-control--docs

**Definition**
Switches between a small number of peer views or modes on the same page.

**Use when**
- Two to several comparable sections (for example overview vs details vs activity).

**Use something else when**
- Content is hierarchical or lengthy and users must open multiple sections at once (consider `Accordion` or visible sections).
- Navigating separate routes (tabs/sidebar patterns — see `building-pages.md`).

**Relationship to Accordion**
- Segmented control swaps visibility of peer panels; accordion stacks expandable sections. Prefer segmented control when users switch modes frequently; accordion when progressive disclosure matters.

### Sonner Toast

**Storybook:** https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-sonner-toast--docs

**Definition**
Lightweight, auto-dismiss feedback for outcomes that do not need a blocking surface.

**Use when**
- Confirming save, delete, or background completion.
- Non-critical notices the user can miss without breaking a workflow.

**Use something else when**
- User must read and act before continuing (`Alert Dialog`, `Dialog`, or persistent `Alert` / `Banner`).

### Table

**Storybook:** https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-table--docs

**Definition**
Dense, scannable display of rows and columns with optional selection and actions.

**Use when**
- Comparing rows, scanning many attributes, or operating on multiple items.

**Use something else when**
- A simple fixed list of links or single-column items (`List`).
- A primary chart or narrative view (`Card`, charts — see Storybook).

**Often used with**
- Selection + **Action toolbar** (when selection-gated actions apply), `Pagination`, `Empty State`, row `Checkbox`, `Dropdown Menu` for row actions.

### Toolbar

**Storybook:** https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-toolbar--docs

**Definition**
Persistent strip of primary tools or filters for a page or region — available without selecting rows first.

**Use when**
- Page-level create/filter/export actions.
- Tools that apply to the whole view or the current query.

**Use something else when**
- Actions apply only after row/item selection (use **Action toolbar** pattern).

### Tooltip, Popover, and Hover Card

**Storybook:** [Tooltip](https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-tooltip--docs) · [Popover](https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-popover--docs) · [Hover Card](https://storybook-aura-22829.fusion-preview.preview.cogniteapp.com/?path=/docs/primitives-hover-card--docs)

**Definition**
- **Tooltip** — short hint on hover/focus; no heavy interaction inside.
- **Popover** — click-triggered panel for interactive or structured supplemental content.
- **Hover Card** — richer preview on hover for entities (profiles, references).

**Use Tooltip when**
- Clarifying a control or icon in one line or sentence.

**Use Popover when**
- User picks options, fills short fields, or reads formatted content on demand.

**Use Hover Card when**
- Previewing related metadata without leaving context.

**Use something else when**
- Content is essential to the task — surface it inline or in `Dialog` / `Drawer`.

## Escalation guidance

If a primitive does not fit:
1. Check Storybook variants/props first.
2. Compose with existing primitives.
3. If still blocked, note the gap and keep implementation consistent with Aura foundations.
