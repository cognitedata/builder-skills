# Vite Configuration for @cognite/reveal in a Flows monorepo app

## src/main.tsx — process polyfill must be the very first two lines

Prepend these two lines before any other import:

```tsx
import process from 'process';
(window as unknown as Record<string, unknown>).process = process;

// all other existing imports below ↓
```

The rest of `main.tsx` stays as-is. Order matters — the polyfill must run before any module that reads `process`.

---

## vite.config.ts — standalone config (not mergeConfig)

Flows apps use a standalone `vite.config.ts` (not a shared base config from the monorepo root).
Replace the file entirely with the following:

```typescript
import path from 'node:path';

import { fusionOpenPlugin } from '@cognite/dune/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  base: './',
  plugins: [react(), mkcert(), fusionOpenPlugin(), tailwindcss()],
  define: {
    // Some CJS deps use `global` instead of `globalThis`
    'process.env': {},
    'process.platform': JSON.stringify(''),
    'process.version': JSON.stringify(''),
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),

      // --- Node built-in polyfills ---
      // Use explicit package aliases, not vite-plugin-node-polyfills.
      // The plugin introduces transitive dep conflicts ("Could not resolve 'inherits'").
      // The `process`, `util`, and `assert` packages must be in app dependencies.
      util: 'util/',
      assert: 'assert/',
      process: 'process/browser',

      // --- Single Three.js instance ---
      // @cognite/reveal bundles its own Three.js copy. Without this alias, the app
      // and Reveal load two separate copies → "Multiple instances of Three.js" warning
      // and broken rendering. Requires `three` as a direct app dependency.
      three: path.resolve(__dirname, 'node_modules/three/build/three.module.js'),
    },

    // pnpm uses a virtual store with symlinks. Packages that symlink to different
    // paths can resolve to separate module instances even for the same package.
    // `dedupe` forces a single physical copy for all pre-bundles.
    // Missing `react`/`react-dom` here causes ReactCurrentDispatcher errors.
    // Missing `three` causes "Multiple instances" warnings.
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', '@tanstack/react-query', 'three'],

    conditions: ['import', 'module', 'browser', 'default'],
  },
  optimizeDeps: {
    // Do not exclude the copied Reveal feature bundle. Let Vite pre-bundle
    // React, React Query, Three.js, and Reveal dependencies as one graph.
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
    include: [
      // Vite can't auto-discover bare polyfill imports (no source file imports them
      // directly). List them explicitly so esbuild pre-bundles them.
      'process',
      'util',
      'assert',
      // Heavy/complex deps — explicit listing speeds up cold starts
      'three',
      '@cognite/reveal',
      // React ecosystem — pre-bundling creates the CJS→ESM singleton all deps share.
      // If any of these are missing, a dep that imports React raw can get a second copy.
      'react',
      'react-dom',
      '@tanstack/react-query',
    ],
  },
  server: {
    port: 3002,
  },
  worker: {
    // @cognite/reveal spawns ES module web workers. Without 'es' format they fail
    // silently — black screen with no console error.
    format: 'es',
  },
});
```

---

## Why each setting is needed


| Setting                                                              | Reason                                                                                                                                                                  |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `util/`, `assert/`, `process/browser` aliases                        | Browser-compatible replacements for Node built-ins. Packages must be in `dependencies`. Do NOT use `vite-plugin-node-polyfills` — causes "Could not resolve 'inherits'" |
| `process` polyfill in main.tsx first                                 | `@cognite/reveal` deps call `process.env` at **runtime** (not build-time). The `define` replacements handle build-time; the window assignment handles runtime           |
| `define.global = 'globalThis'`                                       | Some CJS deps use `global` instead of `globalThis`                                                                                                                      |
| `resolve.alias.three`                                                | Single Three.js instance — without this, Reveal's bundled copy and the app's copy conflict                                                                              |
| `resolve.dedupe` with react + react-dom + react/jsx-runtime          | pnpm symlinks can create separate module instances. `dedupe` forces one copy. Critical — missing these causes `ReactCurrentDispatcher` errors                           |
| `resolve.dedupe` with three                                          | Ensures the copied feature bundle and Reveal share the same Three.js                                                                                                    |
| `optimizeDeps.include` for process/util/assert                       | No source file imports them, so Vite cannot auto-discover them for pre-bundling                                                                                         |
| `optimizeDeps.include` for react + react-dom + @tanstack/react-query | Converts CJS → ESM and creates a single shared instance. All pre-bundled deps that import React get the same copy                                                       |
| `worker.format: 'es'`                                                | Reveal spawns ES module workers; Vite defaults to IIFE/UMD which breaks them                                                                                            |
| `conditions: ['import', 'module', 'browser', 'default']`             | Ensures browser ESM variants are preferred over CJS/Node variants                                                                                                       |


## Common mistakes that break the setup


| Mistake                                                                      | Symptom                                                                     | Fix                                                                                                  |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Installing `three` without checking `@cognite/reveal`'s peer requirement     | `unmet peer three@0.180.0: found 0.177.x` warning; potential rendering bugs | After install, compare versions; `pnpm add three@^<peer-version>` if mismatched                      |
| Not adding `ajv` as a direct dependency                                      | `unmet peer ajv@>=8: found 6.x`                                             | `pnpm add ajv` (installs `^8`) in the app                                                            |
| Copied Reveal feature folder in `optimizeDeps.exclude`                       | `ReactCurrentDispatcher` undefined or `No QueryClient set`                  | Remove from `exclude` and let Vite pre-bundle shared deps                                            |
| `vite-plugin-node-polyfills` instead of manual aliases                       | `Could not resolve "inherits"` on transitive deps                           | Remove the plugin; add `util`, `assert`, `process` to dependencies and use aliases                   |
| `RevealKeepAlive` inside conditional component                               | `ObjectUnsubscribedError: object unsubscribed` at model load                | Move `CacheProvider` + `RevealKeepAlive` to always-mounted app/page level                            |
| Inline arrow as `onSelect`/`onLoad` prop                                     | `Maximum update depth exceeded`                                             | `useCallback` at call site; call `onSelect` from `useEffect` inside model browser, never from render |
| Model browser calls `onSelect` during render (`if (revision) onSelect(...)`) | `Maximum update depth exceeded`                                             | Move to `useEffect([revision, onSelect])`                                                            |
| Missing `worker.format: 'es'`                                                | Black screen, no error                                                      | Add `worker: { format: 'es' }`                                                                       |
| `react`/`react-dom` missing from `resolve.dedupe`                            | `ReactCurrentDispatcher` in pnpm monorepo                                   | Add both to `dedupe`                                                                                 |
| Container has no height                                                      | Canvas collapses to 0px, nothing renders                                    | Add `height: '70vh'` (or flex/grid height) to the parent element                                     |
