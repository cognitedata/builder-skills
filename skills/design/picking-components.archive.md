# Picking components and applying tokens (archived snapshot)

Frozen copy of the former full skill doc: component inventory, decision tree, InputGroup sizing, semantic token rules, and builder responsibilities. Prefer **`primitive-usage.md`** for day-to-day primitive choices and **Storybook / Aura docs** for APIs; open this file when you need the long-form tables or migration notes.

---

## Role

You are selecting and implementing UI components and styles for a customer-facing application. Aura provides a complete component library and Tailwind-based semantic tokens. Use the right component for each need — never build custom when Aura covers it.

For props, variants, code examples, and interactive demos, always reference Storybook. This document covers decision-making and builder responsibilities that Storybook does not cover.

For all Storybook URLs, see `./storybook-links.md`.

<aura-references>
Use these sources for Aura documentation:
- Primitives docs: https://cognitedata.github.io/aura/primitives
- Patterns docs: https://cognitedata.github.io/aura/patterns
- Storybook: https://cognitedata.github.io/aura/storybook/
- npm package: https://www.npmjs.com/package/@cognite/aura

Rules:
- Use docs for process and composition guidance.
- Use Storybook for concrete states, variants, and visual behavior.
- Use npm as the source of truth for what is actually installable.
- If a direct docs route returns a 404, open https://cognitedata.github.io/aura/ and navigate from the app shell.
</aura-references>

<setup>
Before changing or migrating any component, read:
- `package.json` — detect package manager and existing UI dependencies
- The app entry file or global stylesheet — confirm where the one-time CSS import belongs
- The target component and any local `shadcn/ui` implementation it currently uses

If the app already hides local UI components behind a wrapper, prefer swapping the internals before changing call sites.

Install Aura with the app's package manager, import the styles once, and import components from `@cognite/aura/components`.
</setup>

<usage-principles priority="critical">
1. Always check this inventory before building anything custom.
2. Use the component as documented in Storybook — do not override its styles (see **No style overrides** and token rules below).
3. Choose the correct variant for context (e.g., destructive button for delete actions).
4. Provide descriptive labels following `writing-copy.md`.
5. For full props API and interactive demos, click the Storybook link for each component.
6. Verify that the published package exports the target component before replacing a local implementation. Do not assume every Storybook example is published to npm yet. If Aura publishes an equivalent, replace the local shadcn implementation or wrap Aura behind the existing local API. If Aura does not publish it, keep the local implementation and explain the gap. Prefer Aura props, composition, and shipped styling over reapplying old shadcn class stacks.
</usage-principles>

<available-components>

ACTIONS AND INPUTS
| Component | Use for | Storybook |
|-----------|---------|-----------|
| Button | Triggering actions (save, delete, create) | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-button--docs |
| Button Group | Grouping related actions | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-button-group--docs |
| Input | Single-line text entry | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-input--docs |
| Input Group | Composed input with addons (see sizing rule below) | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-input-group--docs |
| Textarea | Multi-line text entry | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-textarea--docs |
| Select | Dropdown selection (4+ options) | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-select--docs |
| Combobox | Searchable selection (long lists) | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-combobox--docs |
| Checkbox | Multi-select toggles | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-checkbox--docs |
| Radio Group | Single selection (2-3 options) | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-radio-group--docs |
| Switch | On/off toggle | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-switch--docs |
| Toggle | Toggle button state | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-toggle--docs |
| Slider | Range / numeric selection | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-slider--docs |
| Date Picker | Date selection | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-date-picker--docs |
| Time Input | Time entry | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-time-input--docs |
| Calendar | Calendar display/selection | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-calendar--docs |

FORM SUPPORT
| Component | Use for | Storybook |
|-----------|---------|-----------|
| Label | Form field labels | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-label--docs |
| Helper Text | Hint/error text below fields | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-helper-text--docs |

LAYOUT AND CONTAINERS
| Component | Use for | Storybook |
|-----------|---------|-----------|
| Card | Content containers | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-card--docs |
| Accordion | Expandable content sections | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-accordion--docs |
| Collapsible | Single collapsible section | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-collapsible--docs |
| Separator | Visual divider | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-separator--docs |
| Swap Slot | Animated content swap | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-swap-slot--docs |
| Empty State | No-data placeholder with CTA | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-empty-state--docs |

