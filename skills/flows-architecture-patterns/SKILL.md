---
name: flows-architecture-patterns
description: Architecture patterns and best practices for Flows custom apps built on Cognite Data Fusion (CDF). Use this skill whenever you are writing, reviewing, or refactoring code in a Flows custom app — including data fetching with React Query, Zod validation at SDK boundaries, state management with Zustand or React Context, component/hook separation, error handling, Aura styling, or CDF data model config. Trigger on any task involving useQuery, useMutation, useCogniteSdk, Zustand stores, Zod schemas, component architecture, or state management in a Flows app, even if the user hasn't explicitly asked about "architecture".
---

# Flows Architecture Patterns

A Flows custom app stays legible as it grows when four areas stay consistent:

| Area | Tool |
|---|---|
| Server state | TanStack React Query (`useQuery` / `useMutation`) |
| Validated types | Zod at SDK response and form-submit boundaries |
| Shared client state | Zustand (frequently changing) or React Context (stable globals) |
| Component shape | Business logic in hooks; components only render UI |

Read https://docs.cognite.com/cdf/flows/concepts/architecture-best-practices for the complete pattern catalog with side-by-side Do/Don't code examples. The sections below give you the quick rules; check that page whenever you need the full example.

## Non-negotiable rules (apply to every task)

These override everything else — never skip them:

- **All CDF calls via `useCogniteSdk()`** — no raw `fetch` or `axios` to CDF URLs. The SDK handles auth, token refresh, rate-limit retries, and tracing.
- **Unique, specific query keys** — e.g. `["wells", startDate, endDate]`, not `["wells"]`. A too-broad key causes silent cache collisions between differently-filtered queries.
- **Validate at trust boundaries** — parse SDK responses and form submissions with Zod. TypeScript types are erased at runtime.
- **Mutations need `onError` rollbacks** — a silent partial write to CDF is worse than a visible error. Always include `onError` in `useMutation`.
- **Centralize all CDF identifiers in `config/model.ts`** — never scatter view IDs, space names, or property keys as string literals. A rename touches one line, not fifty. For batching/concurrency limits when querying data models, see the `dm-limits-and-best-practices` skill.
- **No secrets in client code**, no `dangerouslySetInnerHTML` with unescaped user input.
- **Accessible markup** — meaningful `aria` labels, keyboard navigability, no `onClick` on `<div>`.

## Choosing the right state tool

```
Local to one component              → useState
Stable global (client, user, flags) → React Context
Frequently-updating shared state    → Zustand
Anything fetched from CDF           → React Query — never copy into useState
```

**Zustand vs React Context — the most common mistake:** React Context re-renders *every consumer* when its value changes. For state that changes on every keystroke (wizard drafts, filters, row selections), this causes unnecessary re-renders across the whole subtree. Use Zustand whenever state updates during user interaction. Context is only correct for values that are set once and rarely change (the CDF client, the current user, feature flags).

Concrete: a multi-step wizard's draft state (selected items, config, assignee) **must use Zustand**. Using Context there re-renders all 4 steps on every field change.

Start with `useState`. Lift to Context when a stable value is needed tree-wide. Move to Zustand once re-renders become noticeable or prop drilling would exceed 3 levels.

## Component-level hygiene

- **Size targets** — components under ~150 lines (ideal <100), hooks under ~50, handlers under ~20. Past that, split by responsibility.
- **Early returns** — guard loading, error, and empty states before the main JSX, rather than nesting the happy path in conditionals.
- **Colocate state** — keep state as close as possible to where it's used; don't lift until something else actually needs it.
- **DRY** — extract repeated JSX and shared stateful logic into hooks or components rather than copy-pasting.
- **Reset state with `key`, not `useEffect`** — when a component's identity changes (e.g. editing a different record), pass the entity id as `key` so React remounts it, instead of manually resetting state in a `useEffect`: `<EditForm key={selectedContact.id} contact={selectedContact} />`.
- **`useEffect` deps** — include every dependency the effect reads; destructure objects/arrays before using them in the deps array to avoid infinite loops; always return a cleanup function for subscriptions.

### Anti-patterns to fix on sight

| Anti-pattern | Fix |
|---|---|
| Array index as `key` | Use a stable unique id |
| Inline `object`/`array` prop literals (`<Foo config={{...}} />`) | Define outside the component or memoize |
| State update during render | Move to an event handler or `useEffect` |
| Direct DOM manipulation | Use `useRef` |
| `useState` + `useEffect` to sync a derived value | Compute inline with `const` or `useMemo` |

## Key patterns (quick rules)

See the Quick reference section of https://docs.cognite.com/cdf/flows/concepts/architecture-best-practices#quick-reference for the condensed rule for each pattern (React Query for server state, Zod at the SDK boundary, thin data access, view-model separation, single-purpose hooks, narrow hook interfaces, inline derived values, injectable dependencies, Aura styling, centralized data model config, two-layer error handling). Follow the linked page whenever you need the full Do/Don't example for one of these.

## Recommended folder shape

```
src/
  features/
    <feature>/
      ui/           # presentational components
      context/      # context providers
      hooks/        # useFeatureVM.ts (view-model), useResource.ts (query)
      store.ts      # Zustand store
      schema.ts     # Zod schemas
      index.ts      # public API
  context/          # shared context providers
  hooks/            # shared hooks
  stores/           # shared Zustand stores
  ui/               # shared UI (ErrorState, etc.)
  App.tsx           # shell + ErrorBoundary + QueryClientProvider
```

## Reference

For full Do/Don't examples for every pattern above, see https://docs.cognite.com/cdf/flows/concepts/architecture-best-practices.
