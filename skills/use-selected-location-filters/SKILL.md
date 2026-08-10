---
name: use-selected-location-filters
description: >-
  MUST be used when a Flows/Fusion app needs the user's currently selected CDF
  location filters via @cognite/app-sdk HostAppAPI.getSelectedLocationFilters().
  Use to scope queries by location, read dataModels/instanceSpaces/assetCentric
  filters, or show which location the user picked in Fusion. Triggers: selected
  location filters, getSelectedLocationFilters, LocationFilter, location filter,
  location picker, scope by location, instanceSpaces, assetCentric filter,
  dataModels from location, Fusion location selection.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

# Use Selected Location Filters

Read the CDF location filters the user has selected in Fusion, through the
Apps API host bridge.

**Requires Apps API auth** (`app.json` has `"infra": "appsApi"`) and a working
`connectToHostApp()` handshake from `@cognite/app-sdk`. Classic / `@cognite/dune`
apps have no equivalent — migrate first with
[setup-flows-auth](../setup-flows-auth/SKILL.md) or
[migrate-app-to-flows](../migrate-app-to-flows/SKILL.md).

`CogniteSdkProvider` / `useCogniteSdk()` only expose a `CogniteClient`. Location
filters live on `HostAppAPI` — you must keep a reference from
`connectToHostApp()`, not try to read them off the SDK client.

## What it does

```ts
api.getSelectedLocationFilters(): Promise<LocationFilter[]>
```

Fusion resolves the user's current selection (stored per-project in the host)
and returns full `LocationFilter` objects. Typical uses:

- Scope asset-centric list/search calls with `assetCentric` (data sets, asset
  subtrees, external-id prefixes).
- Scope Data Modeling queries with `instanceSpaces` / `dataModels` / `views`.
- Open the configured 3D `scene` for the location.
- Show the selected location name(s) in your UI.

### Snapshot, not a stream

There is **no change subscription** on `HostAppAPI`. Each call is a
point-in-time snapshot. Re-fetch when the selection may have changed (window
focus, route enter, or an explicit refresh). Do not poll aggressively.

### Empty selection → system default

If the user has not picked a location, the host still returns one synthetic
filter:

| Field | Value |
|-------|--------|
| `id` | `-1` |
| `externalId` | `'preset-location'` |
| `name` | `'System default'` |

Treat `externalId === 'preset-location'` (or `id === -1`) as "no real location
selected" when you need to distinguish it from configured locations.

## Files

| File | Purpose |
|------|---------|
| `code/useHostApp.ts` | Connect once; store the Comlink `HostAppAPI` safely. Copy to `src/hooks/`. |
| `code/useSelectedLocationFilters.ts` | Fetch + loading/error/refetch. Copy to `src/hooks/`. |

Skip `useHostApp.ts` if the app already has an equivalent (e.g. from
[integrate-fusion-agent](../integrate-fusion-agent/SKILL.md) or
[hide-show-shell](../hide-show-shell/SKILL.md)) — reuse that `api` instead.

## Step 0 — Pre-flight

Read `package.json`, `app.json`, and where `connectToHostApp` / `CogniteSdkProvider`
are wired.

1. Confirm `"infra": "appsApi"` in `app.json`.
2. Confirm `@cognite/app-sdk` is installed and `HostAppAPI` includes
   `getSelectedLocationFilters` (upgrade if missing).
3. If auth is not wired, run [setup-flows-auth](../setup-flows-auth/SKILL.md) first.

## Step 1 — Obtain `HostAppAPI`

Copy `code/useHostApp.ts` (or reuse an existing host hook). Critical detail:
store the Comlink proxy with the **updater form**:

```ts
setApi(() => resolvedApi); // correct
// setApi(resolvedApi);    // WRONG — React treats the callable proxy as a setter
```

## Step 2 — Fetch selected location filters

Copy `code/useSelectedLocationFilters.ts` and wire it:

