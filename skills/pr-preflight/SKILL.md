---
name: pr-preflight
description: >-
  Run a prioritised pre-PR checklist on a Dune app (React + TypeScript) before
  raising or pushing a pull request. Uses pnpm (standard for Dune apps) for all
  scripts. Catches the most common issues that block
  reviews and require follow-up commits: TypeScript type errors, broken or
  misaligned tests, any-casts in test mocks, loose SDK typing, dead code,
  cdf-design-system-alpha (forbidden in all cases), missing input validation, and
  PR description drift from the actual implementation.
  Use this skill whenever the user says "ready to push", "raise a PR",
  "pre-push check", "check before PR", "am I good to open a PR", "PR checklist",
  or wants to verify their branch is review-ready — even if they don't use any
  of these exact words. Always run this before creating a pull request.
allowed-tools: Read, Glob, Grep, Shell, Write
---

# PR Preflight Checklist

Run every gate below **in priority order** and stop to fix blocking findings before moving on.
Report results as you go — don't silently skip a gate.

**Dune apps use `pnpm` as the package manager.** Run all install, type-check, test, and lint
commands with `pnpm` from the app root (where `pnpm-lock.yaml` lives).

---

## PRIORITY 1 — Must pass before the PR is opened

These are hard blockers. A PR with any of these open will require a follow-up commit
during review, which is wasteful and signals the branch wasn't tested locally.

### 1a · Type-check must be clean

```bash
# Try the project script first, fall back to raw tsc
pnpm type-check 2>/dev/null || pnpm exec tsc --noEmit
```

Zero errors required. Every TS error is a blocker. Common patterns to fix:

| Error | Fix |
|---|---|
| `Type 'X' is not assignable to type 'Y'` | Correct the value — ensure the mock/literal matches the declared type |
| Mock value typed as a primitive but interface expects an object | Mock the full object shape instead of a plain string/number |
| Missing required field on interface | Add the field to the interface definition, or supply it in the mock |
| `Object is possibly 'undefined'` | Add a null guard or use optional chaining |

### 1b · All tests must pass

```bash
pnpm test --run
```

Zero failures required. Watch for these common failure patterns:

- **Mock drift** — a component export was added or renamed but the `vi.mock(...)` wasn't updated. Fix: update the mock to mirror the real export surface.
- **Assertion drift** — a component's DOM shape changed (classnames, tags, data attributes) but test assertions weren't updated. Fix: update assertions to match the current implementation.
- **Stale test cases** — tests for logic that was deleted in an earlier PR. Fix: remove the stale tests.
- **`setTimeout` anti-pattern** — use `waitFor(() => ...)` from `@testing-library/react` instead of `await new Promise(r => setTimeout(r, N))`. The former polls until the condition is met; the latter is a fragile time-based guess.

```bash
# Spot setTimeout anti-patterns in tests
grep -rn "setTimeout" src/ --include="*.test.*"
```

### 1c · Test files are aligned with the implementation

For every new or meaningfully changed component or hook, there must be a dedicated test file.
Test files may live either co-located (`Component.test.tsx` next to `Component.tsx`) or inside
a `__tests__/` subdirectory — both patterns are valid. Run this check:

```bash
# Collect all test file base-paths (strips .test.ts / .test.tsx and __tests__/ prefix)
find src -name "*.test.*" \
  | sed 's|/__tests__/|/|' \
  | sed 's|\.test\.[^.]*$||' \
  | sort > /tmp/has_test.txt

# Collect all production source base-paths
find src \( -name "*.tsx" -o -name "*.ts" \) \
  | grep -v "\.test\." \
  | grep -v "__test-helpers__" \
  | grep -v "index\.ts" \
  | grep -v "\.d\.ts" \
  | grep -v -E "vite|\.config\.|main\.tsx" \
  | sed 's|\.[^.]*$||' \
  | sort > /tmp/src_files.txt

echo "=== Source files with NO test coverage ==="
comm -23 /tmp/src_files.txt /tmp/has_test.txt
```

