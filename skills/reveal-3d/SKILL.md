---
name: reveal-3d
description: "Integrates the @cognite/reveal-widget npm package into Flows apps for an interactive Cognite Reveal 3D Scene/CAD/point cloud/360-image viewer. Use when adding 3D viewer, 3D visualization, Reveal, CAD model, Point cloud model, 360 image collection, Scenes, RevealWidget, RevealWidgetController, DM 3D mapping, asset 3D model, model browser, or Cognite 3D content to a Flows application."
metadata:
  argument-hint: "[DM instance variable name or description, e.g. 'asset' or 'selectedEquipment']"
---

# Reveal 3D Viewer

Add a Cognite Reveal 3D viewer to a Flows app using the published `@cognite/reveal-widget` npm package. Renders CAD models, point clouds, 360° image collections, and CDF scenes from CDF, with model browsing or direct model/revision IDs.

DM instance to visualize: **$ARGUMENTS**

## Use This When

The user wants to embed an interactive Cognite Reveal viewer for CDF 3D content in a Flows app.

Do **not** use this skill for static diagrams, graph visualizations, or unrelated custom Three.js scenes.

Do **not** use the deprecated app-local "copy the bundle" approach — that pattern (a `src/features/reveal-3d/` folder of copied provider/hook source) is replaced by installing `@cognite/reveal-widget` directly. If an app still has a copied bundle from a prior integration, migrate it to this package rather than extending it.

## Prerequisites

- The app uses React + TypeScript and is wrapped in `@cognite/dune` auth (Flows auth), which supplies the `CogniteClient` (`sdk`).
- The CDF project has 3D models, or the user has supplied direct model/revision IDs or a CDM (`externalId`/`space`) model reference.
- For DM-linked 3D, the instance/model must be identifiable via a CDM `externalId`/`space` pair or a classic `modelId`/`revisionId`; instance highlighting works once a model is loaded and the instance is contextualized (mapped) to it.
- Know whether the target project actually uses the **Core Data Model** — `viewerOptions.useCoreDm` must match reality, not default to `true`. Getting this wrong causes confusing 401s and silent 360-collection failures rather than a clear error. See [csp-and-fixes.md](references/csp-and-fixes.md).

## Integration Workflow

Follow these steps in order. Adapt paths to the target app's conventions instead of inventing new ones.

1. **Inspect the target app.** Read `package.json`, `vite.config.ts`, `src/main.tsx`, and the app's folder/alias conventions.
2. **Install the package and peers** with the app's package manager. See [Dependencies](#dependencies). Reuse existing pinned React and SDK versions where they satisfy the peer ranges.
3. **Configure Vite.** Read [vite-config.md](references/vite-config.md) and add the `three`/`@cognite/reveal` dedupe entry. No process/util/assert polyfills are needed — the package ships browser-ready.
4. **Configure `manifest.json`'s CSP allowances** for whatever the scene/model actually contains (scene ground-plane/skybox textures, 360° image collections). Read [csp-and-fixes.md](references/csp-and-fixes.md) — it also covers the app-side fix point clouds need (`manifest.json` can't grant it directly) and a StrictMode gotcha, so read it even if the app has no scenes/360 content yet.
5. **Add a controller class** that wraps `RevealWidgetController` and drives it imperatively (load resources, style/highlight instances, control the camera) from your own event handlers — not from `useEffect` reacting to prop changes. See [implementation.md](references/implementation.md).
6. **Mount `RevealWidget`** with `viewerOptions={{ sdk, useCoreDm }}` (set `useCoreDm` per the project, not hardcoded — see [csp-and-fixes.md](references/csp-and-fixes.md)) and `setControllerRef` inside a container with an explicit height. `RevealWidget` manages its own internal Reveal context — do not wrap it in another provider from this package.
7. **Choose the resource pattern.** Use the model-browser pattern (`sdk.models3D.list()` + classic `modelId`/`revisionId`) as the default unless the user has already supplied a CDM `externalId`/`space` model reference. Full examples in [implementation.md](references/implementation.md).
8. **Clean up.** Call `.remove()` on any `Reveal3DResourceHandle` returned by `addResource` when it's no longer needed (selection change, unmount).
9. **Run typecheck and build** (`tsc --noEmit`, `pnpm build`, etc.) and fix any dependency/peer-version issues.

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
        viewerOptions={{ sdk, useCoreDm }} // set per the project — see csp-and-fixes.md
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
- `useCoreDm` must reflect the actual project, not default to `true` — see [csp-and-fixes.md](references/csp-and-fixes.md).
- Do not wrap the app in `React.StrictMode` — its dev-only double-mount tears down and recreates `RevealWidget`'s internal viewer while async loads are in flight, producing errors (e.g. `Invalid buffer: pointSize=17, byteLength=0`) for content that loads fine in production. See [csp-and-fixes.md](references/csp-and-fixes.md).
- `manifest.json` can't grant `data:` under any CSP directive, so point cloud content (which Reveal loads via an inline `data:` WASM URI in a Worker — a normal pattern outside Flows' locked-down CSP) needs an app-side fix instead: redirect that URI to a same-origin static asset before the worker compiles. This is the recommended, expected way to enable point cloud support in a Flows app, not a fallback — see [csp-and-fixes.md](references/csp-and-fixes.md) for the full implementation.

## Advanced Reference

For the full resource-identifier catalog (CAD, point cloud, 360 images, scenes), instance highlighting, and camera control, read [implementation.md](references/implementation.md).

For Vite/dedupe configuration, read [vite-config.md](references/vite-config.md).

For CSP/`manifest.json` allowances, the `useCoreDm`/StrictMode gotchas, the point-cloud app-side fix, and 360-collection troubleshooting, read [csp-and-fixes.md](references/csp-and-fixes.md).

## Verification Checklist

- [ ] `@cognite/reveal-widget` is installed alongside its peers (`react`, `react-dom`, `@cognite/reveal`, `@cognite/sdk`) at compatible versions.
- [ ] No source bundle was copied into the app; all imports come from `@cognite/reveal-widget`.
- [ ] `vite.config.ts` includes `resolve.dedupe: ['three', '@cognite/reveal']` (plus the app's existing dedupe entries).
- [ ] No `process`/`util`/`assert` polyfills or `vite-plugin-node-polyfills` were added for this package.
- [ ] `RevealWidget` is mounted once, is not nested in another Reveal provider, and its container has an explicit height.
- [ ] `viewerOptions.useCoreDm` matches whether the target project is actually Core-Data-Model-based.
- [ ] The app does not wrap itself in `React.StrictMode`.
- [ ] `manifest.json` grants `img-src` for `https://*.cognitedata.com` and `connect-src` for the project's blob-storage host if the app loads scenes with ground planes/skybox or 360° image collections. If the app needs point cloud support, the same-origin `Blob`-patch fix has been applied and verified.
- [ ] A controller class wraps `RevealWidgetController`, obtained via `setControllerRef`, and drives `addResource`/`styleByInstance`/`focusInstances`/`cameraController` imperatively.
- [ ] The controller class is disposed (and tracked resource handles `.remove()`d) both when a new controller is set and on unmount (`widgetController === undefined`).
- [ ] Resource identifiers use the correct `type`/`sourceType` shape for the model being loaded.
- [ ] Typecheck and build pass.