NAVIGATION
| Component | Use for | Storybook |
|-----------|---------|-----------|
| Sidebar | App-level navigation | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-sidebar--docs |
| Topbar | Top navigation bar | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-topbar--docs |
| Breadcrumb | Location context | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-breadcrumb--docs |
| Segmented Control | Segmented content switching | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-segmented-control--docs |
| Menubar | Menu bar navigation | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-menubar--docs |
| Pagination | Paged data navigation | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-pagination--docs |
| Toolbar | Action bar for tools | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-toolbar--docs |

DATA DISPLAY
| Component | Use for | Storybook |
|-----------|---------|-----------|
| Table | Tabular data | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-table--docs |
| List | List data display | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-list--docs |
| Badge | Status indicators, labels | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-badge--docs |
| Avatar | User/entity representation | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-avatar--docs |
| Progress | Progress indicators | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-progress--docs |
| Skeleton | Loading placeholders | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-skeleton--docs |
| Kbd | Keyboard shortcut display | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-kbd--docs |
| TreeView | Hierarchical data with status indicators | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-treeview--docs |

ARTIFACT COMPONENTS (domain-specific)
All Artifact sub-variants share the same Storybook docs page. Chart and Count also exist as standalone components for use outside an Artifact container.

| Component | Use for | Storybook |
|-----------|---------|-----------|
| Artifact (Count) | Metric/count display inside an Artifact | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-artifact--docs |
| Artifact (List) | List display inside an Artifact | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-artifact--docs |
| Artifact (Progress) | Progress tracking inside an Artifact | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-artifact--docs |
| Artifact (Alert) | Alert/status inside an Artifact | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-artifact--docs |
| Artifact (Tree View) | Hierarchical data inside an Artifact | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-artifact--docs |
| Artifact (Chart) | Data visualization inside an Artifact | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-artifact--docs |
| Chart | Standalone data visualization (pie, stacked area, multi-line, horizontal bar, radial) | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-chart--docs |
| Count | Standalone metric/count display | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-count--docs |

FEEDBACK AND OVERLAYS
| Component | Use for | Storybook |
|-----------|---------|-----------|
| Alert | Inline system messages | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-alert--docs |
| Alert Dialog | Confirmation requiring action | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-alert-dialog--docs |
| Banner | Page-level notifications | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-banner--docs |
| Dialog | Modal dialogs | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-dialog--docs |
| Drawer | Slide-out panel | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-drawer--docs |
| Sonner Toast | Brief auto-dismiss feedback | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-sonner-toast--docs |
| Tooltip | Hover/focus contextual help | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-tooltip--docs |
| Popover | Click-triggered rich content | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-popover--docs |
| Hover Card | Hover-triggered rich preview | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-hover-card--docs |
| Context Menu | Right-click menu | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-context-menu--docs |
| Dropdown Menu | Action menu | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-dropdown-menu--docs |
| Command | Command palette / search | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-command--docs |
| Page Loader | Full-page loading animation | https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-page-loader--docs |

> For AI-powered features (chatbots, copilots, agent UIs), see the AI Components section in `./storybook-links.md`.

</available-components>

<decision-tree>
Use this when unsure which component to use:

Need to trigger an action?
  → Button (see Storybook for variants: default, secondary,
    tertiary, destructive, outline, ghost, link)
  → Button Group for related actions

Need text input?
  Single line → Input
  Multi-line → Textarea
  With addons (icons, prefixes) → Input Group

Need selection?
  One from 2-3 options → Radio Group
  One from 4+ options → Select
  One from long searchable list → Combobox
  Multiple from a list → Checkbox group
  On/off → Switch
  Date → Date Picker
  Time → Time Input
  Range → Slider

Need to display data?
  Tabular → Table
  List format → List (standalone) or Artifact (List) inside an Artifact container
  Metric/count → Count (standalone) or Artifact (Count) inside an Artifact container
  Chart → Chart (standalone) or Artifact (Chart) inside an Artifact container
  Progress → Progress (standalone) or Artifact (Progress) inside an Artifact container
  Alert within an Artifact → Artifact (Alert)
  Hierarchical data → TreeView (standalone) or Artifact (Tree View) inside an Artifact container
  Key-value pairs → Card with description list

Need to show a message?
  Inline, persistent → Alert
  Page-level banner → Banner
  Brief, auto-dismiss → Sonner Toast
  Requires user action → Alert Dialog
  Complex content/form → Dialog