Cross-reference gaps against the **current diff** — this is what determines blocking vs non-blocking:

```bash
# Files added or changed in this branch (these are what the PR is responsible for)
git diff --name-only "$(git merge-base HEAD origin/HEAD)"..HEAD 2>/dev/null \
  | grep -E "\.(tsx|ts)$" | grep -v "\.test\." | grep -v "index\.ts"
```

- Any gap that **overlaps with the diff** → ❌ **FAIL (blocking)** — must have a test before PR opens
- Any gap for files **not in the diff** → ⚠️ **WARN** — pre-existing debt, log as follow-up

The following are exempt entirely: helper/utility files used only in tests, type-only files
(`interfaces.ts`, `types/index.ts`), and thin wrappers around third-party UI library
primitives where the library itself has tests.

Test files must be **one per component/hook** — monolithic test files that cover multiple
components are a review blocker (they make diffs unreadable and hide which component broke).

```bash
# Find test files with too many top-level describe blocks
grep -rn "^describe(" src/ --include="*.test.*" -l | while read f; do
  count=$(grep -c "^describe(" "$f")
  if [ "$count" -gt 3 ]; then
    echo "$f has $count top-level describe blocks — consider splitting"
  fi
done
```

### 1d · No `: any` in test mocks

Tests that use `any` casts on mock props mask type errors and let real bugs slip through:

```bash
grep -rn ": any" src/ --include="*.test.*"
grep -rn "as any" src/ --include="*.test.*"
```

Zero results required. Common replacements:

| Pattern | Replacement |
|---|---|
| `({ children, onClick, ...props }: any)` | `({ children, onClick, ...props }: React.HTMLAttributes<HTMLDivElement>)` |
| `vi.mocked(fn).mockResolvedValue(x as any)` | Mock with the actual return type shape |
| `(wrapper as any).find(...)` | Use proper RTL queries |
| `forwardRef((props: any, ref: any) => ...)` | `forwardRef<HTMLElement, Props>((props, ref) => ...)` |

### 1e · `cdf-design-system-alpha` is forbidden — no exceptions

**Do not use `cdf-design-system-alpha` under any circumstances.** It is deprecated and
must not appear in imports, re-exports, dynamic `import()`, `package.json` dependencies,
optional dependencies, or resolutions/overrides that pull it in. There is no approved
workaround — every UI surface must use `@cognite/aura` / `@cognite/aura/components`, or a
thin local wrapper (Radix/shadcn) under `@/components/ui` when Aura does not ship a primitive.

```bash
# Source and manifest — any hit is a hard FAIL
grep -rn "cdf-design-system-alpha" src/ package.json 2>/dev/null

# Lockfile (Dune standard — pnpm)
[ -f pnpm-lock.yaml ] && grep -n "cdf-design-system-alpha" pnpm-lock.yaml && echo "FOUND IN pnpm-lock.yaml"
```

Zero hits required across all of the above. If grep finds anything, remove the package and
replace usages with Aura before opening the PR.

---

## PRIORITY 2 — Common review feedback patterns

These are issues that reliably surface during code review and trigger a re-review cycle.
Addressing them before opening the PR saves at least one round-trip.

### 2a · Use SDK types — don't roll your own

Check for custom type definitions that duplicate types already in `@cognite/sdk`:

```bash
grep -rn "Record<string, unknown>" src/ --include="*.ts" --include="*.tsx" | grep -v "\.test\."
grep -rn "interface Cdf\|type Cdf" src/ --include="*.ts" | grep -v "\.test\."
```

For each hit, check whether an equivalent already exists in the SDK. Common substitutions:

| Custom type | SDK type to use instead |
|---|---|
| `Record<string, unknown>` for DMS nodes | `NodeOrEdge` from `@cognite/sdk` |
| Inline `{ space, externalId, version }` | `ViewReference` from `@cognite/sdk` |
| Custom sort shape | `PropertySortV3[]` from `@cognite/sdk` |
| Custom filter shape | `FilterDefinition` from `@cognite/sdk` |
| Interface wrapping `CogniteClient` to expose extra methods | Use `BaseCogniteClient` — `project`, `getBaseUrl()`, `getDefaultRequestHeaders()` are already public |

