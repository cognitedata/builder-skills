---
name: design
description: >
  Use for any customer-facing UI work in Flows, Fusion or React involving Aura,
  layouts, components, styling, UX, accessibility or user-facing copy.
allowed-tools: Read, Glob, Grep, Edit, Write
---

# Aura workflow

Always complete these steps in order. Use WebFetch rather than cURL.

1. Upgrade `@cognite/aura` to the latest version: `npm view @cognite/aura version`

2. Treat the installed package as the source of truth.
   - Verify every Aura API against `node_modules/@cognite/aura`.
   - Never assume examples or docs match the installed version.
   - Do not stop at a single barrel-file grep. If a prop/type isn't found, search the actual declaration files, e.g.:
     `grep -rn "SearchProps\|CardProps" node_modules/@cognite/aura/dist/**/*.d.ts`
   - A prose diagram in `DESIGN.md` is context, not a verified API — it never substitutes for checking the installed types.

3. Read the Aura examples index:

   https://escargot-feminist-ninth.ngrok-free.dev/examples/index.json

   Resolve each item's `file` field relative to the server root.

4. Reuse existing patterns.
   - Choose the closest layout example.
   - **If the task involves a page shell/dashboard/list layout, this is mandatory, not optional:** fetch and open the matching `examples/layout/*` file before writing any JSX. An ASCII diagram or pattern description from `DESIGN.md` does NOT satisfy this — it is prose intent, not a verified pattern. Using an example layout is mandatory.
   - Look up examples for every Aura component you use.
   - **Reusing a layout example means adopting its structural pattern** (e.g. sidebar + main split, topbar + tabs) — not just cherry-picking a component out of it. Do not open a layout example, note it doesn't quite fit, and then quietly build your own shell instead. That is a violation of this step, not an acceptable judgment call.
   - **If no `examples/layout/*` file matches the requested page type, stop and ask the user** whether to adapt the closest layout example anyway or proceed without one. Do not decide unilaterally to discard it and compose a custom shell.
   - If no suitable *component* example exists (this does not apply to layouts — see above), compose from verified Aura primitives.
   - **Gate before writing code:** list every example file opened, mapped to what it was used for (layout, each component). If a layout/page-shell is involved and no `layout/*` example is in that list, go fetch one now before proceeding. For any layout example opened, explicitly state whether its structural pattern was reused or discarded — if discarded, that must be because the user was asked and agreed, not a solo decision.

5. Prefer Aura over custom UI.
   - Use primitives before custom components.
   - Use semantic tokens only.
   - Never hardcode visual values.
   - Check variants before overriding styling.

6. Before adding wrappers inside compound Aura components, verify whether an existing slot/subcomponent already exists.

7. Every UI change should preserve:
   - loading, empty, success and error states
   - keyboard accessibility
   - visible focus
   - concise action-oriented copy

## References

- Installed package: `node_modules/@cognite/aura`
- Design guide: `node_modules/@cognite/aura/DESIGN.md`
- Examples: https://escargot-feminist-ninth.ngrok-free.dev/examples/index.json
- Docs: https://docs.cognite.com/aura-design-system/primitives