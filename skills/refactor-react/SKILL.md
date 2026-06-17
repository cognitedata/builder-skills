---
name: refactor-react
description: >-
  Refactors React and TypeScript components for maintainability, readability, and
  performance using modern React 19 patterns. Use when cleaning up messy components,
  reducing complexity, fixing prop drilling or re-render issues, optimizing hooks,
  or when the user mentions React Compiler, Server Components, Actions, useOptimistic,
  or the use() hook. Triggers on phrases like "clean this up", "too many re-renders",
  "prop drilling", or when reviewing components over ~100 lines.
---

# React / TypeScript Refactoring

## Quick Start

1. Read the full component and list responsibilities, props, state, effects, and smells.
2. Check [AGENTS.md](../../../AGENTS.md) for project conventions (ViewModel pattern, host-synced state, dependency injection, Aura components).
3. Plan splits: hooks first, then components, then types and anti-patterns.
4. Refactor incrementally — preserve behavior at each step.
5. Verify: no TS errors, edge cases handled, tests updated if behavior changed.

## Refactoring Workflow

Copy this checklist and track progress:

```
Task Progress:
- [ ] Analyze: responsibilities, props, state, effects, code smells
- [ ] Check project conventions (AGENTS.md)
- [ ] Plan: hook extraction, component splits, type fixes
- [ ] Extract custom hooks (preserves behavior)
- [ ] Split oversized components
- [ ] Fix anti-patterns and TypeScript issues
- [ ] Apply memoization only if pre-React 19 or without Compiler
- [ ] Verify: functionality, types, loading/error/empty states
```

## Core Principles

| Principle | Rule |
|-----------|------|
| Single responsibility | One concern per component, hook, and handler |
| Size targets | Components <150 lines (ideal <100); hooks <50; handlers <20 |
| Early returns | Guard loading, error, and empty states before main JSX |
| Composition over drilling | Prop drilling beyond 2 levels → children, context, or store |
| Colocate state | Keep state as close as possible to where it is used |
| DRY | Extract repeated JSX and shared stateful logic into hooks/components |

## Project Conventions (operations-dashboard)

When refactoring in this repo, align with [AGENTS.md](../../../AGENTS.md):

- **ViewModel pattern** — business logic in `use<Name>ViewModel`; views only render
- **State location** — ViewModels do not hold `useState`; state lives in shared storage/context
- **Dependency injection** — inject services and SDK clients via context; never call directly in components
- **Host-synced state** — URL-restorable UI state uses `syncInternalState`, not plain `useState`
- **UI components** — prefer `@cognite/aura/components` over raw HTML/Tailwind
- **TypeScript** — no `any`, no `as` casts (except test mocks); use type guards
- **Tests** — add or update `*.test.ts(x)` for non-trivial refactors (Vitest)

## Stop Refactoring When

- Component is under 100 lines with a single responsibility
- State is colocated; props are minimal
- No TypeScript `any` types or errors
- No obvious code smells remain
- Further changes would be premature optimization

## Output Format

Use this template for every refactoring task:

```markdown
## Analysis Summary
[Issues found — responsibilities, smells, anti-patterns]

## Refactored Code
[Complete, working code]

## Changes Made
- [Specific change 1]
- [Specific change 2]

## Rationale
[Why each change improves maintainability, readability, or performance]
```

## Additional Resources

- For React 19 features, hook patterns, composition, TypeScript, and anti-patterns, see [reference.md](reference.md)
- For before/after refactoring examples, see [examples.md](examples.md)