Need contextual help?
  On hover/focus, short → Tooltip
  On hover, rich preview → Hover Card
  On click, rich content → Popover
  Below a form field → Helper Text

Need a menu?
  Primary actions for item → Dropdown Menu
  Right-click context → Context Menu
  Search + actions → Command

Need navigation?
  App-level sections → Sidebar
  Top bar → Topbar
  Location context → Breadcrumb
  Within-page sections → Segmented Control
  Paged data → Pagination

Need loading state?
  Full page/section → Skeleton
  Full-page loading animation → Page Loader
  Inline progress → Progress
  Long operation → Progress with status text

Need an empty state?
  No data component → Empty State

Need layout structure?
  Content container → Card
  Expandable sections → Accordion or Collapsible
  Visual divider → Separator
  Slide-out panel → Drawer
</decision-tree>

<input-group-sizing priority="high">
When composing InputGroup with addons (Select, Button, text):
- All addons must share the same height as the Input. Never mix size variants within a single InputGroup.
- Dropdown/Select trigger width should match its content, not stretch to the full input width.
- Verify consistent sizing visually — a mismatched addon height is a common builder mistake.

Examples:

{/* Incorrect — mismatched sizes */}
<InputGroup>
  <Select size="default">...</Select>
  <Input size="sm" />
</InputGroup>

{/* Correct — consistent sizing */}
<InputGroup>
  <Select size="sm">...</Select>
  <Input size="sm" />
</InputGroup>

See Storybook for all InputGroup variants:
https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-input-group--docs
</input-group-sizing>

<builder-responsibilities priority="critical">
These apply to ALL components. For component-specific accessibility details, check each component's Storybook page.

1. LABELS: All interactive elements need descriptive labels.
   Buttons: [Verb] + [Noun] pattern (see `writing-copy.md`).
   Icon-only buttons: add aria-label.
   Form fields: always use Label component.

2. VARIANTS: Choose the correct variant for context.
   Destructive actions → variant="destructive"
   Primary page action → variant="default" (one per section)
   Supporting actions → variant="secondary"

3. EMPTY STATES: Every data-displaying component (Table, List,
   Chart, Count, Artifact and its sub-variants) must handle empty
   state. Use the Aura Empty State component where possible.

4. LOADING STATES: Show Skeleton or Button loading state
   for any async operation.

5. CONFIRMATION: Destructive actions must show Alert Dialog
   or Dialog before executing.
</builder-responsibilities>

<storybook-foundations>
For token values, scales, and visual examples, reference:

Colors: https://cognitedata.github.io/aura/storybook/?path=/docs/foundations-colors--docs
Effects: https://cognitedata.github.io/aura/storybook/?path=/docs/foundations-effects--docs
Layout: https://cognitedata.github.io/aura/storybook/?path=/docs/foundations-layout--docs
Typography: https://cognitedata.github.io/aura/storybook/?path=/docs/foundations-typography--docs

These are the source of truth for all token values. Do not hardcode values — look up the correct token in Storybook.
</storybook-foundations>

<critical-concept>
TAILWIND CLASSES, NOT RAW CSS VARIABLES

Aura tokens are consumed via Tailwind utility classes.
Never write raw CSS with var(--token-name) in component code.

WRONG: style={{ color: 'var(--foreground)' }}
WRONG: style={{ color: '#1a1a1a' }}
RIGHT: className="text-foreground"

WRONG: style={{ backgroundColor: 'var(--destructive)' }}
RIGHT: className="bg-destructive"

The only place raw CSS variables appear is in global.css
and in SVG/chart attributes where Tailwind classes cannot
apply (see chart-and-svg-exceptions rule below).
Application code always uses Tailwind classes.
</critical-concept>

<rules priority="critical">

<rule name="semantic-tokens-only">
<instruction>
All colors must use Aura's SEMANTIC tokens, not raw color
ramp values or Tailwind defaults. Semantic tokens adapt to
light/dark mode automatically.

Reference the Colors foundation in Storybook for the full
semantic token list and their light/dark mode values.
</instruction>

<rationale>
Semantic tokens like bg-background and text-foreground resolve
to different colors in light vs dark mode. Raw ramp values
(bg-mountain-950) or Tailwind defaults (bg-gray-500) do not
adapt and will break the dark mode experience.
</rationale>

