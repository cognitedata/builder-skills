import { useCallback, useEffect, useState } from 'react';

import type { HostAppAPI, LocationFilter } from '@cognite/app-sdk';

export type UseSelectedLocationFiltersResult = {
  /** Selected location filters from the Fusion host. Empty while loading or when unavailable. */
  locationFilters: LocationFilter[];
  /** True until the first fetch settles (success or failure). */
  isLoading: boolean;
  /** Set when the host call fails (e.g. running outside Fusion with no HostAppAPI). */
  error: Error | null;
  /** Re-fetch the current selection from the host. */
  refetch: () => Promise<void>;
};

/**
 * Reads the user's currently selected CDF location filters via
 * `HostAppAPI.getSelectedLocationFilters()`.
 *
 * This is a point-in-time snapshot — the App SDK does not emit change events.
 * Call `refetch` after the user may have changed location in Fusion (e.g. on
 * window focus, route enter, or an explicit refresh control).
 */
export function useSelectedLocationFilters(
  api: HostAppAPI | null,
): UseSelectedLocationFiltersResult {
  const [locationFilters, setLocationFilters] = useState<LocationFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!api) {
      setLocationFilters([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const next = await api.getSelectedLocationFilters();
      setLocationFilters(next);
    } catch (err) {
      setLocationFilters([]);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { locationFilters, isLoading, error, refetch };
}