### 2b · No other deprecated Cognite UI packages

`cdf-design-system-alpha` is covered in **gate 1e** (Priority 1, zero tolerance). Here,
check for other legacy UI packages that should not ship in new code:

```bash
grep -rn "cdf-ui-kit" src/ package.json 2>/dev/null
```

Any hit should be treated like 1e: remove and migrate to Aura. If nothing is found, report
**PASS** for this gate.

### 2c · No redundant tooling or dead code

```bash
# Manual 429 retry loops — the Cognite SDK handles rate-limit retries internally
grep -rn "429\|retryCount\|retry.*attempt" src/ --include="*.ts" --include="*.tsx" | grep -v "\.test\."

# Duplicate formatter alongside the project's primary linter
# e.g. prettier scripts when biome is the configured formatter
grep -n "prettier" package.json

# require() in test files — use ES module imports consistently
grep -rn "require(" src/ --include="*.test.*"
```

- Remove manual 429 retry logic — the SDK already handles it.
- Remove whichever formatter is not the project standard (check `biome.json` or `.prettierrc` to identify which is active).
- Replace `require(...)` in tests with top-level `import` statements.

### 2d · Input validation at mutation boundaries

Whenever a user can create or rename a named entity (any CRUD form that appends to an array),
validate for duplicates before accepting the input:

```bash
# Find add/create handlers
grep -rn "onAdd\|onCreate\|handleAdd\|handleCreate" src/ --include="*.tsx" | grep -v "\.test\."
```

For each handler that appends to an array, confirm it guards against duplicate names:

```ts
// Required pattern — guard before mutating
onAdd={(name) => {
  if (items.some((i) => i.name === name)) return;
  setItems(prev => [...prev, { name }]);
}}
```

Also verify every `JSON.parse` call site validates its result before use:

```bash
grep -rn "JSON.parse" src/ --include="*.ts" --include="*.tsx" | grep -v "\.test\."
```

Any `JSON.parse` result that flows into a component or service should be guarded:

```ts
const data = JSON.parse(raw);
if (data && typeof data === "object" && !Array.isArray(data)) {
  // safe to use
}
```

### 2e · Verify disabled/guard conditions reference the correct field

For every `disabled` prop or early-return guard that reads from a config or state object,
manually confirm the field name is the one that actually gates the action:

```bash
grep -rn "disabled={" src/ --include="*.tsx" | grep -v "\.test\."
grep -rn "if (!config\.\|if (!state\." src/ --include="*.tsx" --include="*.ts" | grep -v "\.test\."
```

A common mistake: disabling a button based on `config.fieldA` when the underlying operation
actually requires `config.fieldB`. Read the handler the button triggers and trace which config
field it reads — the guard must match.

### 2f · `useCallback` on event handlers passed as props

Handlers defined in a component body without `useCallback` are recreated on every render,
causing unnecessary re-renders in child components. Check for two patterns:

```bash
# Pattern 1: inline arrow functions on JSX props
grep -rn "onChange={\s*(e\|event)\s*=>" src/ --include="*.tsx" | grep -v "\.test\." | grep -v "useCallback"

# Pattern 2: const handlers in component body not wrapped in useCallback
grep -rn "^\s*const handle\w* = \(\\|^\s*const handle\w* = async (" src/ --include="*.tsx" | grep -v "\.test\." | grep -v "useCallback"
```

For each `const handleX` that is passed as a prop to a child component, wrap it in `useCallback`:

```ts
// Before — recreated every render
const handleConfirmDelete = () => { setOpen(false); onDelete(target); };

// After — stable reference
const handleConfirmDelete = useCallback(() => {
  setOpen(false);
  onDelete(target);
}, [onDelete, target]);
```

Skip handlers used only on native DOM elements (`<button onClick={...}>`) where the receiving
element is not a memoised component.

---

