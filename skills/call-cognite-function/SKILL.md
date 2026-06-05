---
name: call-cognite-function
description: Call a deployed Cognite CDF Function and retrieve its response. Use this skill whenever you need to invoke any CDF Function (by numeric function ID or external ID), pass arbitrary input data, and get the result back — regardless of what the function does or what shape its input/output takes. Triggers: call cognite function, invoke CDF function, run CDF function, poll CDF function, CDF Functions API, cognite function result, function call nonce.
---

# Call Cognite Function

Invoke any deployed Cognite CDF Function, poll until it completes, and return the typed result to the caller.

## Overview

The CDF Functions API uses a three-step protocol:
1. **Session nonce** — exchange the current user token for a short-lived nonce so the function can make authenticated API calls on the user's behalf.
2. **Invoke** — POST to the function's `/call` endpoint with your input data and the nonce.
3. **Poll → fetch** — GET the call status in a loop; once `"Completed"`, GET the `/response` endpoint.

The bundled code in `code/` implements this as a generic, reusable TypeScript service and React hook. Copy whichever pieces fit your project.

## Files

| File | Purpose |
|------|---------|
| `code/cogniteFunctionService.ts` | Framework-agnostic async function. Zero React deps. Copy into `src/services/` or similar. |
| `code/useCogniteFunction.ts` | Optional React hook that wraps the service with `isLoading / error / result` state. Copy into `src/hooks/`. |

Read both files before deciding what to adapt — the service alone is sufficient for non-React contexts.

## How to use

### 1. Copy the service file

Copy `code/cogniteFunctionService.ts` into your project. No changes needed unless you want to rename it.

**Required peer dependency:** `@cognite/sdk` — already present in any Flows/Fusion app.

The service exports one function:

```ts
callCogniteFunction<TInput, TOutput>(
  client: CogniteClient,
  functionId: string | number,
  data: TInput,
  opts?: CallCogniteFunctionOptions,
): Promise<TOutput>
```

- `functionId` — numeric CDF function ID **or** its string form. Do NOT pass an external ID string here; look up the numeric ID first via `GET /api/v1/projects/{project}/functions` if you only have the external ID.
- `data` — any JSON-serialisable object; the function receives it as its `data` argument.
- `opts.maxPollAttempts` — default 120 (≈ 6 min at 3 s intervals).
- `opts.pollIntervalMs` — default 3 000 ms.
- `opts.signal` — `AbortSignal` for cancellation.

### 2. Type your input/output

Define interfaces for your specific function:

```ts
interface MyFunctionInput {
  reportId: string;
  language: "en" | "no";
}

interface MyFunctionOutput {
  success: boolean;
  report: string;
  error?: string;
}

const result = await callCogniteFunction<MyFunctionInput, MyFunctionOutput>(
  client,
  12345678,          // numeric function ID from CDF
  { reportId: "abc", language: "en" },
);
```

### 3. Handle errors

The service throws `CogniteFunctionError` (a subclass of `Error`) on:
- Failure to obtain a session nonce
- HTTP error when invoking the function
- Poll status `"Failed"` or `"Timeout"`
- Poll timeout (maxPollAttempts exhausted)
- HTTP error fetching the response

Catch it to surface friendly messages:

```ts
try {
  const result = await callCogniteFunction(...);
} catch (err) {
  if (err instanceof CogniteFunctionError) {
    console.error(err.message, err.status, err.callId);
  }
}
```

### 4. (React) Copy the hook

If you're in a React component, copy `code/useCogniteFunction.ts` and adapt the import of `useCdfClient` to however your project exposes the SDK:

```ts
// Adjust this import to your project's SDK context
import { useCdfClient } from "@/contexts/CdfClientContext";
```

Usage in a component:

```tsx
const { call, isLoading, error, result, reset } = useCogniteFunction<
  MyFunctionInput,
  MyFunctionOutput
>(12345678);

// trigger on button click:
await call({ reportId: "abc", language: "en" });
```

## Finding the function ID

If you only know the function's **external ID**, resolve it first:

```ts
const res = await client.get(
  `/api/v1/projects/${client.project}/functions`,
);
const fn = (res.data as { items: { id: number; externalId: string }[] })
  .items.find((f) => f.externalId === "My_Function_ExternalId");
const functionId = fn!.id;
```

## Polling behaviour

The poll interval has ±20 % jitter (`interval * (0.8 + 0.4 * Math.random())`) to avoid thundering-herd problems when multiple tabs call simultaneously. With defaults (120 attempts × 3 s) the effective timeout is ~6 minutes, matching typical Cognite function limits.

Increase `maxPollAttempts` for long-running functions (e.g. batch jobs). Reduce `pollIntervalMs` only if the function is known to be fast.

## Abort / cleanup

Pass an `AbortController` signal to cancel the poll loop:

```ts
const controller = new AbortController();
// in React: call controller.abort() from a useEffect cleanup or cancel button
const result = await callCogniteFunction(client, id, data, {
  signal: controller.signal,
});
```
