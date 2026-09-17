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
   itself. The launcher's own `useState` for open/closed is intentionally local, not
   host-synced (see the app's `CLAUDE.md` §2): a reviewer opening this overlay doesn't
   need it to survive a reload or show up in a shared link, so plain React state is the
   correct choice here, not an exception to that rule.
