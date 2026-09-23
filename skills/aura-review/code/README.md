# Aura Review — in-app report page

A self-contained, Aura-styled banner and report page that render `aura-review/review.json`
inside the app itself, so the report ships with the deployed app instead of only living
in the repo/CI log. The skill only wires this in when invoked with `--wire-in-app` (see
SKILL.md's Step 6) — off by default, since a one-off audit of someone's existing app has
no reason to modify their source tree. `aura-eval-daily.yml` passes the flag because it
wants every nightly-generated app to ship with its own review page.

## Files

- `types.ts` — the `AuraReviewReport` shape, matching `review.json` field for field.
- `report.ts` — imports `review.json` directly (`resolveJsonModule: true` required in
  `tsconfig.json`). This is the one file whose relative import path depends on where you
  copy the bundle — see Step below.
- `useAuraReviewViewModel.ts` — derives display labels (percent formatting) from the report.
- `AuraReviewPage.tsx` — the report content: headline stats, a non-compliance findings
  table, and the excluded (third-party) usages list.
- `AuraReviewLauncher.tsx` — an Aura `Banner` (info variant) pinned at the top of the
  app, with a "View report" button that opens `AuraReviewPage` as a full-screen overlay.
  This is the only piece that needs to be rendered by the app — it doesn't touch the
  app's own nav/routing at all.

## Copying into an app

1. Copy every file in this folder into an app-local feature folder, e.g.:

   ```text
   src/features/aura-review/
   ```

2. Fix up `report.ts`'s import path so it resolves to that app's own
   `aura-review/review.json` relative to wherever you placed the folder.
3. Ensure the app's `tsconfig.json` has `"resolveJsonModule": true` — required to import
   `review.json` as a typed module. If it also sets `compilerOptions.types` explicitly,
   add `"vite/client"` to that array: listing `types` at all suppresses TypeScript's
   automatic inclusion, and without it `import.meta.env` fails to typecheck
   (`TS2339`). The `@cognite/cli` scaffold does set `types`, so this usually applies.
4. Render `<AuraReviewLauncher />` once, near the app's root — e.g. alongside `<App />`
   in `main.tsx`:

   ```diff
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
   +      <AuraReviewLauncher />
          <App />
        </QueryClientProvider>
      </React.StrictMode>
    );
   ```

   Render it **before** `<App />`, so the banner sits at the very top of the page in
   normal flow rather than overlapping the app's own chrome. That's the entire
   integration — no route, tab, or nav entry needs to exist in the app itself.

5. Add the toggle to the app's `.env`:

   ```dotenv
   VITE_AURA_REVIEW_TOGGLE=TRUE
   ```

## The toggle

Nothing renders unless the app is **built** with `VITE_AURA_REVIEW_TOGGLE` set to `TRUE`
(or `1`; case-insensitive). Without it `AuraReviewLauncher` returns `null` — no banner,
no overlay.

It suppresses *rendering*, not bundling. The check isn't statically foldable, so a build
with the toggle off still contains this component and the report page; they just never
render. The toggle means "nobody sees it", not "nobody can find it" — `review.json`'s
contents sit in the bundle either way.

Two things about this are easy to get wrong:

- **The `VITE_` prefix is required.** Vite only exposes prefixed variables to client
  code, so a plain `AURA_REVIEW_TOGGLE=TRUE` in `.env` is invisible to the browser
  bundle and the banner silently never appears.
- **It's read at build time, not at boot.** Vite substitutes the literal into the bundle
  during `vite build`, so the variable has to be set in the build environment, and
  flipping it later needs a rebuild — you can't toggle a deployed app by editing its
  env. Vite reads it from `.env`/`.env.local` *and* from the process environment (the
  latter wins), so CI can just export `VITE_AURA_REVIEW_TOGGLE=TRUE` rather than writing
  a file.

Put it in `.env`, not `.env.local` — it's a non-secret build flag, and `.env.local` is
conventionally the untracked secrets file. Worth remembering that *any* `VITE_`-prefixed
value in either file gets baked into publicly readable client JS, so never prefix a
secret.

## Reaching the report

Once the toggle is on, the banner's "View report" button opens the overlay. That's the
only entry point — deliberately no `/aura-review` path or `#aura-review` hash to visit
directly.

An earlier version of this bundle read `window.location` for exactly that, reasoning
that it would work "regardless of whatever router the app uses." It didn't account for
how Fusion actually hosts these apps: the app runs inside an iframe whose `src` Fusion
computes itself from its own state (`cluster`/`workspace`/`customAppVersion`), so a path
or hash appended to the *outer* Fusion URL never reaches this component on a cold load —
only a click already inside the loaded app changes this window's own location, which is
exactly why the button worked in testing and the URL didn't.

The correct mechanism for a Fusion-reloadable/shareable deep link is
`connectToHostApp`'s `initialState` / `api.syncInternalState` (see the app's own
`CLAUDE.md` §2) — but that doesn't fit a drop-in bundle either. `syncInternalState` takes
one opaque string for the *whole* app's state, with no merge semantics, so this
component calling it independently of whatever state the host app already syncs would
silently overwrite it. Making that safe means hand-integrating into each specific
generated app's own state shape, not copying files into an unpredictable one — exactly
the coupling this bundle exists to avoid. So there's no deep link; open the report from
inside the app.

The banner's own "Dismiss" hides it for the session only — `Banner` keeps that in React
state, so it comes back on reload. The env var is the way to remove it from a build.

Open/closed state is otherwise intentionally local React state, not host-synced (see the
app's `CLAUDE.md` §2): a reviewer toggling this overlay doesn't need it persisted.
