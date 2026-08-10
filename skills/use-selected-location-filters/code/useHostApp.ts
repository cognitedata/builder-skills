import { useEffect, useState } from 'react';

import { connectToHostApp, type HostAppAPI } from '@cognite/app-sdk';

/**
 * Obtains the Fusion `HostAppAPI` once on mount.
 *
 * Returns `null` when running outside Fusion (standalone vite/dev) — callers
 * should treat that as "host features unavailable", not as an error UI.
 *
 * IMPORTANT: store the Comlink proxy with the updater form `setApi(() => api)`.
 * Proxies are callable; `setApi(api)` makes React invoke the proxy as a
 * state updater and you end up storing a Promise.
 */
export function useHostApp(applicationName?: string): HostAppAPI | null {
  const [api, setApi] = useState<HostAppAPI | null>(null);

  useEffect(() => {
    let cancelled = false;

    connectToHostApp(
      applicationName ? { applicationName } : undefined,
    )
      .then(({ api: resolvedApi }) => {
        if (!cancelled) {
          setApi(() => resolvedApi);
        }
      })
      .catch(() => {
        // Outside Fusion — leave api as null.
      });

    return () => {
      cancelled = true;
    };
  }, [applicationName]);

  return api;
}
