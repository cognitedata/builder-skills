---
name: flows-troubleshooting
description: >-
  Diagnose and fix common problems developers hit when building, running, or
  deploying Flows custom apps. Use this skill when a user is stuck, gets an
  error, or asks why something isn't working. Covers: trusted certificate
  errors (browser blocks app, HTTPS not trusted, mkcert issues), app won't
  load inside CDF, port-in-use errors, Node.js version problems
  (ERR_REQUIRE_ESM), npm install issues, deployment failures
  (authentication errors, missing secrets, build failures), code-signing
  problems (no signing identity, bundle hash mismatch, KEY_NOT_IN_REGISTRY,
  clock skew), and interactive sign-in issues. Reference docs:
  https://docs.cognite.com/cdf/flows/guides/running-locally,
  https://docs.cognite.com/cdf/flows/guides/deploying,
  https://docs.cognite.com/cdf/flows/guides/code-signing.
allowed-tools: Read, Glob, Grep, Shell, Write
---

# Flows Troubleshooting

Identify the symptom from the user's description, then follow the matching
section below. If multiple issues are possible, work through them in order —
earlier steps often rule out later ones. Always show the user the exact
commands to run and explain what they check.

---

## 1. Certificate errors — app blocked in browser or won't load in CDF

This is the most common issue for first-time local developers. Flows apps run
inside CDF over HTTPS, so the browser requires a valid localhost certificate
from `vite-plugin-mkcert`. If the certificate isn't trusted, the browser
silently blocks the iframe and the app never appears.

### Symptom A — app shows a blank page / spinner inside CDF after `npm start`

The dev server started but the browser hasn't accepted its certificate yet.

**Fix:**
1. Open `https://localhost:3001` directly in the same browser (check `vite.config.ts` for the actual port if it differs).
2. Click **Advanced → Proceed to localhost** (Chrome/Edge) or **Accept the Risk and Continue** (Firefox).
3. You should see your app rendered directly. Return to the CDF tab and refresh — the app should load.

If the browser shows "Your connection is not private" and has no *Proceed* link,
the certificate is flagged as completely untrusted. Delete it and let mkcert
regenerate:

```bash
# From the project root:
rm -rf .vite-plugin-mkcert
npm start
```

Re-enter your system password when prompted — mkcert installs a new root CA into your keychain.

### Symptom B — first `npm start` never prompted for sudo / system password

mkcert needs elevated access once to register the root CA. If that prompt was
dismissed or missed:

```bash
# Force mkcert to re-register the CA (macOS/Linux):
npx mkcert -install
```

On Windows, a UAC dialog appears instead of a terminal password prompt.

### Symptom C — certificate was accepted but app still won't load after refresh

Check the browser console on the CDF page (F12 → Console) for blocked
requests. A common cause is the browser caching the old rejected state.

```bash
# Hard-refresh in Chrome/Edge: Cmd+Shift+R (macOS) / Ctrl+Shift+R (Windows)
```

If the console shows `net::ERR_CERT_AUTHORITY_INVALID`, the fix is the same as
Symptom A — visit the localhost URL directly and accept.

---

## 2. App won't start at all

### Node.js version too old

Flows requires **Node.js ≥ v20.19.0**.

```bash
node --version
```

If the version is below `v20.19.0`, or if you see `ERR_REQUIRE_ESM` (a sign
the module system is incompatible):

```bash
# Install nvm if not present:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
. "$HOME/.nvm/nvm.sh"

# Install and use the required version:
nvm install 20.19.5
nvm use 20.19.5

node --version  # Should print v20.19.x or higher
```

Alternatively with Homebrew: `brew install node@20`.

### Dependencies not installed

```bash
npm install
npm start
```

### Wrong terminal / stale shell

After installing a new Node version, the currently open terminal may still
point at the old binary. Open a fresh terminal tab and verify with
`which node` before retrying.

---

## 3. Port already in use

