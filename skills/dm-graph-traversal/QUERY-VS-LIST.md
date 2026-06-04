# Query vs List

Canonical guidance lives in `references/query-vs-list.md`.

Quick rule:

- If the read needs relationship traversal or graph context, use `instances/query`.
- If the read is truly flat with no traversal, use `instances/list`.

Keep this file as a discoverable entry point for teams already linking this path.
