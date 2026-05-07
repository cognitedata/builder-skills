# Implementation Reference — Reveal 3D Viewer

Full copy-paste ready implementations. Copy `skills/reveal-3d/code/reveal/` into an app-local feature folder first, typically `src/features/reveal-3d/`, then import from that local folder. **Pattern B (model browser — auto-loads models) is the default** — use it unless the data has explicit FDM → CAD node linkage.

---

## Pattern B (default) — model browser, auto-discovers models via `sdk.models3D.list()`

Canvas-only component — no providers. `CacheProvider`, `RevealKeepAlive`, and `RevealProvider` live in App.tsx.

```tsx
import { useCallback, useMemo } from 'react';
import {
  Reveal3DResources,
  RevealCanvas,
  type AddCadResourceOptions,
} from '@/features/reveal-3d';

export interface ViewerContentProps {
  modelId: number;
  revisionId: number;
}

/**
 * Canvas-only — no CacheProvider, RevealKeepAlive, or RevealProvider here.
 * All providers live in App.tsx so React StrictMode double-invoke completes
 * at startup before any model loading starts.
 */
export function ViewerContent({ modelId, revisionId }: ViewerContentProps) {
  // AddCadResourceOptions is just { modelId, revisionId } — no `type` field.
  // Do NOT use { type: 'cad', modelId, revisionId } — that is TaggedAddResourceOptions.
  const resources = useMemo<AddCadResourceOptions[]>(
    () => [{ modelId, revisionId }],
    [modelId, revisionId]
  );
  const onLoaded = useCallback(() => {}, []);

  return (
    <RevealCanvas>
      <Reveal3DResources resources={resources} onModelsLoaded={onLoaded} />
    </RevealCanvas>
  );
}
```

### src/App.tsx — providers + model browser

```tsx
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useDune } from '@cognite/dune';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { Model3D, Revision3D } from '@cognite/sdk';
import {
  CacheProvider,
  RevealKeepAlive,
  RevealProvider,
  type ViewerOptions,
} from '@/features/reveal-3d';

// Lazy-load canvas content — providers are eagerly imported
const ViewerContent = lazy(() =>
  import('./components/ViewerContent').then((m) => ({ default: m.ViewerContent }))
);

// Module-level constants — stable references, never recreated on re-render
const BG = new THREE.Color(0x1a1a2e);
const VIEWER_OPTIONS: ViewerOptions = {
  loadingIndicatorStyle: { placement: 'topRight', opacity: 0.1 },
  antiAliasingHint: 'msaa2+fxaa',
  ssaoQualityHint: 'medium',
};

type SelectedModel = { modelId: number; revisionId: number };

// --- Model discovery hooks ---

function useModels(query?: string) {
  const { sdk } = useDune();
  return useInfiniteQuery({
    queryKey: ['3d-models', query],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      sdk.models3D.list({ limit: 1000, cursor: pageParam }) as Promise<{
        items: Model3D[];
        nextCursor?: string;
      }>,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor,
    enabled: !!sdk,
    select: useCallback(
      (data: any) => ({
        ...data,
        pages: data.pages.map((p: any) => ({
          ...p,
          items: p.items
            .map((m: Model3D) => ({ ...m, name: m.name.trim() }))
            .filter((m: Model3D) =>
              query ? m.name.toLowerCase().includes(query.toLowerCase()) : true
            ),
        })),
      }),
      [query]
    ),
  });
}

function useBestRevision(modelId?: number) {
  const { sdk } = useDune();
  return useQuery({
    queryKey: ['3d-revisions', modelId],
    queryFn: async () => {
      if (!modelId) return null;
      const all: Revision3D[] = await sdk.revisions3D
        .list(modelId)
        .autoPagingToArray({ limit: -1 });
      const published = all.filter((r) => r.published);
      const candidates = published.length ? published : all;
      return candidates.reduce((best, cur) =>
        best.createdTime > cur.createdTime ? best : cur
      ) ?? null;
    },
    enabled: !!sdk && !!modelId,
  });
}

// --- Model browser ---
//
// RULE 1: onSelect MUST be wrapped in useCallback at the call site.
//   An inline arrow `(m) => setSelected(m)` creates a new reference every render.
//   The useEffect([..., onSelect]) below fires on every render → infinite loop.
//
// RULE 2: call onSelect from useEffect, NOT during render.
//   An if-block during render calling onSelect also causes infinite loops.

function ModelBrowser({ onSelect }: { onSelect: (m: SelectedModel) => void }) {
  const [query, setQuery] = useState('');
  const [pendingId, setPendingId] = useState<number>();
  const { data } = useModels(query);
  const { data: revision } = useBestRevision(pendingId);
  const models = data?.pages.flatMap((p) => p.items) ?? [];

  useEffect(() => {
    if (revision && pendingId) {
      onSelect({ modelId: pendingId, revisionId: revision.id });
    }
  }, [revision, pendingId, onSelect]);

  return (
    <div>
      <input
        placeholder="Search models…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {models.map((m) => (
        <button key={m.id} onClick={() => setPendingId(m.id)}>
          {m.name}
        </button>
      ))}
    </div>
  );
}

// --- App ---

export default function App() {
  const { sdk: client, isLoading } = useDune();
  // Memoize on sdk.project — prevents RevealProvider from remounting on
  // unrelated sdk object reference changes
  const sdk = useMemo(() => client, [client.project]);

  const [selected, setSelected] = useState<SelectedModel | null>(null);

  // useCallback is mandatory — see ModelBrowser RULE 1 above
  const handleSelect = useCallback((m: SelectedModel) => {
    setSelected((prev) => (!prev || prev.modelId !== m.modelId ? m : prev));
  }, []);

  if (isLoading) return <div>Connecting to CDF…</div>;

  return (
    // CacheProvider + RevealKeepAlive always mounted → StrictMode double-invoke
    // completes at startup with no viewer to dispose.
    // RevealProvider conditionally mounts → finds stable RevealKeepAlive viewerRef.
    <CacheProvider>
      <RevealKeepAlive>
        <div style={{ display: 'flex', height: '100vh' }}>
          <aside style={{ width: 280, overflowY: 'auto' }}>
            <ModelBrowser onSelect={handleSelect} />
          </aside>
          <div style={{ flex: 1, position: 'relative' }}>
            {selected && (
              <RevealProvider sdk={sdk} color={BG} viewerOptions={VIEWER_OPTIONS}>
                <Suspense fallback={<div>Loading viewer…</div>}>
                  <ViewerContent
                    modelId={selected.modelId}
                    revisionId={selected.revisionId}
                  />
                </Suspense>
              </RevealProvider>
            )}
          </div>
        </div>
      </RevealKeepAlive>
    </CacheProvider>
  );
}
```

