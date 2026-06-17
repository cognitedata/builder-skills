# React Refactoring Examples

Concrete before/after examples for the refactor-react skill.

## Example 1: Extract Custom Hook

**Input:** Component with inline data-fetching and loading/error state mixed with UI.

```tsx
function UserDashboard({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchUser(userId).then(setUser).catch(setError).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <EmptyState />;

  return <UserProfile user={user} />;
}
```

**Output:** Hook extracted; component handles only rendering.

```tsx
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchUser(userId).then(setUser).catch(setError).finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
}

function UserDashboard({ userId }: { userId: string }) {
  const { user, loading, error } = useUser(userId);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <EmptyState />;

  return <UserProfile user={user} />;
}
```

**Changes Made:**
- Extracted `useUser` hook for data-fetching logic
- Component now has a single responsibility: rendering

**Rationale:** Separating data logic from UI makes both easier to test and reuse.

---

## Example 2: Split Oversized Component

**Input:** 200-line component handling filters, table, and detail panel.

**Output:**
- `useOrdersViewModel` — filter state, data loading, selection logic
- `OrdersFilters` — filter UI only
- `OrdersTable` — table rendering
- `OrderDetailPanel` — detail panel
- `OrdersView` — composes the above (~40 lines)

**Changes Made:**
- Moved business logic to ViewModel hook backed by shared context
- Split UI into focused presentational components
- Parent composes children instead of prop drilling

**Rationale:** Each file has one responsibility; ViewModel is testable in isolation.

---

## Example 3: Replace Form Boilerplate with Actions (React 19)

**Input:** Manual pending/error state in form submit handler.

**Output:** `useActionState` with `form action` attribute.

**Changes Made:**
- Removed `isPending`/`setIsPending` state
- Replaced `onSubmit` handler with `useActionState` action
- Error display reads from action state

**Rationale:** Actions eliminate repetitive async form state management.

---

## Example 4: Fix Prop Drilling with Composition

**Input:** `user` and `setUser` passed through 4 component levels.

**Output:** `UserProvider` context at layout level; leaf components call `useUserContext()`.

**Changes Made:**
- Added `UserContext` and `useUserContext` hook with guard clause
- Removed intermediate prop passing
- Provider wraps layout subtree

**Rationale:** Context eliminates intermediate components that exist only to forward props.
