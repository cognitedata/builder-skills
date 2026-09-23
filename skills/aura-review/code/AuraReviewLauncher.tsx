import { IconChartBar } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

import { AuraReviewPage } from './AuraReviewPage';

// Off unless the app is built with VITE_AURA_REVIEW_TOGGLE=TRUE. When it's off this
// component renders nothing at all — no button, no overlay, no keybinding.
//
// The VITE_ prefix is not decorative: Vite only exposes prefixed vars to client code
// (see its resolveEnvPrefix), so a plain AURA_REVIEW_TOGGLE in .env is invisible here
// and the toggle would silently never fire. It's also substituted at *build* time, not
// read at boot — the value has to be present when `vite build` runs, and changing it
// afterwards means rebuilding. That's the tradeoff for the review page adding zero
// bytes to an app built without it.
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
const DEEP_LINK_PATH = '/aura-review';
const DEEP_LINK_HASH = '#aura-review';

function isDeepLinked(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === DEEP_LINK_PATH || window.location.hash === DEEP_LINK_HASH;
}

export function AuraReviewLauncher() {
  const [open, setOpen] = useState(isDeepLinked);

  // Keep up with navigation the app does after mount — a link to #aura-review, or a
  // back/forward step onto it, should open the report the same way a fresh load does.
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Aura Review"
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <IconChartBar aria-hidden className="size-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
          <AuraReviewPage onClose={close} />
        </div>
      )}
    </>
  );
}
