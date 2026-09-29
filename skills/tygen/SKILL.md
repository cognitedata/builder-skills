---
name: tygen
description: Generate and use TypeScript types for one CDF data model in a Dune or Flows app. Use only when the TyGen alpha flag is explicitly enabled.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

# TyGen

Use `cognite tygen generate` to add generated model types and typed view references to a Dune or Flows app. The generated files describe the selected data model. They do not provide a runtime client, query helpers, or data-model CRUD APIs.

## Availability

TyGen is experimental and is not part of the normal app workflow. Before suggesting, running, or editing code that depends on generated output, verify that `COGNITE_ALPHA_ENABLE_TYGEN` is explicitly set to `true` for the command environment. If it is not enabled, do not open or apply this skill. Explain that TyGen is an opt-in alpha capability and continue with the native `@cognite/sdk` types and APIs already used by the app.

Do not enable the flag, add it to a repository, or change deployment configuration without the user's explicit approval.

## Generate

Generate against one versioned data model:

```bash
COGNITE_ALPHA_ENABLE_TYGEN=true npx @cognite/cli@latest tygen generate \
  --data-model mySpace:myModel:v1
```

The command authenticates using the app configuration and environment in the current directory. Use `--interactive` for browser authentication, or use `--base-url` and `--project` with it when generating outside an app directory. Use `-o <directory>` only when the default output location is unsuitable.

The default output location is `src/generated_types/<externalId>/`. Each run replaces `types.ts` and `views.ts` in that directory, so application code must not be written into the generated directory.

## Consume

Import model property types from `types.ts` and view references from `views.ts`. Keep them as types and source selectors for the native SDK:

```ts
import type { Equipment } from './generated_types/PlantModel/types';
import { EquipmentView } from './generated_types/PlantModel/views';

const response = await sdk.instances.list({
  instanceType: 'node',
  sources: [EquipmentView],
});

const equipment = response.items as Array<{ properties: Record<string, Equipment> }>;
```

Generated direct relations use `DirectRelationTo<Target>`, which is a `DirectRelationReference` with a phantom target type. It preserves the CDF wire format and only improves static TypeScript checking.

Regenerate after a data-model change, inspect the diff, and run the app's typecheck and relevant tests. Do not edit generated files by hand.
