# dm-graph-traversal

This folder contains the canonical `dm-graph-traversal` skill.

## Authoritative files

- `SKILL.md` - skill frontmatter and instruction body.
- `evals/evals.json` - canonical eval set for skill-creator workflows.
- `code/validate-query-parity.cjs` - reusable Node validator for CDF `instances.query` payload checks.

## Contributor notes

- Treat `evals/evals.json` as the single source of truth for eval prompts and expectations.
- Keep `SKILL.md` aligned with skill-creator frontmatter requirements.
- Keep `references/` for deeper supporting material and leave `SKILL.md` focused on operational guidance.
- To validate any payload: `node skills/dm-graph-traversal/code/validate-query-parity.cjs --query <path-to-query.json> --check all --expect pass`
- To validate an expected failure: `node skills/dm-graph-traversal/code/validate-query-parity.cjs --query <path-to-query.json> --check all --expect fail`
- For schema-aware relation checks, pass hints: `--schema-hints <path-to-schema-hints.json>`.
- Available checks: `sources-properties`, `limit-placement`, `start-step-hasdata`, `versioned-traversal-refs`, `cursor-shape`, `inwards-list-direct-relations`, `all`.
- Example fixtures are in `code/examples/` (including fail/pass variants for common `properties must not be null`, missing `hasData`, non-versioned traversal refs, cursor request-shape issues, and inwards list direct relation traversal errors).

