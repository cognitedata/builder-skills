---
name: reveal-3d
description: "Integrates the @cognite/reveal-widget npm package into Flows apps for an interactive Cognite Reveal 3D CAD/point cloud/360-image viewer. Use when adding 3D viewer, 3D visualization, Reveal, CAD model, RevealWidget, RevealWidgetController, FDM 3D mapping, asset 3D model, model browser, or Cognite 3D content to a Flows application."
metadata:
  argument-hint: "[FDM instance variable name or description, e.g. 'asset' or 'selectedEquipment']"
---

# Reveal 3D Viewer

Add a Cognite Reveal 3D viewer to a Flows app using the published `@cognite/reveal-widget` npm package. Renders CAD models, point clouds, 360° image collections, and CDF scenes from CDF, with model browsing or direct model/revision IDs.

FDM instance to visualize: **$ARGUMENTS**

## Use This When

The user wants to embed an interactive Cognite Reveal viewer for CDF 3D/CAD content in a Flows app.

Do **not** use this skill for static diagrams, graph visualizations, or unrelated custom Three.js scenes.

Do **not** use the deprecated app-local "copy the bundle" approach — that pattern (a `src/features/reveal-3d/` folder of copied provider/hook source) is replaced by installing `@cognite/reveal-widget` directly. If an app still has a copied bundle from a prior integration, migrate it to this package rather than extending it.

## Prerequisites

- The app uses React + TypeScript and is wrapped in `@cognite/dune` auth (Flows auth), which supplies the `CogniteClient` (`sdk`).
- The CDF project has 3D models, or the user has supplied direct model/revision IDs or a CDM (`externalId`/`space`) model reference.
- For FDM-linked 3D, the instance/model must be identifiable via a CDM `externalId`/`space` pair or a classic `modelId`/`revisionId`; instance highlighting works once a model is loaded and the instance is contextualized (mapped) to it.

## Integration Workflow

Follow these steps in order. Adapt paths to the target app's conventions instead of inventing new ones.

1. **Inspect the target app.** Read `package.json`, `vite.config.ts`, `src/main.tsx`, and the app's folder/alias conventions.
2. **Install the package and peers** with the app's package manager. See [Dependencies](#dependencies). Reuse existing pinned React and SDK versions where they satisfy the peer ranges.
3. **Configure Vite.** Read [vite-config.md](references/vite-config.md) and add the `three`/`@cognite/reveal` dedupe entry. No process/util/assert polyfills are needed — the package ships browser-ready.
4. **Add a controller class** that wraps `RevealWidgetController` and drives it imperatively (load resources, style/highlight instances, control the camera) from your own event handlers — not from `useEffect` reacting to prop changes. See [implementation.md](references/implementation.md).
5. **Mount `RevealWidget`** with `viewerOptions={{ sdk, useCoreDm: true }}` and `setControllerRef` inside a container with an explicit height. `RevealWidget` manages its own internal Reveal context — do not wrap it in another provider from this package.
6. **Choose the resource pattern.** Use the model-browser pattern (`sdk.models3D.list()` + classic `modelId`/`revisionId`) as the default unless the user has already supplied a CDM `externalId`/`space` model reference. Full examples in [implementation.md](references/implementation.md).
7. **Clean up.** Call `.remove()` on any `Reveal3DResourceHandle` returned by `addResource` when it's no longer needed (selection change, unmount).
8. **Run typecheck and build** (`tsc --noEmit`, `pnpm build`, etc.) and fix any dependency/peer-version issues.

## Minimal Example

```tsx
import { useRef } from 'react';
import type { CogniteClient } from '@cognite/sdk';
import {
  RevealWidget,
  type Reveal3DResourceHandle,
  type RevealWidgetController,
  type ThreeDResourceIdentifier,
} from '@cognite/reveal-widget';

class ThreeDViewerController {
  private model: Reveal3DResourceHandle | undefined;

  constructor(private readonly widgetController: RevealWidgetController) {}

  async loadModel(resource: ThreeDResourceIdentifier): Promise<void> {
    this.model = await this.widgetController.addResource(resource);
    this.widgetController.cameraController.focusModel(this.model);
  }

  dispose(): void {
    this.model?.remove();
  }
}

export function ViewerPage({
  sdk,
  resource,
}: {
  sdk: CogniteClient;
  resource: ThreeDResourceIdentifier;
}) {
  const viewerRef = useRef<ThreeDViewerController>();

  function handleWidgetController(widgetController: RevealWidgetController | undefined) {
    viewerRef.current?.dispose();

    if (widgetController === undefined) {
      viewerRef.current = undefined;
      return;
    }

    const viewer = new ThreeDViewerController(widgetController);
    void viewer.loadModel(resource);
    viewerRef.current = viewer;
  }

  return (
    <div style={{ width: '100%', height: '70vh', position: 'relative' }}>
      <RevealWidget
        viewerOptions={{ sdk, useCoreDm: true }}
        setControllerRef={handleWidgetController}
      />
    </div>
  );
}
```

## Dependencies

Suggested versions are starting points. If the target app already pins compatible versions, defer to the app.

| Package | Suggested version | Purpose |
|---------|-------------------|---------|
| `@cognite/reveal-widget` | `^0.1.0` | The `RevealWidget` component and its types |
| `react` / `react-dom` | `^18.3.1` (peer) | UI framework — peer dependency, must match the app |
| `@cognite/reveal` | `4.35.3` (peer) | Reveal viewer runtime — peer dependency, exact match required |
| `@cognite/sdk` | `^10.13.0` (peer) | CDF API client — peer dependency |

