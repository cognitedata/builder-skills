---
name: wysiwyg-editor
description: >-
  Adds a TipTap WYSIWYG rich-text editor with inline images stored as CogniteFile
  instances, CDF uploadlink/downloadlink, Flows manifest.json img-src, and TipTap
  markup/UX pitfalls. MUST be used when adding TipTap, WYSIWYG, rich text,
  insert image, CogniteFile inline images, downloadlink, uploadlink, or
  manifest.json img-src in a Flows/CDF app.
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

# Integrate WYSIWYG editor with CDF images

MUST be used whenever adding a TipTap/WYSIWYG editor that can insert images into a Flows or CDF-hosted app. Do not invent a markdown pipeline or put signed file URLs in stored HTML.

Persist **HTML**. TipTap is HTML-native; do not add `@tiptap/markdown`.

## Step 1 — TipTap stack

Install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`. Add other extensions only if they are **not** already in StarterKit (Placeholder, Table, TextStyle/Color as needed).

**TipTap v3 StarterKit already includes Link and Underline.** Configure them on the kit. Adding those packages again logs `Duplicate extension names found: ['link', 'underline']`.

```ts
StarterKit.configure({ link: { openOnClick: false } })
```

Image: extend Image with a React NodeView. Stored HTML may use `cdf-file://{space}/{externalId}` on `<img src>`. **Never put that scheme on a live `<img src>`.** TipTap parses content with `innerHTML`, which fetches every src and violates Flows `img-src` (only `'self' data: blob: https://<cluster>.cognitedata.com`). Detach to `data-cdf-file` + empty `src` before `setContent`; the NodeView renders only `https:` / `blob:` / `data:` URLs. Never persist signed download URLs.

Helpers (pure, NodeRef-only — no view ids):

- `toCdfFileSrc` / `parseCdfFileSrc` / `collectCdfFileRefs` / `nodeRefKey` (`space/externalId`)
- On save, derive the image-ref list from remaining `cdf-file://` srcs in the HTML

## Step 2 — Upload and download

Do not call the Files API from components. Inject a file-content service:

- `getUploadUrl(ref)` → `POST /files/uploadlink` with `{ items: [{ instanceId: ref }] }`
- `uploadBytes(url, body, mimeType)` → `PUT` with `Content-Type` = mime
- `getDownloadUrl(ref)` → `POST /files/downloadlink` with `{ items: [{ instanceId: ref }] }`

Upload flow:

1. Upsert a CogniteFile **node** (view injected — see Step 3).
2. `getUploadUrl` then `uploadBytes`.
3. Insert `<img src="cdf-file://…">`. Reject non-`image/*` and files over 10 MB.

Download flow: a hook maps refs → download URLs (`staleTime` under the ~30 min link lifetime). The NodeView looks up `urlMap[nodeRefKey(ref)]`.

Two independent failures if you skip either:

1. **Azure SAS 403** — Fusion sends `Referer`. Use `<img referrerPolicy="no-referrer">`.
2. **Flows CSP** — signed image hosts are blocked unless `manifest.json` allows `img-src`. Use the **app’s** CDF cluster, not a copied host. Example for `westeurope-1`:

```json
{
  "manifestVersion": 1,
  "permissions": {
    "network": [
      {
        "sources": [
          "https://westeurope-1.cognitedata.com"
        ],
        "directives": [
          "img-src"
        ]
      }
    ]
  }
}
```

Replace the host with this project’s cluster (`https://<cluster>.cognitedata.com`). `referrerPolicy` and `img-src` are both required.

## Step 3 — CogniteFile view is injected

Interface + class. The upload service receives `ViewRef` and instance space in its constructor. Never hardcode `cdf_cdm` / `CogniteFile` / `v1` in the editor, HTML helpers, or markup.

Never import the concrete CDF class outside its own file. Wire it through React context.

Parent record: HTML string + list of image `NodeRef`s derived from the HTML on save. Do not couple storage to a specific parent view name.

## Step 4 — Markup and UX (required, not polish)

Tailwind preflight zeroes heading size/weight and `ul`/`ol` markers. `prose` does nothing unless `@tailwindcss/typography` is installed — prefer scoped `.tiptap` CSS instead of adding that plugin.

Must include:

- `h1` / `h2` larger than body (`font-size` + `font-weight`; preflight uses `inherit`)
- `ul` `disc`, `ol` `decimal`, padding, `li { display: list-item }`, nested indent
- `blockquote` left border + padding
- `pre` / `code` monospace well; `a` color + underline
- Toolbar idle hover: fill/ring distinct from the toolbar. `hover:bg-muted` on `--bg-input` is invisible.
- **Code:** non-empty selection and not in a code block → `toggleCode()`; otherwise `toggleCodeBlock()`.
- **Link:** capture `{ from, to }` **before** `window.prompt` (the prompt blurs the editor and `setLink` is a no-op). Empty range → insert the URL as linked text. Prefix `https://` when there is no scheme.
- **Save:** if the editor is tall, put Save next to Cancel under the editor as well as any footer bar; same handler; disable when not dirty / not persistable.

## Step 5 — Tests and docs

Tests first:

- HTML src parse / rewrite / collect
- Link apply (empty vs range, `https://` prefix)
- Code toggle (selection vs block)
- File service: uploadlink/downloadlink request path and body; error when URL missing

If the host app has `SPEC.md` / `CHANGELOG.md`, update them for user-visible editor behavior.