<key-semantic-tokens>
These are the most commonly used. For the complete list,
see Storybook Colors foundation.

BACKGROUNDS: bg-background, bg-card, bg-popover, bg-muted,
  bg-accent, bg-hover
ACTIONS: bg-primary, bg-secondary, bg-tertiary, bg-destructive
  (each has a -hover variant)
STATUS: bg-destructive, bg-warning, bg-success, bg-neutral,
  bg-undefined, bg-disabled
TEXT: text-foreground, text-muted-foreground, text-card-foreground,
  text-primary-foreground, text-destructive-foreground,
  text-warning-foreground, text-success-foreground,
  text-foreground-link
BORDERS: border-border, border-input
FOCUS: shadow-focus-ring, shadow-focus-ring-destructive
DECORATIVE: bg-decorative-background-[color],
  text-decorative-foreground-[color]
  (mountain, fjord, nordic, aurora, dusk, orange, sky, gray)
CHART: chart-[series]-solid, chart-[series]-opacity-[1-5]
  (fjord, aurora, nordic, dusk, orange)
</key-semantic-tokens>

<common-mistakes>
| What people write | What they should write | Why |
|------------------|----------------------|-----|
| text-gray-500 | text-muted-foreground | Tailwind default, not Aura |
| bg-red-100 | bg-destructive | Tailwind default, not Aura |
| bg-green-100 | bg-success | Tailwind default, not Aura |
| text-black | text-foreground | Hardcoded, no dark mode |
| bg-white | bg-background | Hardcoded, no dark mode |
| border-gray-200 | border-border | Tailwind default, not Aura |
| text-blue-500 | text-foreground-link | Tailwind default, not Aura |
| style={{ color: '#333' }} | className="text-foreground" | Inline hardcoded |
</common-mistakes>

<example type="correct">
<div className="bg-card border border-border rounded-lg
               shadow-sm p-6 space-y-4">
  <h3 className="text-lg font-semibold text-foreground">
    Q2 Production summary
  </h3>
  <span className="bg-success text-success-foreground
                   text-xs px-2.5 py-0.5 rounded-full">
    Active
  </span>
  <p className="text-sm text-muted-foreground">
    Last updated 2 hours ago
  </p>
</div>
</example>

<example type="incorrect">
<div style={{
  backgroundColor: '#f9fafa', border: '1px solid #e4e6e8',
  borderRadius: '8px', padding: '24px'
}}>
  <h3 style={{ color: '#111213' }}>Q2 Production summary</h3>
  <span className="bg-green-100 text-green-500">Active</span>
</div>
</example>
</rule>

<rule name="no-hardcoded-values">
<instruction>
Never use hardcoded hex colors, RGB values, raw CSS color
values, or Tailwind's default color palette anywhere in
component code.

For spacing, typography, effects, and radius values,
reference the corresponding Storybook foundation pages.
</instruction>
</rule>

<rule name="typography-from-storybook">
<instruction>
Use Aura's typography scale exclusively. The system overrides
several Tailwind defaults with tighter line heights.

Reference: https://cognitedata.github.io/aura/storybook/?path=/docs/foundations-typography--docs

Key font families:
- font-sans (Inter) — all application UI text
- font-marketing (Space Grotesk) — marketing pages only
- font-mono (Source Code Pro) — code, technical values
</instruction>
</rule>

<rule name="effects-from-storybook">
<instruction>
Use Aura's shadow and effect tokens for all elevation.
Reference: https://cognitedata.github.io/aura/storybook/?path=/docs/foundations-effects--docs

Never write custom box-shadow values.
</instruction>
</rule>

<rule name="layout-from-storybook">
<instruction>
Use Aura's layout foundations for spacing and sizing.
Reference: https://cognitedata.github.io/aura/storybook/?path=/docs/foundations-layout--docs

Use Tailwind spacing scale (p-4, gap-6, etc.) —
never raw pixel values.
</instruction>
</rule>

<rule name="aura-components-only">
<instruction>
For any UI element that has an Aura component equivalent,
use the Aura component. Do not build custom replacements.

Use the **Available components** section above and `./storybook-links.md` for the full list with Storybook links.
</instruction>

<rationale>
Aura components have built-in accessibility, correct token
usage, dark mode support, and consistent styling. Custom
components lose all of this.
</rationale>
</rule>

