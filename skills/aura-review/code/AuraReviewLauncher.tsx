import {
  Banner,
  BannerAction,
  BannerActions,
  BannerClose,
  BannerIcon,
  BannerTitle,
} from '@cognite/aura/components/banner';
import { IconChartBar } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

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

// Deep links, without depending on the host app's router. Every reviewed app is
// generated fresh — it might use react-router, TanStack Router, or no router at all —
// so instead of registering a route we read window.location ourselves and render the
// overlay above whatever the app does with that URL.
//
// Both forms work, and they fail in different situations, which is why both exist:
//   /aura-review   needs the host to serve index.html for unknown paths (the standard
//                  SPA fallback, which App Hosting does). Breaks if the app's own
//                  router redirects unmatched paths back to /.
//   #aura-review   needs nothing from the server and survives router redirects, but
//                  collides with an app using HashRouter (uncommon in generated apps).
// The banner links to the hash form for that reason.
const DEEP_LINK_PATH = '/aura-review';
const DEEP_LINK_HASH = '#aura-review';

function isDeepLinked(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === DEEP_LINK_PATH || window.location.hash === DEEP_LINK_HASH;
}

export function AuraReviewLauncher() {
  const [open, setOpen] = useState(isDeepLinked);

  // Keep up with navigation the app does after mount — the banner's own link, or a
  // back/forward step onto the URL, should open the report the same way a fresh load
  // does.
  useEffect(() => {
    if (!ENABLED) return;
    const sync = () => setOpen(isDeepLinked());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  if (!ENABLED) return null;

  // Closing has to clear the deep link too, or the overlay reopens on the next render.
  const close = () => {
    setOpen(false);
    if (typeof window === 'undefined') return;
    if (window.location.hash === DEEP_LINK_HASH) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } else if (window.location.pathname === DEEP_LINK_PATH) {
      window.history.replaceState(null, '', '/');
    }
  };

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
          {/* A real anchor via Base UI's render prop, not a button with an onClick —
              so the report URL can be copied, opened in a new tab, and shared. */}
          <BannerAction render={<a href={DEEP_LINK_HASH} />}>View report</BannerAction>
          {/* BannerClose ships no default content — it's a BannerAction wired to hide
              the banner, so it needs its own label. Dismissing only lasts the session;
              the env var is what removes it from the build. */}
          <BannerClose>Dismiss</BannerClose>
        </BannerActions>
      </Banner>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
          <AuraReviewPage onClose={close} />
        </div>
      )}
    </>
  );
}
