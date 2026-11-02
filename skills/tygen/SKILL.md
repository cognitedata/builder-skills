---
name: tygen
description: Generate a typed client for one CDF data model in a Dune or Flows app, and use it to search, aggregate and query instances with the model's property names and types. Use only when the TyGen alpha flag is explicitly enabled.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

# TyGen

TyGen generates a typed client from one version of a CDF data model. Use it to read instances with short property names and result types that follow the request, instead of the nested `properties[space]['View/version']` objects of the native `@cognite/sdk`.

## Availability

TyGen is experimental and is not part of the normal app workflow. Before suggesting, running, or editing code that depends on generated output, verify that `COGNITE_ALPHA_ENABLE_TYGEN` is explicitly set to `true` for the command environment. If it is not enabled, explain that TyGen is an opt-in alpha capability and continue with the native `@cognite/sdk` types and APIs already used by the app.

If you introduce TyGen as an option, confirm the user wants to use it before running it. An explicit request to generate types is sufficient confirmation. Do not enable the flag, add it to a repository, or change deployment configuration without the user's explicit approval.

Without the flag the CLI reports `unknown command 'tygen'`. That means the flag is not set, not that the CLI is too old.

## Generate

This alpha needs the alpha CLI, `@cognite/cli@1.15.0-alpha.tygen-paging.1`. The published `@cognite/cli@latest` does not generate `initTygen`, the per-view methods or the paging described below.

From the app directory (it has an `app.json`), with `COGNITE_ALPHA_ENABLE_TYGEN=true` already set in the environment:

```bash
npx @cognite/cli@1.15.0-alpha.tygen-paging.1 tygen generate --data-model mySpace:myModel:v1
```

- An app's `.npmrc` may set `min-release-age=1`, so npm refuses a version published less than a day ago. Prefix the command with `npm_config_min_release_age=0` for this one run; do not change `.npmrc`.
- Without npm access, build the CLI from the dune branch `eliasb/alpha-tygen-paging` in a separate worktree (ask the user for the path to their dune checkout, and do not switch branches in it), and run `node <worktree>/packages/cli/dist/cli/cli.js tygen generate ...`.

- In an interactive terminal, omit `--data-model` to pick a versioned model from the project. `--interactive` controls browser authentication, independently of the model picker.
- The command uses the app configuration and the saved `cognite auth login` session. Use `--base-url` and `--project` to generate outside an app directory.
- When the data-model reference is unknown, `cognite api datamodels list` lists the models. It requires the separate `COGNITE_ALPHA_ENABLE_API=true` flag; check that it is already enabled before running it.
- Output goes to `src/generated_types/<externalId>/`: `index.ts` (the entry point), `types.ts`, `views.ts`, `tygen-views.ts`, `tygen-interface.ts`, `methods/` and `internal/`. Do not write application code there, and do not edit generated files.
- Generating again into the same folder replaces it. To keep two versions of a model side by side, generate the second with `-o src/generated_types/<externalId>-<version>`.
- Commit the generated output. After a data-model change, regenerate, inspect the diff, and run the app's typecheck and tests.

Generated code needs TypeScript 5.4 or later.

## Use

Import from the generated `index.ts`, and bind the client once:

```ts
import { initTygen } from './generated_types/PlantModel';

const tygen = initTygen(client); // client from useCogniteSdk()
```

Each view of the model is a property of `tygen`, such as `tygen.equipment`, with `search`, `searchAll`, `aggregate`, `query` and `queryAll`. A view that only edges use has no `query` or `queryAll`. The property name is the view's external ID in camelCase, such as `tygen.cogniteActivity`; check `tygen-views.ts` when unsure. In `filter`, `sort`, `select` and `groupBy`, a property is just its name, such as `'status'`. `filter` and `sort` also take an instance field such as `'externalId'`; `select` only takes the view's properties. A typo is a compile error.

### Search

Full-text search over one view. Items carry the view's properties directly in `item.properties`.

```ts
const found = await tygen.equipment.search({
  query: 'pump',
  properties: ['name'], // properties to search in
  filter: { equals: { property: 'status', value: 'active' } },
  limit: 10,
});
found.items.map((item) => item.properties.name);
```