---

## Pattern A (fallback) — FDM auto-discover from an asset instance

Use only when you have a `DMInstanceRef` and the instance has `CogniteVisualizable.object3D → CogniteCADNode` linkage. Otherwise use Pattern B above.

### src/components/ViewerContent.tsx (FDM variant)

```tsx
import { useCallback, useMemo, useState } from 'react';
import type { DMInstanceRef } from '@cognite/reveal';
import {
  Reveal3DResources,
  RevealCanvas,
  useModelsForInstanceQuery,
  type AddCadResourceOptions,
  type TaggedAddResourceOptions,
} from '@/features/reveal-3d';

function pickFirstCad(models: TaggedAddResourceOptions[]): AddCadResourceOptions | undefined {
  const m = models[0];
  return m?.type === 'cad'
    ? { ...m.addOptions, styling: { default: { renderGhosted: true } } }
    : undefined;
}

export function ViewerContent({ instance }: { instance: DMInstanceRef }) {
  const { data: models, isLoading } = useModelsForInstanceQuery(instance);
  const [loaded, setLoaded] = useState(false);
  const selected = useMemo(() => pickFirstCad(models ?? []), [models]);
  const resources = useMemo(() => (selected ? [selected] : []), [selected]);
  const onLoaded = useCallback(() => setLoaded(true), []);

  if (isLoading) return <div>Loading 3D model…</div>;
  if (!resources.length) return <div>No 3D data linked to this instance.</div>;

  return (
    <RevealCanvas>
      <Reveal3DResources resources={resources} onModelsLoaded={onLoaded} />
    </RevealCanvas>
  );
}
```

### src/App.tsx (FDM variant)

Same `CacheProvider` / `RevealKeepAlive` / `RevealProvider` structure as Pattern B.
Pass `instance: DMInstanceRef` to `ViewerContent` instead of `modelId` / `revisionId`.

```tsx
import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { useDune } from '@cognite/dune';
import type { DMInstanceRef } from '@cognite/reveal';
import {
  CacheProvider,
  RevealKeepAlive,
  RevealProvider,
  type ViewerOptions,
} from '@/features/reveal-3d';
import { ViewerContent } from './components/ViewerContent';

const BG = new THREE.Color(0x1a1a2e);
const OPTS: ViewerOptions = {
  loadingIndicatorStyle: { placement: 'topRight', opacity: 0.1 },
  antiAliasingHint: 'msaa2+fxaa',
  ssaoQualityHint: 'medium',
};

export default function App() {
  const { sdk: client, isLoading } = useDune();
  const sdk = useMemo(() => client, [client.project]);
  // Replace with however you receive the instance ref (prop, route param, selection, etc.)
  const [instance] = useState<DMInstanceRef | null>(null);

  if (isLoading) return <div>Connecting to CDF…</div>;

  return (
    <CacheProvider>
      <RevealKeepAlive>
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
          {instance && sdk.project && (
            <RevealProvider sdk={sdk} color={BG} viewerOptions={OPTS}>
              <ViewerContent instance={instance} />
            </RevealProvider>
          )}
        </div>
      </RevealKeepAlive>
    </CacheProvider>
  );
}
```
