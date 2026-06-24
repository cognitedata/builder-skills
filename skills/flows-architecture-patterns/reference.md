> ## Documentation Index
> Fetch the complete documentation index at: https://docs.cognite.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Flows custom app architecture patterns reference

> Complete reference for architectural patterns and pitfalls in Flows custom apps.

AI coding agents optimize for code that works now, not patterns that stay consistent. As Flows custom apps grow, implementations drift and become harder to review, test, and change safely. [Spec-driven development](/cdf/flows/concepts/spec-driven-development) helps keep requirements and implementation aligned when working with agents.

Apply consistent patterns in these four areas to keep your codebase legible as your Flows custom app grows:

* **Server state** → [TanStack React Query](https://tanstack.com/query/latest).
* **Validated types** → [Zod](https://zod.dev) at the SDK boundary.
* **Shared client state** → [Zustand](https://zustand.docs.pmnd.rs) (when state changes often) or React Context (for stable globals).
* **Component shape** → business logic in hooks, components for rendering UI.

This page is a pattern catalog with side-by-side Do/Don't examples. Read [Across all patterns](#across-all-patterns) before you simplify boilerplate. For a scan-friendly summary after the patterns, see [Quick reference](#quick-reference).

## Across all patterns

These apply regardless of which patterns you follow.

<Warning>
  * **Input validation at trust boundaries.** Parse data from the SDK and from forms with Zod. TypeScript types are erased at runtime, so "the types already match" is not a reason to skip this.
  * **Error handling that prevents data loss.** Mutations should have `onError` rollbacks. A silent failure that leaves CDF in a partial state is harder to recover from than a visible error.
  * **CDF SDK only.** All CDF calls via `useCogniteSdk()`. Raw `fetch` or `axios` calls bypass CDF authentication controls and lose automatic token refresh, rate-limit retries, and request tracing.
  * **Security.** No secrets in client code, no `dangerouslySetInnerHTML` with unescaped user content.
  * **Accessibility.** Meaningful `aria` labels on interactive elements, keyboard navigability, no `onClick` on non-interactive elements like `<div>`.
  * **Anything explicitly requested.** If a requirement, ticket, or review comment calls something out, it is not optional.
</Warning>

For certification scoring on design and accessibility, see [Flows custom apps quality guidelines](/cdf/flows/guides/quality-guidelines).

## State: choosing the right tool

Use the table below to pick the right state tool. It prevents most over- and under-engineering before you read the patterns.

| State type                                                            | Tool                                     |
| --------------------------------------------------------------------- | ---------------------------------------- |
| Local to one component                                                | `useState`                               |
| Stable global value (the CDF client, current user, feature flags)     | React Context                            |
| Frequently-updating shared state (selections, filters, wizard drafts) | Zustand                                  |
| Anything fetched from CDF                                             | React Query — never copy into `useState` |

React Context is the right default for stable globals. The Flows custom app scaffold already provides the CDF client via `CogniteSdkProvider`, so you thin-wrap its hook. Reach for Zustand when state changes frequently across many components or causes re-render storms.

<Tip>
  To reset all state in a component when an entity changes (for example, switching between contacts in an edit form), pass the entity's ID as `key`. React treats components with different keys as separate instances and resets their state automatically. No `useEffect` required.

  ```tsx wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // No useEffect needed to reset form state when selectedContact changes
  <EditForm key={selectedContact.id} contact={selectedContact} />
  ```
</Tip>

## Recommended folder shape

Group code by feature, not by technical type. Instead of top-level `hooks/`, `components/`, and `services/` folders that mix unrelated concerns, each feature gets its own folder with everything it needs: data, state, schema, and UI.

```text wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
src/
  features/
    alert-triage/
      ui/               # presentational components specific to alert-triage
      context/          # context providers specific to alert-triage
      hooks/            # hooks specific to alert-triage
        useTriageVM.ts    # view-model hook (owns data + commands)
        useAlerts.ts      # query hook for this feature
      store.ts          # Zustand: client state for alert-triage
      schema.ts         # Zod validation schemas for alert-triage
      index.ts          # public API of the feature
  context/              # Shared context providers
  hooks/                # Shared hooks
  stores/               # Shared Zustand store
  ui/                   # Shared UI components
    ErrorState.tsx        # one shared error surface
  App.tsx               # shell + ErrorBoundary + QueryClientProvider
```

## Patterns

This section covers areas where Flows custom apps can drift as they grow. Where a pattern has a clear counterpart to avoid, a side-by-side example shows both.

### Use React Query for all server state

A common pattern in growing Flows custom apps is fetching data with `useState` + `useEffect`. Developers often add a manual loading flag, a cancelled ref to handle race conditions, and a counter to force refetches.

This hand-rolled loop is roughly what React Query does — except without caching, deduplication, background refresh, or retries. React Query ships with every Flows custom app; use it for all CDF reads and writes. See [TanStack Query in Flows](/cdf/flows/concepts/features#data-fetching-with-tanstack-query) for how the scaffold wires data fetching to CDF.

<CodeGroup>
  ```typescript Do wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  function useWellList(startDate: string, endDate: string) {
    return useQuery({
      queryKey: ["wells", startDate, endDate],
      queryFn: async () => {
        const [wells, deferments] = await Promise.all([
          fetchWells(),
          fetchDeferments(),
        ]);
        return joinWellData(wells, deferments);
      },
      staleTime: 60_000,
    });
    // caching, dedup, retries, background refetch: included
  }
  ```

  ```typescript Don't wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  function useWellList(startDate: string, endDate: string) {
    const [rows, setRows] = useState<Row[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [fetchKey, setFetchKey] = useState(0); // refetch hack

    useEffect(() => {
      let cancelled = false;
      setIsLoading(true);
      setError(null);
      Promise.all([fetchWells(), fetchDeferments()])
        .then(([w, d]) => { if (!cancelled) setRows(joinWellData(w, d)); })
        .catch((e) => { if (!cancelled) setError(e); })
        .finally(() => { if (!cancelled) setIsLoading(false); });
      return () => { cancelled = true; };
    }, [fetchKey, startDate, endDate]);

    const refetch = () => setFetchKey((k) => k + 1);
    // no cache, no dedup, no bg refresh, no retry
  }
  ```
</CodeGroup>

<Tip>
  Query keys must be unique and specific to avoid cache collisions — a collision silently serves wrong data and is difficult to debug in production. Always include the resource type and all relevant parameters. Keys should mirror the shape of the underlying API request: a `GET /projects?userId=123&status=active` call maps to `["projects", userId, status]`.
</Tip>

<Note>
  `useState` is intended for local UI state (modals, form inputs, toggles). React Query handles server state and API data — never copy query data into `useState`, which opts out of background updates and causes the UI cache to drift from the server.
</Note>

### Parse at the SDK boundary with Zod

CDF instance properties are loosely typed by nature. Without an explicit parse step, that looseness leaks into the rest of your Flows custom app: every component that needs a value ends up re-asserting the same assumptions with `as` casts and ad-hoc coercers.

Parse the response into a known shape once, at the point where it enters your Flows custom app, and downstream code can trust the type without re-asserting it.

<CodeGroup>
  ```typescript Do wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // schema.ts — one schema per view; z.infer is the type
  const WellSchema = z.object({
    name: z.string().optional(),
    uwi: z.string().nullish(),
    latitudeWGS84: z.coerce.number().default(0),
    longitudeWGS84: z.coerce.number().default(0),
  });
  type Well = z.infer<typeof WellSchema>;

  function mapNode(node: NodeDefinition): Well {
    const raw = node.properties?.[VIEW.space]?.[KEY] ?? {};
    return WellSchema.parse(raw);
    // wrong shape → throws here, surfaced as a query error
    // not silently wrong data
  }
  ```

  ```typescript Don't wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  function getViewProps(node: NodeDefinition) {
    const bySpace = (node.properties as Record<string, Record<string, unknown>>)
      ?.[VIEW.space];
    return (bySpace?.[KEY] as Record<string, unknown>) ?? {};
  }

  function mapNode(node: NodeDefinition): Well {
    const p = getViewProps(node);
    return {
      name: (p.name as string) ?? node.externalId,
      uwi: p.uwi as string,
      latitudeWGS84: Number(p.latitudeWGS84) || 0,
      // if latitudeWGS84 is renamed upstream, this silently
      // becomes 0 — no error, ever
    };
  }
  ```
</CodeGroup>

<Note>
  Parse at exactly two seams: SDK → app (responses) and form → SDK (writes). Downstream functions receive a real typed value, not `unknown`.
</Note>

### Keep data access thin

It's tempting to wrap CDF calls in service classes with interfaces for testability, but for a read-mostly UI, the overhead rarely pays off. An interface, a class, a ServicesContext, and a per-hook DepsContext to perform a single `list()` means touching four files for what should be one hook. A typed query hook is sufficient.

<CodeGroup>
  ```typescript Do wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // useAlerts.ts — one obvious place per resource
  export function useAlerts() {
    const client = useCogniteSdk();
    return useQuery({
      queryKey: ["alerts"],
      queryFn: async () => {
        const res = await client.instances.list(ALERT_SOURCE);
        return res.items.map((node) => {
          const raw = node.properties?.[VIEW.space]?.[KEY] ?? {};
          return AlertSchema.parse(raw);
          // consumers receive Alert[] — never unknown
        });
      },
    });
  }
  ```

  ```typescript Don't wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // services/cpv-plan-service.ts
  export interface CpvPlanService {
    listPlans(): Promise<CpvPlan[]>;
  }
  export class ApiCpvPlanService implements CpvPlanService { /* ... */ }

  // contexts/services-context.tsx
  const defaultServices = {
    cpvPlanService: new MockCpvPlanService(), // mock as the default!
  };
  export const useServices = () => useContext(ServicesContext);

  // + a per-hook DepsContext just to inject a mock in tests
  ```
</CodeGroup>

<Tip>
  A service class earns its place when there's real logic — pagination, joining, write-shaping — or a genuine need to swap implementations. Start with a typed query hook; promote only when the body actually grows.
</Tip>

<Note>
  All CDF API calls must go through the SDK via `useCogniteSdk()`. Never make raw `fetch` or `axios` requests to CDF endpoint URLs. The SDK handles token refresh, retries on rate-limit errors (429s), typed error responses, and consistent request tracing — none of which you get from a plain fetch.
</Note>

### Choose the right home for client state

React Context and Zustand solve different problems. Context re-renders every consumer when its value changes, which suits values that rarely change. Zustand re-renders only components that subscribe to the changed slice, which suits values that change frequently.

Use Context for app-shell configuration that is set once and read everywhere, for example, the CDF client, current user, and feature flags. Use Zustand for state that updates during user interaction, such as selections, filters, and wizard drafts, or that many unrelated components read.

<CodeGroup>
  ```typescript Do wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // store.ts — colocated with the feature
  // Use Zustand for state that changes often (filters, selection)
  export const useTriageStore = create<TriageState>((set) => ({
    selectedId: null,
    filters: defaultFilters,
    select: (id) => set({ selectedId: id }),
    setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  }));

  // Components subscribe only to the slice they need
  function Row({ id }: { id: string }) {
    const selected = useTriageStore((s) => s.selectedId === id);
    const select = useTriageStore((s) => s.select);
    // re-renders only when this row's selected state changes
  }
  ```

  ```typescript Don't wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // State threaded through every level as props
  <Page selected={sel} onSelect={setSel} filters={f} setFilters={setF} />
    <Toolbar filters={f} setFilters={setF} />
    <Table selected={sel} onSelect={setSel} filters={f} />
      <Row selected={sel} onSelect={setSel} />

  // Or a hand-rolled Context per concern
  const Ctx = createContext(null);
  function Provider({ children }) {
    const [sel, setSel] = useState<string | null>(null);
    return <Ctx.Provider value={{ sel, setSel }}>{children}</Ctx.Provider>;
  }
  // Every consumer re-renders when any value in the context changes
  ```
</CodeGroup>

<Note>
  Start with `useState` for local state. Lift to Context when a stable value needs to be available across the tree. Reach for Zustand when that value starts changing frequently, when you're prop-drilling beyond 3 levels, or when Context re-renders become noticeable.
</Note>

### Separate data from display

When components grow past a few hundred lines, they are usually doing too much: fetching their own data, computing derived values, and rendering in one place. That makes them harder to test in isolation and easier to break with unrelated edits. Extract data and logic into a view-model hook instead, and let the component focus on rendering.

<CodeGroup>
  ```typescript Do wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // hook owns data & commands — testable in isolation
  function usePipelineRun() {
    const run = useMutation({ mutationFn: runPipeline });
    return { run: run.mutate, isPending: run.isPending, error: run.error };
  }

  // component is a thin binding to the design system
  function PipelinePanel() {
    const { run, isPending, error } = usePipelineRun();
    return (
      <Card>
        <Button onClick={() => run()} disabled={isPending}>
          {isPending ? "Running…" : "Run"}
        </Button>
        {error && <Alert variant="destructive">{error.message}</Alert>}
      </Card>
    );
  }
  ```

  ```typescript Don't wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  function PipelinePanel({ sdk }: { sdk: CogniteClient }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // dozens more useState, inline service calls, business logic…

    return (
      <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: 16 }}>
        <button
          style={{ background: loading ? "#999" : "#1b5fcc", color: "#fff" }}
          onClick={async () => {
            setLoading(true);
            try { await sdk.functions.call(/* ... */); }
            catch (e) { setError(String(e)); }
            finally { setLoading(false); }
          }}
        >
          {loading ? "Running…" : "Run"}
        </button>
        {error && <pre style={{ color: "red" }}>{error}</pre>}
      </div>
    );
  }
  ```
</CodeGroup>

### No business logic in UI components

This extends the view-model pattern above. When agents or developers add features quickly, business logic accumulates in components: a `useQuery` call here, a `useEffect` fetch there, an inline command handler that should live in a hook. Over time the component becomes the source of truth for data fetching and commands that belong in hooks. Keep components responsible for rendering and local UI state only; everything else belongs in a hook instead.

<CodeGroup>
  ```tsx Do wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  function FormUI() {
    // business logic lives in the hook
    const { data, isLoading, addData } = useFormBusinessLogic();

    // UI state stays in the component
    const [modalOpen, setModalOpen] = useState(false);

    // simple UI events are fine
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      // ...
    };

    return <div>...</div>;
  }
  ```

  ```tsx Don't wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  function FormUI() {
    // BAD: data fetching in the component
    const { data } = useQuery({ queryKey: ["form"], queryFn: fetchFormData });
    const { mutate } = useMutation({ mutationFn: submitForm });

    // BAD: business command defined in the component body
    useEffect(() => {
      api.fetch().then(setState);
    }, []);

    const addData = useCallback(() => {
      api.addData();
    }, []);

    return <div>...</div>;
  }
  ```
</CodeGroup>

<Note>
  Modal open/close, hover, and resize observers are UI state. Keep them in the component.
</Note>

### Compute derived values during rendering

When a value can be computed from existing props or state, the temptation is to store a copy in `useState` and keep it in sync with `useEffect`. This is unnecessary: React re-runs the component on every relevant state change anyway, and an inline `const` is always up to date. The `useEffect` version causes two renders: one with the stale value, one after the Effect fires, and adds a copy that can drift from its source.

<CodeGroup>
  ```typescript Do wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // Always up to date — no Effect needed
  const filtered = items.filter((i) => i.active);

  // For genuinely expensive transforms, memoize
  const sorted = useMemo(() => items.slice().sort(byDate), [items]);
  ```

  ```typescript Don't wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // Extra state that can drift from its source
  const [filtered, setFiltered] = useState([]);
  useEffect(() => {
    setFiltered(items.filter((i) => i.active));
  }, [items]);
  // Causes two renders: one with the stale value, one after the Effect fires
  ```
</CodeGroup>

<Tip>
  The [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) React article covers the full range of cases where `useEffect` is the wrong tool: derived state, event handlers, parent notification, and more.
</Tip>

### Keep hooks single-purpose

As features grow, hooks often return unrelated values together: query data, derived fields, and callbacks in one object. A component that uses only one of those values still re-renders when any other value changes. Split hooks by responsibility, not by feature area.

<CodeGroup>
  ```typescript Do wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // Split into focused hooks — each component subscribes to what it needs
  const useUserStats = () => {
    // ...
    return { userStats };
  };

  const useChartData = () => {
    // ...
    return { chartData };
  };

  function UserStatsComponent() {
    const { userStats } = useUserStats();
    // only re-renders when userStats changes
    return <div>{userStats.total}</div>;
  }
  ```

  ```typescript Don't wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  const useDashboardLogic = () => {
    // lots of unrelated logic
    return { userStats, chartData, recentActivity, settings };
  };

  function UserStatsComponent() {
    // re-renders when chartData or recentActivity change,
    // even though this component only uses userStats
    const { userStats } = useDashboardLogic();
    return <div>{userStats.total}</div>;
  }
  ```
</CodeGroup>

<Note>
  Signal to split: multiple components call the same hook but destructure completely different values.
</Note>

### Expose a narrow interface from hooks

Returning the full `query` or `mutation` object from a hook is tempting, but it leaks React Query internals to every caller. If you later change how data is fetched, such as swapping a query for a subscription or adding a transformation, you must update every component that destructures the raw object. Expose only what callers need: data, a loading flag, and named command functions.

<CodeGroup>
  ```typescript Do wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  function useFormBusinessLogic() {
    const query = useQuery({ queryKey: ["form"], queryFn: fetchFormData });
    const mutation = useMutation({ mutationFn: submitForm });

    // wrap mutations in named command functions
    const addData = (data: DataType) => mutation.mutate(data);

    // derive cheap values inline
    const itemCount = query.data?.length ?? 0;

    // memoize only when profiling shows a real cost
    const sortedItems = useMemo(
      () => query.data?.slice().sort(byDate),
      [query.data]
    );

    return {
      data: query.data,
      isLoading: query.isLoading,
      addData,
      itemCount,
      sortedItems,
    };
  }
  ```

  ```typescript Don't wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  function useFormBusinessLogic() {
    const query = useQuery({ queryKey: ["form"], queryFn: fetchFormData });
    const mutation = useMutation({ mutationFn: submitForm });
    const store = useMyStore(); // raw store exposed directly

    // returning full objects leaks internals to every caller
    return { query, mutation, store };
  }
  ```
</CodeGroup>

### Make impure dependencies injectable

Hooks that call `useQuery`, `useMutation`, routing hooks, or SDK clients are impure. Hard-coded imports make them difficult to test without `vi.mock`. That workaround is path-coupled and not type-checked. It can also break silently when you rename or move a file.

There are two ways to make dependencies injectable. Choose based on the unit's depth in the tree, and be consistent within a unit:

* For shallow units, add a `deps` prop with real implementations as the default. Tests pass a typed substitute directly, no mocking needed.
* For containers and nested trees, put dependencies in a `.context.tsx` file with real defaults so production code needs no Provider. Tests inject via `<Context.Provider value={fakeDeps}>`.

<CodeGroup>
  ```tsx Do — Default-Props DI wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // tasks.tsx
  import { useTasks as useTasksImpl } from "../services/use-tasks";
  import type { Task } from "../types";

  type TasksDeps = {
    useTasks: () => { isLoading: boolean; tasks: Task[] };
  };
  const defaultDeps: TasksDeps = { useTasks: useTasksImpl };

  export const Tasks = ({ deps = defaultDeps }: { deps?: TasksDeps }) => {
    const { isLoading, tasks } = deps.useTasks();
    if (isLoading) return <Spinner />;
    return <ul>{tasks.map((t) => <TaskItem key={t.id} task={t} />)}</ul>;
  };

  // tasks.spec.tsx — no vi.mock needed
  const deps: ComponentProps<typeof Tasks>["deps"] = {
    useTasks: vi.fn(() => ({ isLoading: false, tasks: [{ id: "1", text: "a" }] })),
  };
  render(<Tasks deps={deps} />);
  ```

  ```tsx Don't wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // Discouraged for first-party modules: path-coupled, not type-checked.
  // Renaming use-tasks.ts breaks this test without a type error.
  import { useTasks } from "../services/use-tasks";
  vi.mock("../services/use-tasks", () => ({
    useTasks: () => ({ isLoading: false, tasks: [] }),
  }));
  ```
</CodeGroup>

<Note>
  `vi.mock` remains appropriate for third-party and external libraries. For first-party code, prefer a typed seam. If you find yourself prop-drilling `deps` through intermediate components, switch to Context DI instead.
</Note>

### Use Aura instead of inline styles

Inline `style={{}}` objects bypass the `aura/no-overriding-styles` ESLint guardrail and guarantee visual drift from the [Aura design system](/aura-design-system/index). They also signal that the component is doing too much: they often appear in oversized components that also mix in data fetching and business logic.

If you need to customize the appearance or styling, follow this order of priority:

1. Use the component props and variants available in the design system.
2. Use [Tailwind utility classes](https://tailwindcss.com/docs/styling-with-utility-classes) for additional styling.
3. If neither option is sufficient, raise a support ticket with the Aura team.

For details on supported customization options, see the [Aura customization documentation](https://docs.cognite.com/aura-design-system/foundations/customization).

<CodeGroup>
  ```tsx Do wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  function StatusCard({ status }: { status: "ok" | "error" }) {
    return (
      <Card>
        <Badge variant={status === "ok" ? "success" : "destructive"}>
          {status}
        </Badge>
      </Card>
    );
  }
  ```

  ```tsx Don't wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  function StatusCard({ status }: { status: "ok" | "error" }) {
    return (
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 6,
          padding: 16,
        }}
      >
        <span style={{ color: status === "ok" ? "green" : "red" }}>
          {status}
        </span>
      </div>
    );
  }
  ```
</CodeGroup>

<Note>
  The `aura/no-overriding-styles` ESLint rule enforces this automatically. Don't disable or suppress it. Browse [Aura primitives](/aura-design-system/primitives/index) for layout and feedback components — for example [Card](/aura-design-system/primitives/card) and [Badge](/aura-design-system/primitives/badge) — instead of styled HTML elements.
</Note>

### Centralize your data model config

Do not scatter view IDs, space names, and property keys as string literals across your codebase. When you port a Flows custom app to another CDF project, or rename a space or view, you must find and replace every occurrence by hand. Keep all identifiers in `config/model.ts` and import from there instead. For batching and concurrency when you read and write instances, use the `dm-limits-and-best-practices` builder skill ([About builder skills](/cdf/flows/concepts/skills)).

<CodeGroup>
  ```typescript Do wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // config/model.ts — one place for all CDF view identifiers
  export const MODEL = {
    space: "my-solution-space",
    views: {
      well: { externalId: "Well", version: "1" },
    },
    properties: {
      well: { name: "name", uwi: "uwi", lat: "latitudeWGS84" },
    },
  } as const;

  // Changing the space name means editing one line here.
  // All usages across the codebase update automatically.
  function useWells() {
    const client = useCogniteSdk();
    return useQuery({
      queryKey: ["wells"],
      queryFn: () =>
        client.instances.list({
          sources: [{ source: { type: "view", ...MODEL.views.well, space: MODEL.space } }],
        }),
    });
  }
  ```

  ```typescript Don't wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // useWells.ts
  function useWells() {
    const client = useCogniteSdk();
    return useQuery({
      queryKey: ["wells"],
      queryFn: () =>
        client.instances.list({
          sources: [{ source: { type: "view", externalId: "Well", version: "1", space: "my-solution-space" } }],
        }),
    });
  }

  // useWellFilters.ts — same literals, different file
  const filter = { equals: { property: ["my-solution-space", "Well/1", "uwi"], value: uwi } };

  // WellDetail.tsx — and again
  const lat = node.properties?.["my-solution-space"]?.["Well/1"]?.["latitudeWGS84"];

  // Rename the space or bump the view version and you'll miss at least one.
  ```
</CodeGroup>

### Handle errors in two layers

Without a defined error strategy, each component handles failures differently. Some store error text in state and render a red `<pre>`. Others fail silently with an empty screen. An uncaught render error can crash the whole iframe. Use two layers for most cases.

<CodeGroup>
  ```tsx Do wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // App.tsx — one boundary at the shell catches render crashes
  <ErrorBoundary fallback={<AppError />}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ErrorBoundary>

  // Per view — use the query's own error state
  const { data, error, isError, refetch } = usePlans();
  if (isError) return <ErrorState onRetry={refetch} error={error} />;

  // <ErrorState /> is one shared component used everywhere
  ```

  ```tsx Don't wrap theme={"languages":{"custom":["/_languages/kuiper.json","../_languages/kuiper.json"]}}
  // Per-component string + red pre
  try {
    const data = await svc.load();
    setData(data);
  } catch (e) {
    setError(e instanceof Error ? e.message : String(e));
  }

  {error && <pre style={{ color: "red" }}>{error}</pre>}
  // A render crash takes down the whole iframe.
  // Retry = reload the page.
  ```
</CodeGroup>

## Quick reference

The following table summarizes the patterns on this page.

| Stop doing                                                   | Start doing                                                                                                |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Fetching with `useState` + `useEffect` + `fetchKey`          | All CDF reads and writes behind `useQuery`/`useMutation` in a dedicated hook                               |
| Chained `as` casts at every call site                        | One Zod schema per view; `parse()` at both seams; type via `z.infer`                                       |
| Interface + class + two context layers for a single `list()` | Typed `use*` hook with `useQuery` inline                                                                   |
| Prop-drilling shared state beyond 3 levels                   | Zustand for frequently-updating state; Context for stable globals                                          |
| Components that fetch, compute, and render                   | View-model hook + thin Aura-built component; `useQuery`/`useMutation` only in hooks, never in `.tsx` files |
| Hooks that return full `query`/`mutation` objects            | Narrow return: `{ data, isLoading, addData }`                                                              |
| One hook returning everything for a domain                   | Focused single-purpose hooks per concern                                                                   |
| `vi.mock` on first-party modules to bypass missing seams     | Typed DI (Default-Props or Context)                                                                        |
| Inline `style={{}}` objects                                  | Aura/Tailwind primitives enforced by `aura/no-overriding-styles`                                           |
| View IDs and space names scattered as string literals        | Central `config/model.ts`                                                                                  |
| Per-component error strings / red `<pre>`                    | One `<ErrorBoundary>` at the shell + shared `<ErrorState onRetry />`                                       |

## Related topics

* [About Flows custom app features](/cdf/flows/concepts/features) — Scaffolding, TanStack Query, auth, and what ships with every Flows custom app.
* [Auth API](/cdf/flows/reference/api/auth) — `connectToHostApp`, `HostAppAPI`, and authenticated SDK access.
* [About spec-driven development](/cdf/flows/concepts/spec-driven-development) — Checked-in specs for you and your agent.
* [About builder skills](/cdf/flows/concepts/skills) — Skills including `design`, `dm-limits-and-best-practices`, and `security`.
* [Flows custom apps quality guidelines](/cdf/flows/guides/quality-guidelines) — Certification rubric including Aura consistency.
* [Aura design system](/aura-design-system/index) — Components, tokens, and patterns for Flows custom app UIs.
* [Get started with Flows](/cdf/flows/guides/getting-started) — Create a project and run it in CDF.