Everything else (`three`, `@tanstack/react-query`, `@base-ui/react`, `@floating-ui/react`, `@tabler/icons-react`, `dayjs`, `lodash-es`, `ml-matrix`, `random-seed`, `@cognite/aura`) is a transitive dependency of the package and installs automatically — do not add it manually unless the app needs to pin a version.

Example install (pnpm; adapt to the app's package manager):

```bash
pnpm add @cognite/reveal-widget @cognite/reveal @cognite/sdk react react-dom
```

After install, check that the app's `@cognite/reveal` and `react`/`react-dom` versions satisfy the package's peer ranges (`@cognite/reveal` requires an exact `4.35.3` match).

Do **not** copy any source bundle into the app and do **not** install `process`, `util`, `assert`, `ajv`, or `vite-plugin-node-polyfills` for this package — none of that is needed.

## Critical Rules

- Drive the widget **imperatively** through `RevealWidgetController`, obtained via `setControllerRef`. Don't try to reconstruct Reveal's old declarative provider tree (`CacheProvider`/`RevealProvider`/`RevealCanvas`/`Reveal3DResources`) — that API belongs to the old copied-bundle approach and is not what this package exposes.
- `RevealWidget` wraps its own Reveal context internally — never nest it inside another provider from this package.
- Dispose the previous controller class instance (`.dispose()` calling `.remove()` on tracked handles) inside `setControllerRef` before constructing a new one, and again when `widgetController` becomes `undefined` (unmount).
- Resources passed to `addResource` must match the exact identifier shape for their `type`/`sourceType` combination (see [implementation.md](references/implementation.md)) — mixing classic and CDM fields is a type error.
- Instance highlighting only affects instances that are already contextualized (mapped) to a loaded model; load the model first, then call `styleByInstance`/`focusInstances`.
- `RevealWidget`'s container must have an explicit height — it fills its parent.
- Lazy-load canvas-heavy viewer content with `React.lazy` + `Suspense` when adding a route/page.

## Known Limitations vs. the Old Copied-Bundle Approach

`@cognite/reveal-widget` is an early, intentionally narrow slice of the broader Reveal React Components toolkit — its own README says more capabilities will be exposed "incrementally over time." Several things the old app-local bundle could do have no equivalent yet. Set expectations with the user up front if the task needs one of these:

- **No FDM-instance-to-model discovery.** The old bundle's `useModelsForInstanceQuery`/`use3dModels`/`useFdmAssetMappings`/`useFindRelated3dInstances`/`use3dRelatedEdgeConnections`/`use3dRelatedDirectConnections`/`useInstancesWithBoundingBoxes` hooks answered "what 3D model(s) is this FDM instance linked to?". There's no equivalent — you must resolve the model identifier yourself (e.g. via the app's own FDM query against `CogniteVisualizable.object3D`) before calling `addResource`. See [implementation.md](references/implementation.md).
- **No viewer/cache lifecycle persistence.** `RevealKeepAlive`/`useRevealKeepAlive` and `CacheProvider`/`useCacheContext` don't exist in this package. The old bundle let the WebGL viewer and asset-mapping cache survive component remounts/route changes to avoid expensive re-creation; `RevealWidget` has no exposed equivalent, so expect a full viewer re-init on remount.
- **No render-quality/appearance options.** The old `ViewerOptions` exposed `antiAliasingHint`, `ssaoQualityHint`, `loadingIndicatorStyle`, background color, etc. `RevealWidgetProps.viewerOptions` currently only accepts `sdk`, `onLoading`, and `useCoreDm` — no rendering-quality or styling knobs.
- **No reactive styling/camera hooks.** `InstanceStylingProvider`/`useInstanceStyling` (styling driven by React state/re-renders) and `useFocusCamera` (auto-focus-on-selection) are gone, replaced by the imperative `styleByInstance` and `cameraController.focusModel`/`focusInstances` methods. This is not a drop-in API match — code built around the old hooks needs to be rewritten around explicit controller calls, not just re-imported.
- **No automatic stale-model cleanup.** `useRemoveNonReferencedModels` had no manual equivalent before; now you must track every `Reveal3DResourceHandle` yourself and call `.remove()` when it's no longer needed.

If a task genuinely needs one of these (e.g. "auto-load the model linked to this asset" or "keep the viewer alive across page navigation"), say so explicitly rather than quietly approximating it — either build the missing piece in the app layer, or flag to the user that it may require a newer version of `@cognite/reveal-widget`.

## Advanced Reference

For the full resource-identifier catalog (CAD, point cloud, 360 images, scenes), instance highlighting, and camera control, read [implementation.md](references/implementation.md).

For Vite/dedupe configuration, read [vite-config.md](references/vite-config.md).

## Verification Checklist

- [ ] `@cognite/reveal-widget` is installed alongside its peers (`react`, `react-dom`, `@cognite/reveal`, `@cognite/sdk`) at compatible versions.
- [ ] No source bundle was copied into the app; all imports come from `@cognite/reveal-widget`.
- [ ] `vite.config.ts` includes `resolve.dedupe: ['three', '@cognite/reveal']` (plus the app's existing dedupe entries).
- [ ] No `process`/`util`/`assert` polyfills or `vite-plugin-node-polyfills` were added for this package.
- [ ] `RevealWidget` is mounted once, is not nested in another Reveal provider, and its container has an explicit height.
- [ ] A controller class wraps `RevealWidgetController`, obtained via `setControllerRef`, and drives `addResource`/`styleByInstance`/`focusInstances`/`cameraController` imperatively.
- [ ] The controller class is disposed (and tracked resource handles `.remove()`d) both when a new controller is set and on unmount (`widgetController === undefined`).
- [ ] Resource identifiers use the correct `type`/`sourceType` shape for the model being loaded.
- [ ] Typecheck and build pass.
