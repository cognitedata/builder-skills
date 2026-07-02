# Aura primitive usage guidance (simplified)

## Purpose

Use this file for primitive-level decisions when building Flows and Fusion apps.
It captures usage guidance that is typically missing from component specs and prop tables.

## Resources

Links below must stay usable without Cognite VPN or internal auth. Do not use Cognite-internal short URL domains in this skill.

- Figma library: https://www.figma.com/design/pMnMQvfErZDJzWgrcWCIwZ/WIP---Aura-library
- Aura design system docs: https://docs.cognite.com/aura-design-system
- Aura Storybook: https://master--695bb4b1b8041ae09768950a.chromatic.com/
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

Sections are in alphabetical order. For each component, the Storybook link is the primary reference for variants and props; the docs link is the primary reference for usage and design guidance.

### Accordion

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-accordion--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/accordion

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

### Action Toolbar

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-actiontoolbar--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/action-toolbar

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

### Alert

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-alert--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/alert

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

### Alert Dialog

**Storybook:** Coming soon
**Docs:** https://docs.cognite.com/aura-design-system/primitives/alert-dialog

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

### Avatar

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-avatar--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/avatar

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

### Badge

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-badge--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/badge

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

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-banner--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/banner-alert

**Definition**
Persistent or dismissible message scoped at page or section level — stronger than inline helper text, broader than a single-field `Alert` in some layouts.

**Use when**
- Announcing environment or product state (maintenance, trial, feature preview).
- Page-wide outcomes that should stay visible while the user continues.

**Use something else when**
- Task-specific guidance inside a flow (`Alert`).
- Brief confirmation after an action (`Sonner Toast`).

### Breadcrumb

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-breadcrumb--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/breadcrumbs

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

### Button

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-button--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/button

**Definition**
Primary control for discrete actions.

**Use when**
- Committing, navigating a clear next step, or triggering destructive work (with confirmation pattern).

**Dos and don'ts**
- One primary action per logical section when possible.
- Match variant to risk: destructive actions use destructive variant and confirmation.
- Label with verb + object (see Content guidelines in `./node_modules/@cognite/aura/DESIGN.md`).
- Icon-only actions need an accessible name (`aria-label`).

**Often used with**
- `Button Group`, `Dialog`, forms.

### Button Group

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-button-group--docs
**Docs:** Coming soon

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

### Card

**Storybook:** [Card](https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-card--docs) · [Card with Count](https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-card-with-count--docs)
**Docs:** https://docs.cognite.com/aura-design-system/primitives/card

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

### Checkbox

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-checkbox--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/checkbox

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

### Collapsible

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-collapsible--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/collapsible

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

### Combobox

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-combobox--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/combobox

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

### Command

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-command--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/command

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

### Count

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-count--docs
**Docs:** Coming soon

**Definition**
A compact numeric indicator used to surface quantities inline — for example, unread messages, selected items, or totals attached to labels or tabs.

**Use when**
- Showing a quantity associated with a label, tab, or list item.
- Surfacing unread counts or selection totals without taking primary focus.

**Use something else when**
- The value represents status or category rather than a quantity (use `Badge`).

**Often used with**
- `Tabs`, `Badge`, `Label`, list items.

### Date Picker

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-datepicker--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/date-and-time-picker

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

### Date Range Picker

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-daterangepicker--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/date-and-time-picker

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

### Date Time Range Picker

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-datetimerangepicker--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/date-and-time-picker

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

### Dialog

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-dialog--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/dialog

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

### Drawer

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-drawer--docs
**Docs:** Coming soon

**Definition**
Secondary surface that slides in for filters, detail, or medium-length tasks without a full page change.

**Use when**
- Supporting the main view (filters, record details, auxiliary forms).

**Use something else when**
- The task needs full attention or multi-step wizard treatment (full page or `Dialog`).
- Content is very short (consider `Popover` or inline).

### Dropdown Menu

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-dropdown-menu--docs
**Docs:** Coming soon

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