```
Error: listen EADDRINUSE: address already in use :::3001
```

Find and kill the process occupying the port:

```bash
lsof -i :3001
# Look for the PID in the second column, then:
kill -9 <PID>
```

Or change the port in `vite.config.ts`:

```ts
server: { port: 3002 },
```

The `fusionOpenPlugin` reads the Vite port automatically, so the CDF
development URL updates too.

---

## 4. Deployment failures

### "Deployment secret not found"

The environment variable name in CI/CD doesn't match `deploySecretName` in
`app.json`. Check both:

```bash
# Print the expected name from app.json:
cat app.json | grep deploySecretName

# Verify the variable is exported in the current shell:
echo $MY_APP_SECRET
```

Export the variable with the exact name from `deploySecretName`:

```bash
export MY_APP_SECRET="your-secret-here"
```

### "Failed to authenticate"

- Confirm the **client ID** and **client secret** are correct and not expired.
- The OAuth client needs `apphosting:read` and `apphosting:write` capabilities
  in the CDF project. `apphosting:run` is for end users, not deployers.
- Test authentication interactively first to isolate credential issues:

```bash
npx @cognite/cli@latest apps deploy --interactive
```

### Build fails before deploy

Run the build locally to see the full error output:

```bash
npm run build
```

Fix TypeScript / lint errors before retrying the deploy.

### Interactive sign-in issues

- Make sure pop-ups are **not blocked** in the browser — the CLI opens a
  browser tab for the OAuth flow.
- Pass `--org` explicitly if the org prompt doesn't appear:

```bash
npx @cognite/cli@latest apps deploy --interactive --org your-org
```

---

## 5. Code-signing problems

### No signing identities were found

Generate a key pair first:

```bash
npx @cognite/cli@latest keys generate
```

Then retry the signing command. If you've lost access to a previous key
(e.g., machine change), generate a new one and ask your Cognite contact to
revoke the old key.

### Publish fails with "bundle hash mismatch"

The signed bundle doesn't match what the platform received. Refresh the bundle
then re-sign and re-publish in order:

```bash
npx @cognite/cli@latest apps deploy        # refreshes .cognite-bundles/<id>.zip
npx @cognite/cli@latest apps sign          # signs the refreshed bundle
npx @cognite/cli@latest apps publish .    # submits the new signature
```

### `apps status` shows ❌ KEY_NOT_IN_REGISTRY

The key exists locally but hasn't been added to the platform registry yet.
Confirm with your Cognite contact that the key has been registered, then rerun:

```bash
npx @cognite/cli@latest apps status
```

The verdict flips to `VALID` once the registry catches up — no need to
re-sign or re-publish.

### `apps status` shows ❌ IAT_IN_FUTURE or SIGNED_BEFORE_KEY_ISSUED

The signature timestamp doesn't align with the key's registration window.
This is almost always **clock skew** on the signing machine.

```bash
# macOS: sync system clock
sudo sntp -sS time.apple.com
```

Then re-sign and re-publish:

```bash
npx @cognite/cli@latest apps sign
npx @cognite/cli@latest apps publish .
```

### "Two signatures required"

You're targeting a production CDF project that requires both a developer
signature and an app-certification signature from Cognite. Follow the
[Application certification guide](https://docs.cognite.com/cdf/flows/guides/code-signing)
to submit for review and add the `.cert.sig` file Cognite returns.

---

## 6. Still stuck?

If the issue doesn't match any category above:

1. Check the **browser console** (F12 → Console) and **Vite terminal output**
   for the exact error message and share it.
2. Check the official troubleshooting docs:
   - [Running locally](https://docs.cognite.com/cdf/flows/guides/running-locally)
   - [Deploying](https://docs.cognite.com/cdf/flows/guides/deploying)
   - [Code signing](https://docs.cognite.com/cdf/flows/guides/code-signing)
3. Describe what you tried, the exact error text, your OS, Node version
   (`node --version`), and npm version (`npm --version`).
