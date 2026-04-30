# Reveal 3D Code Bundle

This bundle is copied from the Reveal source tree.

Copy the contents of `code/reveal/` into an app-local feature folder, typically:

```text
src/features/reveal-3d/
```

Then import from the app-local folder:

```tsx
import {
  CacheProvider,
  Reveal3DResources,
  RevealCanvas,
  RevealKeepAlive,
  RevealProvider,
} from '@/features/reveal-3d';
```

Do not import from `skills/reveal-3d/code/reveal` in the target app.

## Dependencies

The copied code expects these app dependencies:

- `@cognite/reveal`
- `@cognite/sdk`
- `@tanstack/react-query`
- `react`
- `react-dom`
- `three`

The Vite setup for Reveal also needs `process`, `util`, `assert`, and `ajv`.
Install `@types/three` as a dev dependency for TypeScript apps.

## Public Exports

The public API is exported from `index.ts`, including:

- Components: `RevealProvider`, `RevealCanvas`, `Reveal3DResources`, `RevealKeepAlive`
- Providers/hooks: `CacheProvider`, `useReveal`, `useModelsForInstanceQuery`, `useFdmAssetMappings`
- Types: `AddCadResourceOptions`, `TaggedAddResourceOptions`, `ViewerOptions`

