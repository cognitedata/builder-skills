# Implementation Reference — Reveal 3D Viewer

Full copy-paste ready implementations using `@cognite/reveal-widget`. `RevealWidget` is driven imperatively through a `RevealWidgetController`, obtained via `setControllerRef` — there is no declarative provider tree to assemble.

---

## Controller pattern (base for every variant below)

Wrap `RevealWidgetController` in your own class so app code (click handlers, selection state, etc.) can drive the viewer without threading prop changes through `useEffect`.

```tsx
import { useRef } from 'react';
import type { CogniteClient } from '@cognite/sdk';
import {
  RevealWidget,
  type Reveal3DResourceHandle,
  type RevealWidgetController,
} from '@cognite/reveal-widget';

class ThreeDViewerController {
  private models: Reveal3DResourceHandle[] = [];

  constructor(private readonly widgetController: RevealWidgetController) {}

  async add(resource: Parameters<RevealWidgetController['addResource']>[0]) {
    const handle = await this.widgetController.addResource(resource);
    this.models.push(handle);
    this.widgetController.cameraController.focusModel(handle);
    return handle;
  }

  dispose(): void {
    this.models.forEach((m) => m.remove());
    this.models = [];
  }
}

export function ViewerHost({ sdk }: { sdk: CogniteClient }) {
  const viewerRef = useRef<ThreeDViewerController>();

  function handleControllerRef(widgetController: RevealWidgetController | undefined) {
    viewerRef.current?.dispose();
    viewerRef.current = widgetController
      ? new ThreeDViewerController(widgetController)
      : undefined;
  }

  return (
    <div style={{ width: '100%', height: '70vh', position: 'relative' }}>
      <RevealWidget
        viewerOptions={{ sdk, useCoreDm: true }}
        setControllerRef={handleControllerRef}
      />
    </div>
  );
}
```

Reuse this shape across all patterns below — only the resource identifiers and the surrounding UI change.

---

## Pattern A (default) — model browser, classic modelId/revisionId

Discover models via `sdk.models3D.list()`, let the user pick one, then load it with a classic CAD identifier.

```tsx
import { useCallback, useMemo, useRef, useState } from 'react';
import { useDune } from '@cognite/dune';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { CogniteClient, Model3D, Revision3D } from '@cognite/sdk';
import {
  RevealWidget,
  type CadAddOptions,
  type Reveal3DResourceHandle,
  type RevealWidgetController,
} from '@cognite/reveal-widget';

type SelectedModel = { modelId: number; revisionId: number };

class ThreeDViewerController {
  private current: Reveal3DResourceHandle | undefined;

  constructor(private readonly widgetController: RevealWidgetController) {}

  async loadModel(modelId: number, revisionId: number): Promise<void> {
    this.current?.remove();
    const resource: CadAddOptions = {
      type: 'cad',
      sourceType: 'classic',
      modelId,
      revisionId,
      modelCategory: 'model3d',
    };
    this.current = await this.widgetController.addResource(resource);
    this.widgetController.cameraController.focusModel(this.current);
  }

  dispose(): void {
    this.current?.remove();
  }
}

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

// RULE: onSelect MUST be wrapped in useCallback at the call site, and called
// from useEffect, never from render — otherwise React re-renders in a loop.
function ModelBrowser({ onSelect }: { onSelect: (m: SelectedModel) => void }) {
  const [query, setQuery] = useState('');
  const { data } = useModels(query);
  const models = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div>
      <input
        placeholder="Search models…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {models.map((m) => (
        <ModelRow key={m.id} model={m} onSelect={onSelect} />
      ))}
    </div>
  );
}

function ModelRow({
  model,
  onSelect,
}: {
  model: Model3D;
  onSelect: (m: SelectedModel) => void;
}) {
  const { data: revision } = useBestRevision(model.id);
  return (
    <button
      disabled={!revision}
      onClick={() => revision && onSelect({ modelId: model.id, revisionId: revision.id })}
    >
      {model.name}
    </button>
  );
}

// --- App ---

export function ViewerPage() {
  const { sdk: client, isLoading } = useDune();
  const sdk = useMemo(() => client, [client.project]);
  const viewerRef = useRef<ThreeDViewerController>();

  const handleControllerRef = useCallback(
    (widgetController: RevealWidgetController | undefined) => {
      viewerRef.current?.dispose();
      viewerRef.current = widgetController
        ? new ThreeDViewerController(widgetController)
        : undefined;
    },
    []
  );

  const handleSelect = useCallback((m: SelectedModel) => {
    void viewerRef.current?.loadModel(m.modelId, m.revisionId);
  }, []);

  if (isLoading) return <div>Connecting to CDF…</div>;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 280, overflowY: 'auto' }}>
        <ModelBrowser onSelect={handleSelect} />
      </aside>
      <div style={{ flex: 1, position: 'relative' }}>
        <RevealWidget
          viewerOptions={{ sdk, useCoreDm: true }}
          setControllerRef={handleControllerRef}
        />
      </div>
    </div>
  );
}
```

