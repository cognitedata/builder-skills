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
- **Validate at trust boundaries** — parse SDK responses and form submissions with Zod. TypeScript types are erased at runtime.
- **Mutations need `onError` rollbacks** — a silent partial write to CDF is worse than a visible error. Always include `onError` in `useMutation`.
- **Centralize all CDF identifiers in `config/model.ts`** — never scatter view IDs, space names, or property keys as string literals. A rename touches one line, not fifty.
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

## Key patterns (quick rules)

### React Query for all server state
Use `useQuery`/`useMutation` inside dedicated hooks. Never use `useState` + `useEffect` to fetch data — you lose caching, deduplication, background refresh, and retries. Never call `useQuery` or `useMutation` directly inside `.tsx` component files.

### Zod at the SDK boundary
One schema per view in `schema.ts`. Call `Schema.parse(raw)` at the point data enters the app (SDK response → app, form → SDK). Downstream code receives a typed value, not `unknown`.

### Keep data access thin
A typed `use*` query hook is sufficient for most CDF reads. A service class with an interface, implementation, and two context layers earns its place only when there is real pagination, joining, or write-shaping logic.

### Separate data from display
Extract data + commands into a view-model hook (e.g. `useTriageVM.ts`). The component calls the hook and renders — it has no direct `useQuery`/`useMutation` calls, no inline `async` handlers, and no business logic.

### Single-purpose hooks
One hook per concern. A component that only uses `userStats` should not re-render when `chartData` changes. Split `useDashboardLogic` → `useUserStats` + `useChartData`.

### Narrow hook interface
Return `{ data, isLoading, commandFn }` — not the raw `query` or `mutation` object. This decouples callers from React Query internals.

This applies to mutations too. Never do `return useMutation(...)` — always wrap:
```ts
// Wrong
export function useResolveAlert() {
  return useMutation({ mutationFn: resolve });
}

// Right
export function useResolveAlert() {
  const mutation = useMutation({ mutationFn: resolve, onError: ... });
  return { resolveAlert: mutation.mutate, isResolving: mutation.isPending, error: mutation.error };
}
```

### Compute derived values inline
Derive values during render with an inline `const` or `useMemo`. Never store a derived value in `useState` + `useEffect` — this causes an extra render with a stale value.

### Injectable dependencies for testability
For shallow components, use a typed `deps` prop with real defaults. For trees, use `.context.tsx` with real defaults so production code needs no Provider. Avoid `vi.mock` on first-party modules — it is path-coupled and not type-checked.

### Aura, not inline styles
Use Aura component props/variants first, then Tailwind utility classes. Never use `style={{}}` objects — they bypass the `aura/no-overriding-styles` ESLint rule and drift from the design system.

### Centralize data model config
Keep all CDF view IDs, space names, and property keys in `config/model.ts`. Scattered string literals break silently when a space or view is renamed.

### Two-layer error handling
One `<ErrorBoundary>` at the app shell catches render crashes. Per-view: use the query's `error`/`isError` state and render a shared `<ErrorState onRetry={refetch} />` component.

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
