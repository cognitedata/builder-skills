# React Refactoring Reference

Detailed patterns for the refactor-react skill. Read only the sections relevant to the current task.

## React 19 Features

### React Compiler (Automatic Memoization)

React 19's compiler automatically memoizes — drop manual `useMemo`/`useCallback` unless on an older version:

```tsx
// React 19: no useCallback/useMemo needed
function ProductList({ products, onSelect }) {
  const handleSelect = (id) => onSelect(id);
  const sorted = products.sort((a, b) => a.name.localeCompare(b.name));
  return sorted.map(p => <ProductCard key={p.id} product={p} onSelect={handleSelect} />);
}
```

### Actions for Form Handling

Replace manual `isPending`/`setError` form boilerplate:

```tsx
// Before
function ContactForm() {
  const [isPending, setIsPending] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPending(true);
    try { await submitForm(new FormData(e.target)); }
    finally { setIsPending(false); }
  };
  return <form onSubmit={handleSubmit}>...</form>;
}

// After (React 19)
function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitForm, null);
  return (
    <form action={formAction}>
      {state?.error && <ErrorMessage error={state.error} />}
      <SubmitButton pending={isPending} />
    </form>
  );
}
```

### useOptimistic

For immediate UI feedback during async operations:

```tsx
function TodoList({ todos, updateTodo }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state, newTodo) => [...state, { ...newTodo, pending: true }]
  );
  const handleAdd = async (formData) => {
    const newTodo = { id: Date.now(), text: formData.get('text') };
    addOptimistic(newTodo);
    await updateTodo(newTodo);
  };
  return (
    <ul>
      {optimisticTodos.map(todo => (
        <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

### use() Hook

Read promises and context in render (wrap in `<Suspense>`):

```tsx
function UserProfile({ userPromise }) {
  const user = use(userPromise);
  return <h1>{user.name}</h1>;
}
```

### Server Components

Default to Server Components; add `'use client'` only when interactivity is needed:

```tsx
// Server Component
async function ProductPage({ id }) {
  const product = await db.products.findById(id);
  return (
    <div>
      <h1>{product.name}</h1>
      <AddToCartButton productId={id} />
    </div>
  );
}

// Client Component
'use client';
function AddToCartButton({ productId }) {
  const [qty, setQty] = useState(1);
  return <button onClick={() => addToCart(productId, qty)}>Add {qty}</button>;
}
```

## Hook Patterns

### useEffect Rules

- Include ALL dependencies; never omit them
- Destructure objects/arrays before using in deps to avoid infinite loops
- Always return cleanup for subscriptions

```tsx
// BAD
useEffect(() => { fetchData(userId); }, []); // missing dep

// GOOD
useEffect(() => {
  const sub = subscribeToData(id);
  return () => sub.unsubscribe();
}, [id]);
```

### Extract Custom Hooks

Move data-fetching and stateful logic out of components:

```tsx
function useUser(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true);
    fetchUser(userId).then(setUser).catch(setError).finally(() => setLoading(false));
  }, [userId]);
  return { user, loading, error };
}
```

### useReducer for Complex State

When multiple `useState` calls update together, consolidate with `useReducer`:

```tsx
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.item], total: state.total + action.item.price };
    default:
      return state;
  }
};
```

## Component Composition Over Prop Drilling

Prop drilling beyond 2 levels → refactor using one of these patterns:

**Composition with children** (preferred for layout):

```tsx
function App() {
  const [user, setUser] = useState(null);
  return (
    <Layout>
      <Sidebar>
        <UserMenu user={user} setUser={setUser} />
      </Sidebar>
    </Layout>
  );
}
```

**Context** (for auth, theme, global app state):

```tsx
const UserContext = createContext(null);
function useUserContext() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('Must be inside UserProvider');
  return ctx;
}
```

**Zustand** (for complex cross-cutting state):

```tsx
const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

## Memoization (Pre-React 19 / without Compiler)

```tsx
const ExpensiveList = React.memo(({ items, onSelect }) => { ... });
const sortedData = useMemo(() => [...data].sort(...), [data, sortConfig]);
const handleClick = useCallback(() => console.log(id), [id]);
```

## TypeScript Patterns

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}
```

## Anti-Patterns to Fix

| Anti-pattern | Fix |
|---|---|
| Array index as key | Use stable unique IDs |
| Props in initial state | Use `key` prop or sync with `useEffect` |
| Direct DOM manipulation | Use `useRef` |
| Inline object/array props | Define outside component or memoize |
| State update in render | Move to `useEffect` |
| `useState` inside ViewModel hook | Move state to shared storage/context |
| Direct SDK/service imports in components | Inject via context |

## Error Handling and Suspense

```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? <ErrorFallback /> : this.props.children; }
}

<Suspense fallback={<PageSkeleton />}>
  <Header />
  <Suspense fallback={<ContentSkeleton />}>
    <MainContent />
  </Suspense>
</Suspense>
```
