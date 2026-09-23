import {
  Banner,
  BannerAction,
  BannerActions,
  BannerClose,
  BannerIcon,
  BannerTitle,
} from '@cognite/aura/components/banner';
import { IconChartBar } from '@tabler/icons-react';
import { useState } from 'react';

import { AuraReviewPage } from './AuraReviewPage';

// Off unless the app is built with VITE_AURA_REVIEW_TOGGLE=TRUE. When it's off this
// component renders nothing at all — no banner, no overlay.
//
// The VITE_ prefix is not decorative: Vite only exposes prefixed vars to client code
// (see its resolveEnvPrefix), so a plain AURA_REVIEW_TOGGLE in .env is invisible here
// and the toggle would silently never fire. It's also substituted at *build* time, not
// read at boot — the value has to be present when `vite build` runs, and changing it
// afterwards means rebuilding.
//
// This suppresses rendering, not bundling: the regex below isn't statically foldable,
// so a build with the toggle off still ships this component and the report page, they
// just never render. Treat the toggle as "nobody sees it", not "nobody can find it" —
// review.json's contents are readable in the bundle either way.
const ENABLED = /^(true|1)$/i.test(import.meta.env.VITE_AURA_REVIEW_TOGGLE ?? '');

// Deliberately no deep link (no /aura-review path, no #aura-review hash). This app is
// rendered inside a Fusion-managed iframe: Fusion computes that iframe's own src from
// its own state (cluster/workspace/customAppVersion), so a fragment or path appended to
// the *outer* Fusion URL never reaches this component on a cold load — only a click
// already inside the loaded app changes this window's own location. A prior version of
// this file relied on window.location for exactly that entry point and it silently never
// worked from outside. The correct fix — routing this through
// connectToHostApp/syncInternalState, Fusion's actual mechanism for reloadable/shareable
// state — doesn't fit a drop-in bundle either: syncInternalState takes one opaque string
// for the *whole* app, with no merge semantics, so a sibling component calling it
// independently of whatever state the host app already syncs would overwrite it. Open
// the report through the banner's button, which needs none of this.
export function AuraReviewLauncher() {
  const [open, setOpen] = useState(false);

  if (!ENABLED) return null;

  return (
    <>
      {/* Aura's Banner, info variant: full-width persistent chrome announcing the state
          of this build, which is what DESIGN.md's "environment or product state
          (maintenance, trial, feature preview)" bullet describes. Render it as the very
          first thing in the app so it sits above the app's own chrome in normal flow
          rather than covering any of it. */}
      <Banner variant="info">
        <BannerIcon icon={IconChartBar} />
        <BannerTitle>
          <span className="truncate">
            This build includes an automated Aura design-system review.
          </span>
          <span className="ml-2 hidden shrink-0 text-sm font-normal opacity-80 lg:inline">
            Set <code>VITE_AURA_REVIEW_TOGGLE=FALSE</code> in <code>.env</code> and rebuild to
            hide this.
          </span>
        </BannerTitle>
        <BannerActions>
          <BannerAction onClick={() => setOpen(true)}>View report</BannerAction>
          {/* BannerClose ships no default content — it's a BannerAction wired to hide
              the banner, so it needs its own label. Dismissing only lasts the session;
              the env var is what removes it from the build. */}
          <BannerClose>Dismiss</BannerClose>
        </BannerActions>
      </Banner>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
          <AuraReviewPage onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
