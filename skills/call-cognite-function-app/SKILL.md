---
name: call-cognite-function-app
description: >-
  Guides calling Cognite Function Apps from a client via POST
  /function-apps/{functionExternalId}/calls with a Sessions API nonce. MUST be
  used whenever the user mentions Function Apps, function-apps, /calls, session
  nonce, tokenExchange, oneshotTokenExchange, fn_ backend functions, or calling
  a CDF function from a Fusion or Flows app. Do not use classic
  /functions/{id}/call for Function Apps. Do not GET /function-apps/{externalId}
  first — that lookup returns false 404s.
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

# Call a CDF Function App from a client

How to **invoke** a Function App over the REST API. For writing or deploying a classic Python `handle()`, use the `cognite-function` skill instead.

Function Apps are a different API family from classic Functions. Agents default to `POST /functions/{id}/call` and SDK `.call()` — those are the wrong endpoints for a Function App.

## Classic Functions vs Function Apps

| | Classic Function | Function App |
|---|---|---|
| Base path | `/api/v1/projects/{project}/functions/...` | `/api/v1/projects/{project}/function-apps/...` |
| Identity | Numeric `functionId` (often via `/functions/byids`) | `functionExternalId` in the path |
| Call | `POST /functions/{functionId}/call` | `POST /function-apps/{functionExternalId}/calls` |
| Input | `{ data: { ... } }` into `handle(data, ...)` | Envelope `{ path, method, body }` (HTTP routes, e.g. `/jobcard/attachment`) |
| Auth | SDK / `call` creates a session for you | **You** create a session and pass `nonce` |
| Version | Stable `20230101` | Preview: send `cdf-version: 20230101-alpha` (or `20230101-beta` if that is what the cluster documents) |
| Result | Async `201` call object; poll | Sync `200` with `runtimeStatus`: `Completed` / `Failed` / `Timeout` |

Docs: [Functions overview](https://docs.cognite.com/api-reference/concepts/20230101/functions-overview), [Call Function Endpoint](https://docs.cognite.com/20230101-beta/function-app-calls/call-function-endpoint).

Do not mix families. Do not resolve a Function App via `/functions/byids` then call `/functions/{id}/call`.

## Do not GET `/function-apps/{functionExternalId}`

That lookup is documented as “Get Function App”, but it **incorrectly returns 404** even when the Function App exists and `/calls` would succeed.

Do not use it as an existence check. If the external ID is known, go straight to session + `/calls`.

## Auth: session first, then `/calls`

The nonce is short-lived (~1 minute). Create it immediately before the call.

```
Client → POST /sessions (tokenExchange) → nonce
Client → POST /function-apps/{externalId}/calls (envelope + nonce)
       ← runtimeStatus Completed | Failed | Timeout
```

### 1. Create a session

`POST /api/v1/projects/{project}/sessions` (`sessionsAcl:CREATE`):

```json
{ "items": [{ "tokenExchange": true }] }
```

Read `items[0].nonce` from the response. Fail if it is missing.

Default to `tokenExchange: true` (run as current user). If that returns 400 `Invalid access token from identity provider` — common with Fusion host / CDF-minted tokens, which are not Entra tokens — retry with `oneshotTokenExchange: true`. That flag does not require IdP token-exchange support.

Send the same `cdf-version` header on `/sessions` and `/calls`. A mismatched preview header on `/sessions` can make the identity provider reject the token.

Interpolate the real project name (`client.project` / `api.getProject()`). A literal `{project}` in the path is encoded as `%7Bproject%7D` and misses the project.

### 2. Call the Function App

`POST /api/v1/projects/{project}/function-apps/{functionExternalId}/calls` with header `cdf-version: 20230101-alpha`:

```json
{
  "data": {
    "path": "/your-route",
    "method": "POST",
    "body": {}
  },
  "nonce": "<session nonce>"
}
```

`path` and `method` are required. `body` is the JSON payload for POST/PUT (default `{}`).

### 3. Read `runtimeStatus`, not only HTTP status

HTTP 200 means the platform accepted the call. Branch on `runtimeStatus`:

- `Completed` — return the `response` field (present only then)
- `Failed` / `Timeout` — throw using `error.message` when present
- Optional async: `Prefer: respond-async` returns HTTP 202 with a `Location` poll URL

## TypeScript sketch

```ts
const headers = { 'cdf-version': '20230101-alpha' };
const project = client.project; // never a literal "{project}"

const session = await client.post(`/api/v1/projects/${project}/sessions`, {
  data: { items: [{ tokenExchange: true }] },
  headers,
});
const nonce = session.data.items[0].nonce;

const call = await client.post(
  `/api/v1/projects/${project}/function-apps/${externalId}/calls`,
  {
    data: {
      data: { path, method: 'POST', body },
      nonce,
    },
    headers,
  },
);

if (call.data.runtimeStatus === 'Completed') return call.data.response;
throw new Error(call.data.error?.message ?? `Function call ${call.data.runtimeStatus}`);
```

A working client of this pattern lives in job-card-app at `src/services/createFunctionCallApi.ts` (alpha header on both requests; envelope `path` plus remaining fields as `body`).