<rule name="no-style-overrides">
<instruction>
Never apply inline styles or override Aura component
appearances. No style={{}} for visual properties, no custom
className overrides, no !important, no CSS targeting internals.

The only acceptable inline styles are for truly dynamic
values (calculated widths, positioned overlays).
</instruction>
</rule>

<rule name="chart-and-svg-exceptions">
<instruction>
SVG elements and charting libraries (recharts, d3,
Highcharts, etc.) cannot use Tailwind utility classes for
stroke, fill, and similar attributes. In these contexts,
using var() references to CSS custom properties is the
correct approach.

Allowed patterns in SVG/chart style attributes:
- var(--chart-1) through var(--chart-5) for data series
- var(--muted-foreground), var(--border), var(--foreground)
  for axes, grid lines, labels
- var(--background) for chart backgrounds, knockout areas

NOT allowed in SVG/chart style attributes:
- Raw ramp variables: var(--orange-500), var(--fjord-600)
  -> Use var(--chart-N) instead
- var(--primary) for chart series
  -> --primary is for buttons/actions, not data colors
- var(--color-X) prefix -> typo, should be var(--X)
- Hardcoded hex values (#3b82f6)
  -> Use the appropriate var(--chart-N) token
</instruction>

<common-mistakes>
| What people write | What they should write | Why |
|---|---|---|
| stroke="var(--orange-500)" | stroke="var(--chart-4)" | Raw ramp, not semantic |
| fill="var(--primary)" | fill="var(--chart-1)" | --primary is for UI actions |
| stroke="var(--color-muted-foreground)" | stroke="var(--muted-foreground)" | --color- prefix doesn't exist |
| fill="#3b82f6" | fill="var(--chart-1)" | Hardcoded hex |
</common-mistakes>
</rule>

</rules>

<rules priority="high">

<rule name="dark-mode-awareness">
<instruction>
Aura supports light and dark mode. Semantic tokens adapt
automatically. Key awareness:
1. Never assume white background — use bg-background
2. Never assume dark text — use text-foreground
3. The sidebar is ALWAYS dark (mountain-900) in both modes
4. For conditional dark styling: dark:bg-mountain-800

Reference Colors foundation for light/dark value pairs.
</instruction>
</rule>

<rule name="empty-states-required">
<instruction>
Every component that displays data must handle the empty state.
Each empty state must include:
1. A message explaining what will appear here
2. A call to action (button or guidance)
Use the Aura Empty State component (see Storybook below).
See Storybook: https://cognitedata.github.io/aura/storybook/?path=/docs/primitives-empty-state--docs
See `writing-copy.md` for copy patterns.
</instruction>
</rule>

<rule name="approved-layouts-only">
<instruction>
Every page must use an approved layout pattern. Use only the patterns documented in `building-pages.md`; extend them by composition rather than inventing new structures.
</instruction>
</rule>

</rules>

<edge-cases>
1. Need something not in the list?
   — Check if it can be composed from existing components.
   — If genuinely new, build with Aura tokens and flag:
   {/* NOTE: No Aura component for [need]. Custom build. */}

2. Component almost fits but not quite?
   — Check Storybook for all variants and props first.
   — Do NOT override styles. Flag for design system team.

3. Choosing between similar components?
   — Dialog vs Alert Dialog: Alert Dialog for simple
     confirm/cancel. Dialog for complex content.
   — Select vs Combobox: Combobox when list is long or
     needs search. Select for short fixed lists.
   — Tooltip vs Popover: Tooltip for one line of text.
     Popover for rich content that needs interaction.

4. Can it be done with semantic tokens?
   — Always prefer bg-background, text-foreground, etc.
   — Check Storybook Colors foundation for the right token.

5. Need a color with no semantic token?
   — Check decorative tokens first.
   — For charts, use chart-* tokens.
   — Raw ramp values only as last resort, with a short code comment explaining why.

6. Need Tailwind's default colors (gray-500, blue-600)?
   — Almost always wrong. Map to Aura equivalent.
   — Check Storybook Colors for the correct semantic token.

7. Unsure which token to use?
   — Look it up in Storybook. The foundations pages show
     every token with its purpose and visual example.

Flag anything unresolvable:
{/* NOTE: No Aura token for [need].
    Using [temporary approach]. */}
</edge-cases>
