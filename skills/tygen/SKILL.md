---
name: tygen
description: Generate TypeScript types and a typed instances query for one CDF data model in a Dune or Flows app. Use only when the TyGen alpha flag is explicitly enabled.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

# TyGen

Use a TyGen-enabled `cognite` CLI to add generated model types, typed view references and a type-checked `instances.query` to a Dune or Flows app. This is the typed query alpha: it needs the CLI built from the dune branch `eliasb/alpha-tygen`, not the published `@cognite/cli@latest`.

## Availability

TyGen is experimental and is not part of the normal app workflow. Before suggesting, running, or editing code that depends on generated output, verify that `COGNITE_ALPHA_ENABLE_TYGEN` is explicitly set to `true` for the command environment. If it is not enabled, explain that TyGen is an opt-in alpha capability and continue with the native `@cognite/sdk` types and APIs already used by the app.

If you introduce TyGen as an option, confirm the user wants to use it before running it. An explicit request to generate types is sufficient confirmation. Do not enable the flag, add it to a repository, or change deployment configuration without the user's explicit approval.

## Generate

The typed query needs a local build of the dune repository on branch `eliasb/alpha-tygen`. The published `@cognite/cli@latest` (1.13.0) writes only `types.ts` and `views.ts`, with no `query.ts`.

```bash
cd <dune checkout> && git checkout eliasb/alpha-tygen
pnpm install && pnpm --filter @cognite/cli build
```

Then, from the app directory (it needs an `app.json`):

```bash
COGNITE_ALPHA_ENABLE_TYGEN=true node <dune checkout>/packages/cli/dist/cli/cli.js tygen generate \
  --data-model mySpace:myModel:v1
```

In an interactive terminal, omit `--data-model` to pick a versioned model from the target project. The `--interactive` flag controls browser authentication, independently of the model picker; `--auth-method session` reuses a saved login. Use `--base-url` and `--project` with `--interactive` when generating outside an app directory, and `-o <directory>` only when the default output location is unsuitable. When the data-model reference is unknown, `cognite api datamodels list` lists available models; it requires the separate `COGNITE_ALPHA_ENABLE_API=true` flag, so check that it is already enabled before running it.

The default output location is `src/generated_types/<externalId>/`. Each run writes `types.ts`, `views.ts` and `query.ts`, so application code must not be written into the generated directory. Commit the generated output with the app source. Regenerate after a data-model change, inspect the diff, and run the app's typecheck and relevant tests. Do not edit generated files by hand.

## Query

`query.ts` exports `initTygen`. Bind the client once and call `tygen.query` with a native `instances.query` request. The request and response are passed through unchanged; only the TypeScript types change. The result type follows the request, so only the selected properties are typed, and a typo in a view, property or filter path is a compile error.

```ts
import { initTygen } from './generated_types/PlantModel/query';
import { EquipmentView } from './generated_types/PlantModel/views';

const tygen = initTygen(client); // client from useCogniteSdk()

const result = await tygen.query({
  with: { equipment: { nodes: { filter: { hasData: [EquipmentView] } }, limit: 25 } },
  select: { equipment: { sources: [{ source: EquipmentView, properties: ['name', 'status'] }] } },
});
// string | undefined; a property that was not selected is a type error
result.items.equipment[0]?.properties?.plant?.['Equipment/1']?.name;
```

Rules:

- **Write the request inline.** TypeScript infers literal types from it. A request kept in a variable needs `as const satisfies QueryInput`; without `as const` the call is rejected. Import `QueryInput` from `query.ts`.
- **Property paths** in filters and sorts are `[space, 'View/version', 'property']`, or `['node', 'externalId']` for a property every instance has. A typo, a view or version that is not in the model, or a property of another view is an error on that part of the path. Container paths `[space, containerExternalId, property]` are rejected: use the view path.
- **Dynamic filters.** A path only keeps its literal type when it is written inside the request, so a function that builds a filter returns `QueryFilter` (or uses `as const`):
  ```ts
  const hasStatus = (status: string): QueryFilter => ({
    equals: { property: ['plant', 'Equipment/1', 'status'], value: status },
  });
  ```
  For a map from names to properties, such as sortable columns, use `as const satisfies Record<string, QueryProperty>`, and narrow a name that arrives as a `string` with a type guard on the map's keys.
- **Optional cursor.** Spread it: `...(cursor ? { cursors: { equipment: cursor } } : {})`. Writing `cursors: cursor ? { ... } : {}` loses the result types, and `: undefined` fails with `exactOptionalPropertyTypes`.
- **`select` aliases** must exist in `with`, and `through.identifier` must be a property of `through.source`. Mistakes in these make the result an error type that names the problem, for example `Property 'items' does not exist on type '{ selectedWithoutExpression: "x" }'`. The call itself still compiles, so they only fail where the result is read.
- Set `direction` explicitly on a `through` traversal. It is not checked, and without it CDF may return no nodes.
- Result set names (the keys of `with` and `select`) must be literals; otherwise the result is the native `QueryResponse`.

## Not typed, and known API limits

- `instances.search`, `instances.aggregate`, `instances.list` and writes stay on the native `@cognite/sdk`. Use generated view references with them (`sources: [{ source: EquipmentView }]`) and look up returned properties by space, then `externalId/version`.
- Filter values, `through.direction`, `targetUnits`, and the cost or index use of a query are not checked.
- The API rejects `in` on an enum property (`Unknown space referenced`): use `equals`, or an `or` of `equals`.
- The API cannot traverse a list of direct relations inwards (`Cannot traverse lists of direct relations inwards`): filter the list property instead, for example `containsAny` on a `path`, which can be slow on large data, or traverse a single-valued relation.
- Reverse relations and edge connections are not properties of a view and are not in the generated types.

Generated direct relations use `DirectRelationTo<Target>`, which combines `DirectRelationReference` from `@cognite/sdk` with a phantom target type. It preserves the CDF wire format and only improves static TypeScript checking.
