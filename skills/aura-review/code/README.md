# Aura Review — in-app report page

An optional Aura-styled page that renders `aura-review/review.json` inside the
app itself, so the report ships with the deployed app instead of only living
in the repo/CI log.

## Files

- `types.ts` — the `AuraReviewReport` shape, matching `review.json` field for field.
- `report.ts` — imports `review.json` directly (`resolveJsonModule: true` required in
  `tsconfig.json`). This is the one file whose relative import path depends on where you
  copy the bundle — see Step below.
- `useAuraReviewViewModel.ts` — derives display labels (percent formatting) from the report.
- `AuraReviewPage.tsx` — the page itself: headline stats, a non-compliance findings table,
  and the excluded (third-party) usages list.

## Copying into an app

1. Copy every file in this folder into an app-local feature folder, e.g.:

   ```text
   src/features/aura-review/
   ```

2. Fix up `report.ts`'s import path so it resolves to that app's own
   `aura-review/review.json` relative to wherever you placed the folder.
3. Ensure the app's `tsconfig.json` has `"resolveJsonModule": true` — required to import
   `review.json` as a typed module.
4. Render `<AuraReviewPage />` from wherever the app wants to expose it (a route, a tab,
   a dedicated nav entry). This skill has no opinion on *how* it's surfaced — that's an
   app-level decision.

## Known placeholder: no host-sync yet

Whatever page/tab state the host app uses to show or hide this page (`useState`, a route,
a tab index, ...) is **not wired to `@cognite/app-sdk`'s host-synced state** here — copying
this bundle as-is means the page's visibility won't survive a reload or a shared link.
That's deliberate for now: the goal was to get `review.json` rendering *somewhere* in the
app and to start collecting data, not to design the final navigation. Wire up host sync
(see the app's own `CLAUDE.md` §2 "Host integration") as a follow-up once there's a real
navigation design to sync.