---

## Pattern B — direct model ID (classic or CDM)

When the user already supplies IDs, skip the browser and load directly.

```tsx
import type { CadAddOptions } from '@cognite/reveal-widget';

// Classic model/revision IDs
const classicResource: CadAddOptions = {
  type: 'cad',
  sourceType: 'classic',
  modelId: 206509079235820,
  revisionId: 576781257263693,
  modelCategory: 'model3d',
};

// CDM (data-modeling) model reference
const cdmResource: CadAddOptions = {
  type: 'cad',
  sourceType: 'cdm',
  externalId: 'my-cad-model',
  space: 'my-space',
  modelCategory: 'model3d',
};

// await widgetController.addResource(classicResource) or (cdmResource)
```

Everything else — mounting `RevealWidget`, the controller class, cleanup — is identical to the controller pattern above; only the resource identifier changes.

---

## Highlighting and focusing an asset instance

Once a model is loaded, highlight and focus specific instances (assets) that are contextualized (mapped) to it. Instances are identified either by classic numeric asset ID or by a data-modeling `{ externalId, space }` reference:

```tsx
import {
  Default3DStyles,
  type InstanceId,
  type Reveal3DResourceHandle,
  type RevealWidgetController,
} from '@cognite/reveal-widget';

async function highlightAsset(
  widgetController: RevealWidgetController,
  model: Reveal3DResourceHandle,
  instanceId: InstanceId
): Promise<void> {
  await widgetController.styleByInstance(
    [{ instanceIds: [instanceId], style: Default3DStyles.Highlighted }],
    [model]
  );
  await widgetController.focusInstances([instanceId]);
}

// Classic asset ID:
// highlightAsset(controller, model, 1560727417020285)
// DM instance reference:
// highlightAsset(controller, model, { externalId: 'CogniteAsset-1022', space: 'my-space' })
```

There is no built-in hook in `@cognite/reveal-widget` (yet) that discovers "the CAD model linked to this DM instance" — that's a broader Reveal React Components capability not exposed here. If the app needs that discovery step, resolve the model identifier first (e.g. via the app's own DM query against `CogniteVisualizable.object3D`), then load it with `addResource` and highlight the instance as shown above.

---

## Other resource types

`addResource` also accepts point clouds, 360° image collections, and CDF scenes:

```ts
// Point cloud (classic or CDM, same shape as CAD)
{ type: 'pointcloud', sourceType: 'classic', modelId, revisionId, modelCategory: 'model3d' }
{ type: 'pointcloud', sourceType: 'cdm', externalId, space, modelCategory: 'model3d' }

// 360° image collection
{ type: 'image360', sourceType: 'dm' | 'cdm', externalId, space, modelCategory: 'image360' }
{ type: 'image360', sourceType: 'events', siteId, modelCategory: 'image360' }

// CDF scene — resolves to a handle that only supports .remove()
{ type: 'scene', externalId, space }
```

## Camera control

```ts
controller.cameraController.focusModel(handle);   // fit one model
controller.cameraController.focusCameraAll();       // fit all loaded models
controller.cameraController.getCameraState();
controller.cameraController.setCameraState(state);
await controller.focusInstances([instanceId]);      // zoom to a specific instance
```
