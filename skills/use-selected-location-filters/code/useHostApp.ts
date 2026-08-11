import { useEffect, useState } from 'react';

import { connectToHostApp, type HostAppAPI } from '@cognite/app-sdk';

export type UseHostAppResult = {
  /** Host bridge when connected. `undefined` outside Fusion or after a failed handshake. */
  api: HostAppAPI | undefined;
  /**
   * Set when `connectToHostApp()` rejects. Standalone vite/dev also rejects —
   * treat `!api` as "host features unavailable" for UI; use `error` to diagnose
   * real handshake failures (auth, Comlink, version mismatch).
   */
  error: Error | undefined;
};

/**
 * Obtains the Fusion `HostAppAPI` once on mount.
 *
 * Returns `api: undefined` when running outside Fusion (standalone vite/dev) —
 * callers should treat that as "host features unavailable", not as an error UI.
 */
export function useHostApp(applicationName?: string): UseHostAppResult {
  const [api, setApi] = useState<HostAppAPI | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    connectToHostApp(
      applicationName ? { applicationName } : undefined,
    )
      .then(({ api: resolvedApi }: { api: HostAppAPI }) => {
        if (!cancelled) {
          // IMPORTANT: store the Comlink proxy with the updater form `setApi(() => api)`.
          // Proxies are callable; `setApi(api)` makes React invoke the proxy as a
          // state updater and you end up storing a Promise.
          setApi(() => resolvedApi);
          setError(undefined);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setApi(undefined);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applicationName]);

  return { api, error };
}
