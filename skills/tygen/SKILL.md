---
name: tygen
description: Generate and use TypeScript types for one CDF data model in a Dune or Flows app. Use only when the TyGen alpha flag is explicitly enabled.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

# TyGen

Use a TyGen-enabled `cognite` CLI to add generated model types and typed view references to a Dune or Flows app. The generated files describe the selected data model. They do not provide a runtime client, query helpers, or data-model CRUD APIs.

## Availability

TyGen is experimental and is not part of the normal app workflow. Before suggesting, running, or editing code that depends on generated output, verify that `COGNITE_ALPHA_ENABLE_TYGEN` is explicitly set to `true` for the command environment. If it is not enabled, explain that TyGen is an opt-in alpha capability and continue with the native `@cognite/sdk` types and APIs already used by the app.

If you introduce TyGen as an option, confirm the user wants to use it before running it. An explicit request to generate types is sufficient confirmation. Do not enable the flag, add it to a repository, or change deployment configuration without the user's explicit approval.

## Generate

Generate against one versioned data model:

```bash
npx @cognite/cli@latest tygen generate \
  --data-model mySpace:myModel:v1
```

Use the CLI installed by the app or a local build that exposes `tygen generate --help`. Code on main may not yet be in the published `@cognite/cli@latest` package.

In an interactive terminal, omit `--data-model` to pick a model from the target project. The picker selects a versioned model. The `--interactive` flag controls browser authentication, independently of the model picker.

The command authenticates using the app configuration and environment in the current directory. Use `--interactive` for browser authentication, or use `--base-url` and `--project` with it when generating outside an app directory. Use `-o <directory>` only when the default output location is unsuitable.

When the data-model reference is unknown, `cognite api datamodels list` can list available models. This command requires the separate `COGNITE_ALPHA_ENABLE_API=true` flag. Check that it is already enabled before running it.

The default output location is `src/generated_types/<externalId>/`. Each run writes `types.ts` and `views.ts` in that directory, so application code must not be written into the generated directory. Commit the generated output with the app source.

## Consume

Import model property types from `types.ts` and view references from `views.ts`. Pass view references inside a `source` object to the native `@cognite/sdk`. Its response groups properties first by space, then by `externalId/version`. Validate the fields you use before narrowing runtime data to a generated type:

```ts
import type { Equipment } from './generated_types/PlantModel/types';
import { EquipmentView } from './generated_types/PlantModel/views';

function hasEquipmentName(value: unknown): value is Pick<Equipment, 'name'> {
  return typeof value === 'object'
    && value !== null
    && 'name' in value
    && typeof value.name === 'string';
}

const response = await sdk.instances.list({
  instanceType: 'node',
  sources: [{ source: EquipmentView }],
});

for (const node of response.items) {
  const properties = node.properties?.[EquipmentView.space]?.[
    `${EquipmentView.externalId}/${EquipmentView.version}`
  ];
  if (hasEquipmentName(properties)) console.log(properties.name);
}
```

Generated direct relations use `DirectRelationTo<Target>`, which combines `DirectRelationReference` from `@cognite/sdk` with a phantom target type. It preserves the CDF wire format and only improves static TypeScript checking.

Regenerate after a data-model change, inspect the diff, and run the app's typecheck and relevant tests. Do not edit generated files by hand.
