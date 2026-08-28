# CSP, `manifest.json`, and Content-Specific Fixes

Flows apps run under a locked-down Content-Security-Policy generated from `manifest.json`'s
`permissions.network` list (see `@cognite/app-sdk`'s `manifestCspPlugin`/`manifest-config-schema`).
That policy is narrower than what an unrestricted web app would run under, and some of Reveal's
asset-loading patterns — perfectly normal outside Flows — need either a manifest allowance or an
app-side fix to work within it. By default `manifest.json` grants nothing beyond `'self'` plus the
CDF API's own domain on `connect-src`. Work through this checklist for any scene/model that has
ground planes, skyboxes, 360° image collections, or point clouds.

## `useCoreDm` must match the project

Set `viewerOptions.useCoreDm` to whether the **target project actually uses the Core Data Model**,
not unconditionally to `true`. Passing `true` on a classic/non-CDM project causes Reveal to
resolve models and 360 collections against CDM views (`Cognite3DModel`, etc.) that don't exist
there, producing confusing failures that don't look like a config problem:

- `401 Unauthorized` on `POST /models/instances/list` and `POST /models/views/byids`, right after
  the widget mounts.
- A scene's 360° image collection silently not attaching (no console/network error at all) — see
  [Troubleshooting](#troubleshooting-silent-360-collection-failures) below.

If you're not sure whether a project is CDM-based, ask, or check whether the scenes/models you're
loading exist as `Cognite3DModel`/`Cognite3DRevision` core-DM instances vs. classic
`models3D`/`revisions3D` resources.

## `manifest.json` allowances needed

Add these under `permissions.network` as needed by what the scene/model actually contains:

```json
{
  "manifestVersion": 1,
  "permissions": {
    "network": [
      { "sources": ["https://*.cognitedata.com"], "directives": ["img-src"] },
      { "sources": ["https://storage.googleapis.com"] }
    ]
  }
}
```

| Content | What it needs | Directive | Why |
|---|---|---|---|
| Scene ground-plane / skybox textures | `https://*.cognitedata.com` | `img-src` | Loaded as `<img>` elements from a `gcs_proxy` passthrough on the CDF API's own domain. |
| 360° image collection panorama faces | The project's blob storage host (e.g. `https://storage.googleapis.com` on GCP-backed clusters) | `connect-src` | Fetched via `fetch()` from a **signed download URL that points directly at blob storage**, not proxied through `*.cognitedata.com` — `img-src` does not cover this, since it's a `fetch()`, not an `<img>` load. The exact host can differ by cluster/cloud provider; if the collection still fails after adding this, check DevTools → Network for the actual blocked origin. |

A rule with no `directives` key defaults to `connect-src` (see `manifest-config-schema.js`'s
`CSP_FETCH_DIRECTIVES`); only `https://`/`wss://` origins are accepted (plus `localhost`/
`127.0.0.1` in dev) — there is no way to grant a `data:`/`blob:` scheme through this mechanism.
That last point matters for the next section.

## Point clouds: `manifest.json` can't grant this directly — fix it on the app side

`@cognite/reveal`'s point-cloud decoder runs in a Worker built from a `Blob`, and loads its WASM
module via an inline `data:application/wasm;base64,...` URI — an entirely ordinary, supported way
to ship a WASM asset in a Worker. It only becomes a problem here because Flows constrains what CSP
an app can request: `manifest.json`'s schema only accepts `https://`/`wss://` origins under any
directive, so there's no manifest rule that grants `data:` under `connect-src`. That's a
constraint of the Flows app-hosting platform, not a defect in how Reveal packages its decoder —
plenty of unrestricted web apps load this exact package with no issue.

Since `manifest.json` can't help here, fix it in the app instead: intercept `Blob` construction
on the page and rewrite the inline `data:` URI to a same-origin static asset before Reveal's
worker source is compiled. A same-origin fetch is already covered by the default
`connect-src 'self'` — no CSP change needed. This is the recommended fix; apply it whenever an
app needs point cloud support.

**Maintenance note:** the patch matches on the `data:application/wasm;base64,...` pattern rather
than any documented API, since Reveal doesn't currently expose a way to configure where this
asset loads from. It degrades safely — if a future `@cognite/reveal` upgrade changes the internal
worker-construction shape, the pattern simply stops matching and point clouds fall back to being
CSP-blocked exactly as before, without breaking anything else. Re-verify after `@cognite/reveal`
version bumps. If you want a `data:`-free path long-term, raising with the Reveal team that their
wasm-bindgen loader already accepts an optional URL argument (it's just never called with one) is
worth doing — but that's an enhancement request, not a bug report, and this app-side fix works
today regardless of whether or when that lands.

1. **Extract the wasm binary once**, from the exact pinned version being used. This is a one-time
   recipe, not a build step — it's not meant to run on every install or every build. Run it,
   commit the resulting `.wasm` file, and re-run it only when `@cognite/reveal` is upgraded:
   ```js
   const fs = require('fs');
   const src = fs.readFileSync('node_modules/@cognite/reveal/dist/index.js', 'utf8');
   const m = src.match(/data:application\/wasm;base64,([A-Za-z0-9+/=]+)/);
   fs.writeFileSync('public/pointclouds_wasm_bg.wasm', Buffer.from(m[1], 'base64'));
   ```
   Verify the output's magic bytes are `00 61 73 6d` (`\0asm`). Vite serves anything in `public/`
   at the app's root path in both dev and production. Saving this as a real script (e.g.
   `scripts/extract-pointcloud-wasm.mjs`, invoked via a `package.json` script rather than
   `postinstall` — writing into a tracked file as a side effect of every `pnpm install` would
   produce surprise diffs) makes the "re-run after upgrading `@cognite/reveal`" step discoverable
   for whoever maintains the app later, instead of relying on them remembering to come back to
   this doc.

2. **Intercept `Blob` construction** in its own module (e.g. `pointCloudWasmPatch.ts`, imported by
   `main.tsx` in the next step), rewriting the URI to resolve against the document's own base (not
   `location.origin` — the app may be deployed under a subpath, and an origin-rooted path would
   404 there):
   ```ts
   const WASM_DATA_URI_PATTERN = /data:application\/wasm;base64,[A-Za-z0-9+/=]+/;

   export function rewritePointCloudWasmDataUri(source: string, baseUri: string): string {
     return source.replace(
       WASM_DATA_URI_PATTERN,
       new URL('pointclouds_wasm_bg.wasm', baseUri).toString()
     );
   }

   export function installPointCloudWasmBlobPatch(
     target: { Blob: typeof Blob; document: Pick<Document, 'baseURI'> } = globalThis
   ): void {
     const OriginalBlob = target.Blob;
     class PatchedBlob extends OriginalBlob {
       constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
         const patched = parts?.map((part) =>
           typeof part === 'string' && WASM_DATA_URI_PATTERN.test(part)
             ? rewritePointCloudWasmDataUri(part, target.document.baseURI)
             : part
         );
         super(patched ?? parts, options);
       }
     }
     target.Blob = PatchedBlob;
   }
   ```

3. **Install it before `@cognite/reveal-widget`'s module graph is ever evaluated — not just
   before the app mounts.** This is the part that's easy to get wrong: a static
   `import App from './App'` in `main.tsx` hoists and fully evaluates App's entire module graph
   (including Reveal) *before any statement in `main.tsx` runs*, regardless of where the
   `import` line is textually written relative to your patch-install call. Reveal captures a
   reference to the native `Blob` the moment its module evaluates, so installing the patch
   "before mounting" is too late if `App` was imported statically. Defer with a dynamic import —
   this is the full `main.tsx`, not just the relevant lines, since getting the import shape exactly
   right is the entire point:
   ```tsx
   import ReactDOM from 'react-dom/client';

   import { installPointCloudWasmBlobPatch } from './pointCloudWasmPatch';

   // Must run before anything that imports @cognite/reveal-widget is even evaluated — see above.
   installPointCloudWasmBlobPatch();

   void import('./App').then(({ default: App }) => {
     ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
   });
   ```
   Note there is no top-level `import App from './App'` anywhere in this file — that's the change.
   A working fix will also show up in the build output: `App` (and Reveal) should appear as a
   separate lazily-loaded chunk from the entry chunk, not bundled into one file.

## Dev mode: don't use `React.StrictMode`

In dev, `React.StrictMode` double-invokes effects (mount → cleanup → mount again) to surface
cleanup bugs. `RevealWidget` creates its own internal WebGL/Reveal viewer context on mount; its
in-flight async loads (e.g. Potree's debounced point-cloud octree fetches) don't all cancel
cleanly on that first teardown, so a callback from the discarded instance can fire against an
already-disposed buffer. This produces confusing errors (e.g. `Invalid buffer: pointSize=17,
byteLength=0`) for content that loads fine outside of `StrictMode`, or in production. Leave
`StrictMode` off for apps embedding `RevealWidget`.

## Troubleshooting: silent 360 collection failures

If a scene's 360° image collection produces **no console error, no network error, and simply
never shows any camera-icon markers**, the scene's `SceneConfiguration.images360Collections` edge
is very likely missing required data — Reveal's own scene-config loader filters incomplete edges
out silently, with no logging, before its own (logged) load step ever runs. Check that the edge
has both:

- `Image360CollectionProperties/v1` → non-empty `image360CollectionExternalId` and
  `image360CollectionSpace`.
- `Transformation3d` (merged onto the same edge) → all 9 numeric fields: `translationX/Y/Z`,
  `eulerRotationX/Y/Z`, `scaleX/Y/Z`.

This is a scene-authoring data-completeness issue, not something fixable from app code.
