---
name: render-smoke-test
description: "MUST be used to prove a Flows app bundle actually renders (no white page) and to decide whether a dependency/toolchain bump requires a screen recording. Runs the shipped deploy bundle in headless Chromium under the App Hosting path prefix and fails on empty #root, dev-shell index.html, 404 chunks, or boot errors. Triggers: white page, white screen, blank page, renders, smoke test, bundle check, package bump, dependency bump, upgrade vite, upgrade react, screen recording, video required."
allowed-tools: Read, Glob, Grep, Bash, Write
metadata:
  argument-hint: "[path to .cognite-bundles/*.zip or an unpacked bundle dir, default: newest zip]"
---

# Render smoke test (shared)

Proves the **shipped bundle** boots. This is the shared definition used by `dependencies-audit` (builder side), `flows-review-checks` (reviewer side) and `flows-external-app-submit`. Do not copy these checks into another skill.

Why it exists: an app shipped a Vite dev `index.html` (`/src/main.tsx`, `@vite/client`). The page loaded, the entry module never ran, `#root` stayed empty and the user saw a white page. No unit test, coverage number or package audit notices that.

## Step 1 — Decide whether this change is a "risky bump"

Compare `package.json` against the last reviewed commit (the SHA under `### Reviewed commit` in the latest `code-review-report.md`), or `origin/main` if there is no earlier review:

```bash
base=$(git log -1 --format=%H origin/main 2>/dev/null)   # or the last reviewed SHA
git diff "$base" -- package.json vite.config.* 
```

It is a **risky bump** (`RISKY=yes`) if any of these changed:

- any entry in `dependencies` (version or added/removed). Lockfile-only transitive churn does not count.
- a **major** version in `devDependencies`
- `vite`, `@vitejs/*`, `react`, `react-dom`, `typescript`, any `@cognite/*` package, or any bundler plugin, at any version
- `vite.config.*` (`base`, `build`, `plugins`)

Patch/minor bumps of lint, type or test-only devDependencies do **not** trigger. Otherwise `RISKY=no`.

## Step 2 — Run the bundle check (always)

```bash
node skills/render-smoke-test/check.mjs [bundle.zip|dir]
```

Needs Playwright with Chromium. If missing: `npx playwright install chromium` and `npm i -D @playwright/test` (devDependency, patch/minor, does not trigger Step 1).

The script unpacks the bundle (default: newest `.cognite-bundles/*.zip`), serves it under `/api/v1/projects/p/apphosting/apps/a/versions/1.0.0/assets/` (the App Hosting shape, so a wrong `base` or doubled `assets/assets` 404s), opens it in headless Chromium, waits for `load` plus 3 s, and fails when:

| Check | Result |
| ----- | ------ |
| `index.html` references `/src/`, `@vite/client`, `localhost:` or `/@react-refresh` | **FAIL (dev shell)** |
| `#root` (or `#app`) has no child elements after the wait | **FAIL (white page)** |
| any same-origin request fails or is not 2xx/3xx | **FAIL (missing chunk / bad base)** |
| uncaught exception or `unhandledrejection` before the wait ends | **FAIL (boot error)** |

It writes `render-proof/screenshot.png` and `render-proof/result.json` and exits non-zero on failure.

**Host handshake.** Apps that wait for the host (`READY_FOR_HANDSHAKE`) may legitimately show only their own "waiting for host" UI. That UI is a child of `#root`, so it passes. A truly empty `#root` fails.

**Not covered.** Environment network failures such as `ERR_HTTP2_PROTOCOL_ERROR` on a chunk. Those are the host's missing-handshake timeout, not an app check.

## Step 3 — Screen recording (only when `RISKY=yes`)

Record 30–60 s of the **built bundle** (not the localhost dev server): the app loading from a cold start, then the main user journey once. Save as `.mp4`, `.mov` or `.webm` (non-empty) and put it in `dist/submit/` (or attach it in the PR for builder work).

When `RISKY=no`, the screenshot from Step 2 is enough.

## Output block (paste into `review-packages.md` and the code review report)

```markdown
### Render proof

- Risky bump: yes | no — <what changed>
- Bundle check: PASS | FAIL — <failing check>  (bundle: <file>, commit: <sha>)
- Screenshot: render-proof/screenshot.png
- Screen recording: <path> | not required | MISSING
```

## Severity (used by `flows-review-checks`)

- Dev-shell `index.html`, empty `#root`, or a failing bundle check: **Must Fix** (1.1 scores 1–2)
- `RISKY=yes` and no passing bundle check, or no recording: **Must Fix**
- `RISKY=no` and the bundle check was never run: **Should Fix**
