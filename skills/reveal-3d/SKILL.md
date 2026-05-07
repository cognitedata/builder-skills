---
name: reveal-3d
description: "Integrates a local Cognite Reveal 3D CAD viewer bundle into Flows apps by copying app-local source code. Use when adding 3D viewer, 3D visualization, Reveal, CAD model, RevealProvider, RevealCanvas, Reveal3DResources, FDM 3D mapping, asset 3D model, model browser, or Cognite 3D content to a Flows application."
metadata:
  argument-hint: "[FDM instance variable name or description, e.g. 'asset' or 'selectedEquipment']"
---

# Reveal 3D Viewer

Add a Cognite Reveal 3D viewer to a Flows app by copying the bundled source into the target app. Renders CAD models from CDF, with support for model browsing, direct model/revision IDs, or FDM-linked assets.

FDM instance to visualize: **$ARGUMENTS**

## Use This When

The user wants to embed an interactive Cognite Reveal viewer for CDF 3D/CAD content in a Flows app.

Do **not** use this skill for static diagrams, graph visualizations, or unrelated custom Three.js scenes.

## Prerequisites

- The app uses React + TypeScript and is wrapped in `@cognite/dune` auth (Flows auth).
- The app has a `QueryClientProvider` from `@tanstack/react-query`.
- The CDF project has 3D models, or the user has supplied direct model/revision IDs.
- For FDM-linked 3D, the instance must be linked through Core DM (`CogniteVisualizable.object3D` -> `CogniteCADNode`).

## Integration Workflow

Follow these steps in order. Adapt paths to the target app's conventions instead of inventing new ones.

1. **Inspect the target app.** Read `package.json`, `vite.config.ts`, `src/main.tsx`, and the app's folder/alias conventions.
2. **Install missing dependencies** with the app's package manager. See [Dependencies](#dependencies). Reuse existing pinned React, Flows, SDK, and React Query versions.
3. **Copy the bundle into the app.** Copy every file from `skills/reveal-3d/code/reveal/` into an app-local feature folder, typically:

   ```text
   src/features/reveal-3d/
   ```

4. **Import from the local folder**, never from the skill directory or the old external package. With a typical `@/*` alias:

   ```tsx
   import { CacheProvider, RevealKeepAlive, RevealProvider } from '@/features/reveal-3d';
   ```

5. **Configure Vite and `main.tsx`.** Read [vite-config.md](references/vite-config.md) and apply the process polyfill, manual `process`/`util`/`assert` aliases, `three` alias, dedupe settings, and `worker.format: 'es'`.
6. **Choose the implementation pattern.** Use Pattern B (model browser or direct model ID) unless you already have a `DMInstanceRef` and confirmed Core DM 3D linkage. For full examples, read [implementation.md](references/implementation.md).
7. **Keep provider placement stable.** `CacheProvider` and `RevealKeepAlive` are always mounted at page/app level. `RevealProvider` is conditional, only when a model is selected or linked.
8. **Run typecheck and build** (`tsc --noEmit`, `pnpm build`, etc.) and fix any copied-import or dependency issues.

## Minimal Example

```tsx
import { useCallback, useMemo } from 'react';
import type { CogniteClient } from '@cognite/sdk';
import {
  CacheProvider,
  Reveal3DResources,
  RevealCanvas,
  RevealKeepAlive,
  RevealProvider,
  type AddCadResourceOptions,
} from '@/features/reveal-3d';

type SelectedModel = { modelId: number; revisionId: number };

function ViewerContent({ modelId, revisionId }: SelectedModel) {
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

export function ViewerPage({
  sdk,
  selected,
}: {
  sdk: CogniteClient;
  selected: SelectedModel | null;
}) {
  const memoizedSdk = useMemo(() => sdk, [sdk.project]);

  return (
    <CacheProvider>
      <RevealKeepAlive>
        <div style={{ width: '100%', height: '70vh', position: 'relative' }}>
          {selected && (
            <RevealProvider sdk={memoizedSdk}>
              <ViewerContent
                modelId={selected.modelId}
                revisionId={selected.revisionId}
              />
            </RevealProvider>
          )}
        </div>
      </RevealKeepAlive>
    </CacheProvider>
  );
}
```

## Dependencies

Suggested versions are starting points. If the target app already pins compatible versions, defer to the app.

| Package | Suggested version | Purpose |
|---------|-------------------|---------|
| `react` / `react-dom` | app version | UI framework |
| `@cognite/dune` | app version | Authenticated SDK via `useDune()` |
| `@cognite/reveal` | `^4.30.0` | Reveal viewer runtime |
| `@cognite/sdk` | `^10.0.0` | CDF API client |
| `@tanstack/react-query` | `^5.90.21` | Reveal/FDM data fetching hooks |
| `three` | `^0.180.0` | Three.js singleton used by Reveal |
| `process`, `util`, `assert` | latest | Browser polyfills for Reveal dependencies |
| `ajv` | `^8` | Avoids older transitive AJV resolution in monorepos |
| `@types/three` | latest dev dep | TypeScript types |

Example install (pnpm; adapt to the app's package manager):

```bash
pnpm add @cognite/reveal @cognite/sdk @tanstack/react-query three process util assert ajv
pnpm add -D @types/three
```

After install, check `@cognite/reveal`'s `three` peer requirement and align `three` if needed.

Do **not** install `vite-plugin-node-polyfills`; use the explicit Vite aliases in [vite-config.md](references/vite-config.md).

## Critical Rules

- `ViewerContent` contains only `RevealCanvas` and `Reveal3DResources`; no providers.
- `resources` passed to `Reveal3DResources` must be memoized with `useMemo`.
- `onModelsLoaded`, `onSelect`, and similar callbacks must be memoized with `useCallback`.
- The SDK passed to `RevealProvider` must be memoized with `useMemo` keyed on `client.project`.
- `RevealCanvas` fills its parent; the parent must have an explicit height.
- Lazy-load canvas-heavy viewer content with `React.lazy` + `Suspense` when adding a route/page.

## Advanced Reference

For the copied bundle API and exports, read `code/README.md`.

For model browser and FDM-linked implementations, read `references/implementation.md`.

For Vite, worker, polyfill, and troubleshooting details, read `references/vite-config.md`.

## Verification Checklist

- [ ] All files from `skills/reveal-3d/code/reveal/` were copied into an app-local feature folder.
- [ ] Imports point to the app-local folder (e.g. `@/features/reveal-3d`).
- [ ] The app does not import Reveal helpers from the old external package.
- [ ] Required dependencies are present in `package.json`.
- [ ] `main.tsx` starts with the `process` polyfill before other imports.
- [ ] `vite.config.ts` uses manual aliases, dedupe, `three` singleton alias, and `worker.format: 'es'`.
- [ ] `CacheProvider` and `RevealKeepAlive` are always mounted; `RevealProvider` is conditional when model selection is conditional.
- [ ] The viewer container has an explicit height.
- [ ] Typecheck and build pass.