Search is eventually consistent: writes made right before may not be found yet. Use `query` when that matters.

### Aggregate

```ts
const counts = await tygen.equipment.aggregate({ groupBy: ['isCritical'], aggregates: [{ count: {} }] });
for (const item of counts.items) {
  const isCritical = item.group?.isCritical; // typed from the model
  const count = item.aggregates[0]?.aggregate === 'count' ? item.aggregates[0].value : undefined;
}
```

`groupBy` only accepts text, number, boolean and direct-relation properties, lists of text or direct relations, and `externalId`, `space` and `version`. The API rejects enum, timestamp, date, JSON, file, time series and sequence properties, lists of numbers or booleans, and `createdTime`/`lastUpdatedTime`. The types do not check this yet, so such a `groupBy` compiles and fails when it runs. To count by an enum, run one `aggregate` per value, with a `count` and an `equals` filter on that value.

### Query

`query` reads one view, with an exact, up-to-date result. It can return selected properties only, filter on a related instance, and return the first instances each direct relation points to.

```ts
const page = await tygen.workOrder.query({
  filter: { nested: { scope: 'mainAsset', filter: { equals: { property: 'name', value: '43-PT-1027D' } } } },
  select: ['name', 'status', 'assets'],
  include: { mainAsset: { select: ['name'] }, assets: { select: ['name'], limit: 5 } },
  limit: 50,
});

const rows = page.items.map((item) => ({
  name: item.properties.name, // the selected properties, typed
  location: item.related.mainAsset?.properties?.name, // one relation: an instance or undefined
  assets: item.related.assets.map((a) => a.properties?.name), // a list relation: its first 5
  moreAssets: (item.properties.assets?.length ?? 0) - item.related.assets.length, // all IDs come with the selected relation
}));
```

- `select` lists the properties to return. Without it, all of them are returned.
- `nested.scope` and the keys of `include` are direct relations of the view, to another view of the model. Their `filter` and `select` use the property names of the target view. A related instance may have no data in the target view, so its `properties` may be `undefined`.
- `include` gives a list relation's first `limit` instances per item, 20 by default. They are read by ID in one more request per page, so a page costs 2 requests however long the lists are. To show "+ n more", select the relation itself, as above: `item.properties.assets` holds all its IDs. To page through one item's list, see "Reading every page".
- An `include` entry may be `undefined`, such as `include: { mainAsset: showAsset ? {} : undefined }`. Then `related.mainAsset` is optional.
- `include` also reads the target view. Without read access to it or its space, the whole query is likely to fail with a 403, not return fewer related instances. A query that works without `include` and fails with it points to this.
- Items that point to the same instance share one related object. Copy it before changing it.
- It returns 100 items by default and 10,000 at most. `nextCursor` is set when there may be more: pass it as `cursor`, with the rest of the request the same, for the next page.
- `sort` takes `nullsFirst`. Any order of a sort on one property pages correctly, see "Sorted pages".

### Indexes

The generated types know each property's index. A `query` or `queryAll` that filters on a property without an index, or sorts on one without a cursorable btree index, does not compile: `'status' has no index. Use search(), or set allowUnindexed: true`. DMS would scan the whole view for it, which can time out (408) on a large view.

- Prefer `search` or `searchAll` with the same filter. A list of direct relations, such as `assets`, rarely has an index: to find the instances that link to one, use search.
- Set `allowUnindexed: true` only for a view you know is small.
- `Indexed<typeof EquipmentView>` shows the indexes. `externalId` and `space` count as indexed; `createdTime` and `lastUpdatedTime` do not.

### Reading every page

`queryAll` and `searchAll` take the request of `query` and `search`, with `pageSize` and `maxItems` instead of `limit` and `cursor`. They return an async iterator that follows the cursors itself, and fetch the next page only when the loop needs it.

```ts
for await (const item of tygen.equipment.queryAll({ filter, select: ['name'], pageSize: 500 })) {
  if (item.properties.name === 'P-101') break; // No further requests go out.
}
```

