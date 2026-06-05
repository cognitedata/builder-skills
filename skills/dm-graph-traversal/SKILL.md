---
name: dm-graph-traversal
description: CDF Data Modeling query-vs-list expert skill. Use for graph-native reads with instances.query, traversal payload design, failure debugging, pagination/dedupe semantics, and regression-proof tests (including Node.js/TypeScript parity checks).
allowed-tools: Read, Glob, Grep, Edit, Write
---

# DM Graph Traversal

## Outcome

Ship correct, maintainable, graph-native CDF Data Model reads.

This skill turns query/list ambiguity into a deterministic workflow:

1. Decide whether the read is graph-native.
2. Build safe `instances/query` payloads.
3. Validate traversal semantics and cursor behavior.
4. Encode merge/dedupe policy explicitly.
5. Lock behavior with payload-shape tests.

---

## Decision Tree: `instances/query` vs `instances/list`

Use `instances/query` when **any** is true:

- You start from one node type and need related nodes/edges.
- You need reverse relation traversal (`direction`, `through`, `from`).
- You would otherwise do multiple list calls and stitch results client-side.
- You need step-specific pagination and relationship-aware filtering.

Use `instances/list` when **all** are true:

- Single node/edge type lookup.
- No traversal intent.
- Flat filtering is sufficient.

Heuristic:

- "If this read needs graph context, it is a query."

---

## Search-First Entry Pattern

When user intent is discovery/ranking (for example free-text name matching), prefer:

1. `instances.search` to find/rank candidate anchors.
2. `instances.query` to hydrate graph-related details for those anchors.

Why:

- Search APIs are better for ranking and fuzzy discovery.
- Query APIs are better for explicit graph traversal and constrained joins.
- This avoids broad traversal scans when the first step is actually discovery.

---

## Operating Mode (Hard Rule)

- Default to Node.js/TypeScript workflows for parity checks, examples, and validator tooling.
- Use `code/validate-query-parity.cjs` for payload validation in all normal cases.
- Do not introduce Python parity scripts by default in TypeScript repositories.
- Use Python-based validation only if the user explicitly requests Python or no viable Node.js path exists.

---

## Canonical Payload Guardrails

### 1) Step-level limit placement

- Valid: `with.<step>.limit`
- Invalid: `with.<step>.nodes.limit`, `with.<step>.edges.limit`

### 2) `select.sources` requires `properties`

If a step uses `select.<step>.sources`, each source entry includes explicit `properties`.

### 3) Start-step constraints

For node start steps, include:

- space filter (`['node','space']`)
- `hasData` for expected view where relevant

### 4) Versioned traversal refs

In traversal-step filters, use:

- `[space, 'ViewExternalId/version', property]`

### 5) Step cursor loops

Paginate per step with:

- `nextCursor.<step>` -> `cursors: { <step>: ... }`

### 6) Deterministic merge semantics

When combining multi-step outputs:

- dedupe by stable IDs (or business keys)
- define tie-breaks (`explicit > fallback`, `max`, `latest`, etc.)

### 7) Strict-to-broad fallback

Start with strict server-side constraints (`space`, exact filters, scoped predicates).
Only broaden filters when needed, and keep fallback stages explicit and ordered.

---

## Two-Phase Latest Datapoint Rule

When a use case asks for graph relationships plus the latest numeric value, use a two-phase read:

1. Use `instances.query` to traverse and collect the relevant time-series node IDs.
2. Use `datapoints.retrieveLatest` on those IDs in batches.
3. Merge latest values back by stable business key.

Why:

- `instances.query` is best for relationship traversal and filtering.
- `retrieveLatest` is the efficient API for last-value reads.
- Keeping these responsibilities separate avoids over-fetching and expensive fan-out logic.

Efficiency guardrails:

- Query only IDs/properties needed for downstream latest reads.
- Dedupe node IDs before latest retrieval.
- Batch latest calls (for example, max 100 IDs per request).
- Use `ignoreUnknownIds: true` to tolerate stale references.
- Keep aggregation logic deterministic when many series map to one entity.

Reference shape:

```ts
const nodeIds = queryResult.items.ptts.map((n) => ({ instanceId: { space: n.space, externalId: n.externalId } }));
const latest = await client.datapoints.retrieveLatest(nodeIds, { ignoreUnknownIds: true });
```

---

## Failure Signature Playbook