### Empty State

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-empty--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/empty-state

**Definition**
Placeholder when there is no data yet or results are empty.

**Use when**
- Lists, tables, charts, or artifacts have zero rows/points.

**Dos and don'ts**
- Explain what will appear and how to get started.
- Include a single clear CTA when creation/import applies.

### Form

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-form--docs
**Docs:** Coming soon

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

### Input

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-input--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/input

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

### Label

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-label--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/label

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

### Menu

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-menu--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/menu

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

### Pagination

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-pagination--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/pagination

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

### Popover

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-popover--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/popover

**Definition**
A click-triggered panel for interactive or structured supplemental content. Stays open until dismissed.

**Use when**
- User needs to pick options, fill short fields, or read formatted content on demand without leaving the page.

**Use something else when**
- Content is essential to the task — surface it inline or in `Dialog` / `Drawer`.
- A brief, non-interactive hint is needed (use `Tooltip`).

**Often used with**
- `Button` or icon as trigger, `Command`, form controls inside the panel.

### Radio

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-radio--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/radio

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

### Search

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-search--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/search

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

### Segmented Control

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-segmented--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/segmented-control

**Definition**
Switches between a small number of peer views or modes on the same page.

**Use when**
- Two to several comparable sections (for example overview vs details vs activity).

**Use something else when**
- Content is hierarchical or lengthy and users must open multiple sections at once (consider `Accordion` or visible sections).
- Navigating separate routes (tabs/sidebar patterns — see `building-pages.md`).

**Relationship to Accordion**
- Segmented control swaps visibility of peer panels; accordion stacks expandable sections. Prefer segmented control when users switch modes frequently; accordion when progressive disclosure matters.

### Select

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-select--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/select

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

### Separator

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-separator--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/separator

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

### Skeleton

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-skeleton--docs
**Docs:** Coming soon

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

### Slider

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-slider--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/slider

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

### Sonner Toast

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-sonner--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/sonner

**Definition**
Lightweight, auto-dismiss feedback for outcomes that do not need a blocking surface.

**Use when**
- Confirming save, delete, or background completion.
- Non-critical notices the user can miss without breaking a workflow.

**Use something else when**
- User must read and act before continuing (`Alert Dialog`, `Dialog`, or persistent `Alert` / `Banner`).

### Switch

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-switch--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/switch

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

### Table

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-table--docs
**Docs:** Coming soon

**Definition**
Dense, scannable display of rows and columns with optional selection and actions.

**Use when**
- Comparing rows, scanning many attributes, or operating on multiple items.

**Use something else when**
- A simple fixed list of links or single-column items (`List`).
- A primary chart or narrative view (`Card`, charts — see Storybook).

**Often used with**
- Selection + `Action Toolbar` (when selection-gated actions apply), `Pagination`, `Empty State`, row `Checkbox`, `Dropdown Menu` for row actions.

### Tabs

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-tabs--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/tabs

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

### Textarea

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-textarea--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/textarea

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

### Time Picker

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-timepicker--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/date-and-time-picker

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

### Toggle

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-toggle--docs
**Docs:** Coming soon

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

### Toggle Group

**Storybook:** Coming soon
**Docs:** https://docs.cognite.com/aura-design-system/primitives/toggle-group

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

### Toolbar

**Storybook:** Coming soon
**Docs:** https://docs.cognite.com/aura-design-system/primitives/toolbar

**Definition**
Persistent strip of primary tools or filters for a page or region — available without selecting rows first.

**Use when**
- Page-level create/filter/export actions.
- Tools that apply to the whole view or the current query.

**Use something else when**
- Actions apply only after row/item selection (use `Action Toolbar`).

### Topbar

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-topbar--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/topbar

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

### Tooltip

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-tooltip--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/tooltip

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

### Tree

**Storybook:** https://master--695bb4b1b8041ae09768950a.chromatic.com/?path=/docs/primitives-tree--docs
**Docs:** https://docs.cognite.com/aura-design-system/primitives/tree-view

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