- `pageSize` is 1,000 by default: at most 10,000 for `queryAll` and 1,000 for `searchAll`.
- Pulling more than `maxItems`, 10,000 by default, throws, so a read is never cut short without notice. To take only the first items, `break` or use `take`. Pass `maxItems: Infinity` to read everything.
- `break` closes the iterator for good. For "Load more" on one iterator, use `take` from the generated `index.ts`, which leaves it open: `const first = await take(rows, 25); const more = await take(rows, 25);`. Fewer than asked means the end.
- In a React UI with react-query, use `query` in `useInfiniteQuery` instead: `queryFn: ({ pageParam }) => tygen.equipment.query({ ..., limit: 50, cursor: pageParam })`, `initialPageParam: undefined as string | undefined`, `getNextPageParam: (last) => last.nextCursor`. An iterator does not survive react-query's refetch.
- `include` works the same in `queryAll`: 2 requests per page.

### Sorted pages

DMS has a cursor for a sort on one property only ascending with nulls last, or descending with nulls first. The per-view `query` and `queryAll` read the other two orders (descending with nulls last, the default for descending, and ascending with `nullsFirst: true`) in two parts, and encode the part in `nextCursor`. Pass the cursor back unchanged. The page where the parts meet takes one more request. For a short list on a filter without an index, that doubles the time; use `searchAll` there. A sort on several properties is sent as it is, and `queryAll` throws if DMS returns no cursor for it.

### Raw typed query

`tygen.query` takes a native `instances.query` request with full property paths, `[space, 'View/version', 'property']`, and types the result from it. Use it for inward relations, edges and set operations. Its results keep the native nesting under space and `View/version`: `item.properties[space]['View/version'].name`.

`tygen.queryPages(request, { follow: 'resultSetName' })` reads such a query page by page, following the cursor of `follow`, and yields one typed result per request. Use it to page through one item's relation: put the item in a `root` result set (filter on its `space` and `externalId`, `limit: 1`), follow the relation from it, and `follow` that result set. `take(pages, n)` reads only as many pages as needed. Result sets that `follow` reads from are read again for each page, and the call throws if one of them has more instances than its `limit`.

## Patterns

- **Build a filter in steps** by spreading in the conditions that are set, each ending in `as const` so its property names stay literal:
  ```ts
  const conditions = [
    ...(type ? [{ equals: { property: 'workOrderType', value: type } } as const] : []),
    ...(location ? [{ nested: { scope: 'mainAsset', filter: { equals: { property: 'name', value: location } } } } as const] : []),
  ];
  await tygen.workOrder.query({ ...(conditions.length > 0 ? { filter: { and: conditions } } : {}), select: ['name'] });
  ```
  The generated SDK exports no per-view filter type to annotate the array with. Without `as const`, the property names widen to `string`, and the call fails with a long `StrictKeys` error. A misspelled property is still a compile error. When no condition is set, leave the filter out, see below.
- **Never send an empty `and` or `or`.** The filter is sent as it is, and the API rejects an empty `and`. Leave the filter out instead.
- **Requests kept in a variable** need `as const`, or `as const satisfies QueryInput` for `tygen.query`.
- **Optional parts of a request**, such as a cursor, are spread in: `...(cursor ? { cursors: { orders: cursor } } : {})`.
- **Relations to views outside the model**, such as `CogniteSourceSystem` from a model that does not include it, have no short `scope` or `include` name. Use `tygen.query` with full paths.

## Known API limits

- A `nested` filter with `prefix` on a large view can time out (408). Prefer `equals`, or filter the target view first.
- A `query` that filters or sorts on a property without an index can time out on a large view; the types reject it unless `allowUnindexed` is set. Search is usually safer when you do not control the indexes.
- The query API rejects `in` on an enum property. Use `equals`, or an `or` of `equals`.
- The API cannot traverse a list of direct relations inwards.
- Reverse relations and edges are not in the per-view types; use `tygen.query` or `tygen.queryPages`.
- `instances.list` and writes stay on the native `@cognite/sdk`. Pass generated view references to it (`sources: [{ source: EquipmentView }]`).

## Explore data from the terminal

With `COGNITE_ALPHA_ENABLE_API=true`, `cognite api instances search|aggregate|query --view space:externalId/version` runs the same requests with short property names and prints a table, or JSON with `--json`. Without `--view`, an interactive terminal lets you pick the data model and view. Use it to check property names and values before writing app code.