| Error / Symptom | Likely Cause | Fix |
|---|---|---|
| `Unexpected field - nodes.limit` | limit nested under `nodes` | move to `with.<step>.limit` |
| `Unexpected field - edges.limit` | limit nested under `edges` | move to `with.<step>.limit` |
| `properties must not be null` | `sources` without `properties` | add explicit `properties: [...]` |
| Unexpectedly slow latest-value endpoint | trying to read latest values via traversal-only flow | split into `instances.query` + batched `retrieveLatest` |
| Query path intermittently fails with 429/5xx/timeout | missing transient failure handling | add bounded retries with exponential backoff + jitter |
| Traversal step returns empty, no error | non-versioned traversal ref | use `View/version` in property refs |
| `Cannot traverse lists of direct relations inwards.` | inwards traversal through list direct relation | traverse from owning node with `outwards`, or remodel as edge |
| Traversal step empty despite data | missing `hasData` or wrong direction/identifier | add `hasData`; verify `direction` + `through.identifier` |
| First page works, later missing | cursor loop not step-scoped | iterate `nextCursor.<step>` |
| Inflated totals | dedupe policy missing | dedupe and apply explicit tie-break |

---

## Implementation Workflow

1. Model graph intent (start entity, edge, target entity).
2. Name steps semantically (`initiatives`, `featureLinks`, `commitments`, `customerArr`).
3. Apply payload guardrails (limit placement, properties, refs, `hasData`).
4. Implement step cursor loop(s).
5. Map only required fields.
6. Add deterministic join/dedupe logic.
7. Add payload-shape tests.
8. Add bounded retries for transient failures (408/425/429/5xx).
9. (Optional) Cross-check in TypeScript SDK.

---

## Testing Requirements (Required For Merge)

For every critical helper, tests must assert payload shape (not only mapped output):

- `with.<step>.limit` exists
- nested `nodes.limit` / `edges.limit` absent
- each `select.<step>.sources[*].properties` present
- traversal refs are versioned where needed
- `hasData` present on constrained start steps
- unintended fallback to `instances/list` is absent (if query-only design)
- retry behavior exists for transient failures in production paths

Example assertion style:

```ts
const call = (client.instances.query as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
expect(call?.with?.initiatives?.limit).toBe(1000);
expect(call?.with?.initiatives?.nodes?.limit).toBeUndefined();
expect(call?.select?.initiatives?.sources?.[0]?.properties).toContain('title');
```

---

## TypeScript SDK Parity Check (Recommended)

Use the TypeScript SDK to validate query shape and traversal semantics directly in frontend/backend JavaScript tooling:

```ts
const query = {
  with: {
    cycles: {
      nodes: {
        filter: {
          and: [
            { equals: { property: ["node", "space"], value: "product_portfolio" } },
            {
              hasData: [{ type: "view", space: "product_portfolio", externalId: "PortfolioReviewCycle", version: "v1" }]
            }
          ]
        }
      },
      limit: 200
    }
  },
  select: {
    cycles: {
      sources: [
        {
          source: { type: "view", space: "product_portfolio", externalId: "PortfolioReviewCycle", version: "v1" },
          properties: ["key", "displayName", "periodStart", "periodEnd", "status"]
        }
      ]
    }
  }
};

await client.dataModeling.instances.query(query);
```

Parity checks:

- Step names and cursor keys match TS.
- Limit placement and `properties` shape are valid.
- Traversal filters behave as expected.
- Validate any project payload with:
  - `node skills/dm-graph-traversal/code/validate-query-parity.cjs --query <path-to-query.json> --check all --expect pass`
- Validate expected failures (negative tests) with:
  - `node skills/dm-graph-traversal/code/validate-query-parity.cjs --query <path-to-query.json> --check all --expect fail`
- Add `--schema-hints <path-to-schema-hints.json>` when running schema-aware relation checks.
- Check modes:
  - `sources-properties`, `limit-placement`, `start-step-hasdata`, `versioned-traversal-refs`, `cursor-shape`, `inwards-list-direct-relations`, `all`
- For latest-value scenarios, apply the two-phase rule (`instances.query` IDs -> batched `retrieveLatest`) instead of forcing latest reads into traversal payloads.
- Prefer server-side filtering and explicit property lists; avoid wildcard projection (`"*"`).

---

## Anti-patterns To Avoid

1. Broad cross-space retrieval without explicit scope when not required.
2. Wildcard property projection (`properties: ["*"]`) in production query paths.
3. Client-side filtering when equivalent server-side filters exist.
4. Raw HTTP query payload posting when SDK methods provide equivalent behavior and retries.
5. N+1 relation fetch loops when one traversal query can hydrate the same graph.

---

## Done Criteria

- Correct query/list decision documented in PR/code comments.
- Query payload follows all guardrails.
- Merge/dedupe semantics explicit and tested.
- Regression tests cover known failure signatures.
- (High-risk changes) TypeScript SDK parity sanity check completed.

---

## References

- `references/query-vs-list.md`
- `code/validate-query-parity.cjs`