```tsx
import { useHostApp } from './hooks/useHostApp';
import { useSelectedLocationFilters } from './hooks/useSelectedLocationFilters';

function LocationScopedView() {
  const api = useHostApp('my-app');
  const { locationFilters, isLoading, error, refetch } =
    useSelectedLocationFilters(api);

  if (!api) return null; // outside Fusion
  if (isLoading) return <div>Loading locations…</div>;
  if (error) return <div>Could not load locations: {error.message}</div>;

  const primary = locationFilters[0];

  return (
    <div>
      <p>Location: {primary?.name ?? '—'}</p>
      <button type="button" onClick={() => void refetch()}>
        Refresh location
      </button>
    </div>
  );
}
```

### Imperative (non-React)

```ts
import { connectToHostApp, type LocationFilter } from '@cognite/app-sdk';

const { api } = await connectToHostApp();
const filters: LocationFilter[] = await api.getSelectedLocationFilters();
```

## Step 3 — Use the filter fields

`LocationFilter` (exported from `@cognite/app-sdk`) shape that apps typically
consume:

| Field | Use for |
|-------|---------|
| `id`, `externalId`, `name` | Identity / UI labels |
| `dataModelingType` | `'HYBRID'` \| `'ASSET_CENTRIC_ONLY'` \| `'DATA_MODELING_ONLY'` |
| `dataModels` | `{ externalId, space, version }[]` — which DM models apply |
| `instanceSpaces` | Spaces to scope DM instance queries |
| `userDataInstanceSpace` | Writable app/user data space for this location |
| `assetCentric` | Asset-centric resource filters (`dataSetIds`, `assetSubtreeIds`, `externalIdPrefix`, plus per-resource overrides) |
| `views` | View configs (`externalId`, `space`, `version`, `representsEntity`) |
| `scene` | Linked 3D scene `{ externalId, space }` |

Example: scope a DM query to the selected location's spaces:

```ts
const spaces = locationFilters.flatMap((f) => f.instanceSpaces ?? []);
// pass `spaces` into your CogniteClient data-modeling filter / query
```

Example: apply asset-centric dataset scoping:

```ts
const dataSetIds = locationFilters.flatMap(
  (f) => f.assetCentric?.dataSetIds ?? [],
);
```

Do **not** invent a parallel location type — import `LocationFilter` from
`@cognite/app-sdk`.

## Step 4 — Re-fetch when selection may change

Recommended triggers (pick what fits the app):

- `window` `'focus'` / `visibilitychange` when the document becomes visible
- Entering a route that depends on location
- Explicit "Refresh" after the user changes location in the Fusion top bar

```ts
useEffect(() => {
  const onVisible = () => {
    if (document.visibilityState === 'visible') void refetch();
  };
  document.addEventListener('visibilitychange', onVisible);
  return () => document.removeEventListener('visibilitychange', onVisible);
}, [refetch]);
```

## Step 5 — Tests

Smoke-test the hook with a stub `HostAppAPI`:

```ts
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HostAppAPI, LocationFilter } from '@cognite/app-sdk';

import { useSelectedLocationFilters } from './useSelectedLocationFilters';

const FILTER: LocationFilter = {
  id: 1,
  externalId: 'plant-a',
  name: 'Plant A',
  createdTime: 0,
  lastUpdatedTime: 0,
  dataModelingType: 'HYBRID',
};

function makeApi(
  filters: LocationFilter[] = [FILTER],
): Pick<HostAppAPI, 'getSelectedLocationFilters'> {
  return {
    getSelectedLocationFilters: vi.fn(() => Promise.resolve(filters)),
  };
}

describe('useSelectedLocationFilters', () => {
  it('loads filters from the host', async () => {
    const api = makeApi();
    const { result } = renderHook(() =>
      useSelectedLocationFilters(api as HostAppAPI),
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(api.getSelectedLocationFilters).toHaveBeenCalled();
    expect(result.current.locationFilters).toEqual([FILTER]);
    expect(result.current.isLoading).toBe(false);
  });

  it('is a no-op when api is null', async () => {
    const { result } = renderHook(() => useSelectedLocationFilters(null));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.locationFilters).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
```

## Related

- [setup-flows-auth](../setup-flows-auth/SKILL.md) — `connectToHostApp` prerequisite
- [integrate-fusion-agent](../integrate-fusion-agent/SKILL.md) — shared `useHostApp` pattern
- [hide-show-shell](../hide-show-shell/SKILL.md) — other `HostAppAPI` surface
- [CDF locations docs](https://docs.cognite.com/cdf/locations) — what location filters are