## PRIORITY 3 — Low-priority suggestions (non-blocking)

Review these and log any findings as follow-up items. Do not block the PR on them.

### 3a · Accessibility

```bash
# Label components not associated with an input via htmlFor
grep -rn "<Label" src/ --include="*.tsx" | grep -v "htmlFor"

# Redundant aria-label on elements that already have a visible heading
grep -rn "aria-label" src/ --include="*.tsx"
```

- `<Label>` components should use `htmlFor` pointing to the input's `id`.
- Avoid `aria-label` on a container that already contains a visible heading — screen readers announce it twice.
- Ensure focus-visible ring styles are consistent across all interactive elements.

### 3b · Cross-tab state sync

Hooks that write to `localStorage` should also listen for the `storage` event so other open
tabs reflect the change without a reload:

```bash
grep -rn "localStorage.setItem" src/ --include="*.ts" --include="*.tsx" | grep -v "\.test\."
```

For each hit, check whether the hook registers a `window.addEventListener("storage", handler)`
in a `useEffect`. If missing, log as a UX improvement follow-up.

### 3c · Streaming / async utility coverage

```bash
# Find stream parsing or async data utilities
grep -rn "ReadableStream\|getReader\|SSE\|EventSource" src/ --include="*.ts" | grep -v "\.test\."
```

If a stream-parsing utility exists, verify it has unit tests covering edge cases
(split chunks, incomplete lines, multi-byte characters). If missing, log as a follow-up.

### 3d · Copy-paste errors in parametric tests

Scan new test files that use parametric patterns (multiple similar `it(...)` blocks) for
assertion values that don't match their test description. These are easy to miss:

```bash
# Read any new test files in the diff and look for mismatched descriptions vs assertions
git diff --name-only HEAD~1 -- "*.test.*" | xargs grep -l "it(" 2>/dev/null
```

Open each new test file and check that parametric cases assert the right variant.
For example: a test titled `"applies variant=large class"` must not assert the `small` class.

---

## PR Description Check

Before opening the PR, verify the description reflects the **actual** code in the diff —
not the original plan. Go through each section and confirm:

1. Every file, component, or hook mentioned actually exists in the diff.
2. Every feature claimed as implemented is in the code (not just planned or partially done).
3. Any features that were descoped are either removed from the description or explicitly marked as follow-ups.

```bash
# List all files changed in this branch against the default branch
git diff --name-only "$(git merge-base HEAD origin/HEAD)"..HEAD 2>/dev/null \
  || git diff --name-only HEAD~1
```

Cross-reference the file list against the PR description. If the description mentions
a file or hook that doesn't appear in the diff, the description is stale — update it.

---

## Final gate — Run everything together

```bash
pnpm type-check && pnpm test --run && pnpm lint
```

All three must exit 0. If any fails, fix it before opening the PR.

Also confirm **gate 1e** separately — it is not covered by the commands above. If the
following prints **any** line, gate 1e **FAILS** — do not open the PR until every hit is gone:

```bash
grep -rn "cdf-design-system-alpha" src/ package.json pnpm-lock.yaml 2>/dev/null
```

(Silence means PASS for gate 1e.)

---

## Reporting format

For each gate, report one of:

- ✅ **PASS** — no issues found
- ⚠️ **WARN** (Priority 3 only) — issue found, not blocking, logged as follow-up
- ❌ **FAIL** — blocking issue found, must fix before PR

Produce a summary table at the end:

| Gate | Status | Finding |
|---|---|---|
| 1a Type-check | ✅ PASS | — |
| 1b Tests pass | ❌ FAIL | `useWidget.test.tsx:45` — type mismatch in mock |
| 1c Test coverage | ✅ PASS | — |
| 1d No `: any` in tests | ✅ PASS | — |
| 1e No cdf-design-system-alpha | ✅ PASS | — |
| 2a SDK types | ⚠️ WARN | 2 `Record<string,unknown>` in `services/api.ts` |
| ... | ... | ... |

Only open the PR when all Priority 1 and Priority 2 gates are ✅ PASS.
