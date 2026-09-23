# Aura Review — in-app report page

A self-contained, Aura-styled floating button that renders `aura-review/review.json`
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
- `AuraReviewLauncher.tsx` — a fixed floating button (bottom-right) that opens
  `AuraReviewPage` as a full-screen overlay on click. This is the only piece that needs
  to be rendered by the app — it doesn't touch the app's own nav/routing at all.

## Copying into an app

1. Copy every file in this folder into an app-local feature folder, e.g.:

   ```text
   src/features/aura-review/
   ```

2. Fix up `report.ts`'s import path so it resolves to that app's own
   `aura-review/review.json` relative to wherever you placed the folder.
3. Ensure the app's `tsconfig.json` has `"resolveJsonModule": true` — required to import
   `review.json` as a typed module.
4. Render `<AuraReviewLauncher />` once, near the app's root — e.g. alongside `<App />`
   in `main.tsx`:

   ```diff
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <App />
   +      <AuraReviewLauncher />
        </QueryClientProvider>
      </React.StrictMode>
    );
   ```

   That's the entire integration — no route, tab, or nav entry needs to exist in the app
   itself.

5. Add the toggle to the app's `.env`:

   ```dotenv
   VITE_AURA_REVIEW_TOGGLE=TRUE
   ```

## The toggle

Nothing renders unless the app is **built** with `VITE_AURA_REVIEW_TOGGLE` set to `TRUE`
(or `1`; case-insensitive). Without it `AuraReviewLauncher` returns `null` — no button,
no overlay.

Two things about this are easy to get wrong:

- **The `VITE_` prefix is required.** Vite only exposes prefixed variables to client
  code, so a plain `AURA_REVIEW_TOGGLE=TRUE` in `.env` is invisible to the browser
  bundle and the button silently never appears.
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

Three ways in, once the toggle is on:

- The floating button, bottom-right.
- `/aura-review` — works wherever the host serves `index.html` for unknown paths (the
  standard SPA fallback, which App Hosting does). If the app's own router redirects
  unmatched paths back to `/`, this one won't stick.
- `#aura-review` — needs nothing from the server and survives router redirects, so it's
  the reliable one to share. Only conflicts if the app uses `HashRouter`.

Both URL forms are handled by reading `window.location` directly, so this bundle stays
independent of whatever router (or no router) the app happens to use — the overlay just
renders on top. The launcher listens for `hashchange`/`popstate` so in-app navigation to
those URLs opens it too, and closing clears the deep link so it doesn't immediately
reopen.

Open/closed state is otherwise intentionally local React state, not host-synced (see the
app's `CLAUDE.md` §2): beyond the deep link above, a reviewer toggling this overlay
doesn't need it persisted.
