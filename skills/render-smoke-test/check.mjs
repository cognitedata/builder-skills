#!/usr/bin/env node
// Render smoke test: serve the shipped bundle under the App Hosting prefix and fail on a white page.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync, mkdtempSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, extname, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const PREFIX = '/api/v1/projects/p/apphosting/apps/a/versions/1.0.0/assets/';
const WAIT_MS = 3000;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.wasm': 'application/wasm' };

function newestZip() {
  const dir = '.cognite-bundles';
  if (!existsSync(dir)) return null;
  const zips = readdirSync(dir).filter((f) => f.endsWith('.zip')).map((f) => join(dir, f));
  return zips.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0] ?? null;
}

const arg = process.argv[2] ?? newestZip();
if (!arg || !existsSync(arg)) { console.error('No bundle found. Pass a .zip or directory, or run `apps deploy` first.'); process.exit(2); }

let root = resolve(arg);
if (statSync(root).isFile()) {
  const out = mkdtempSync(join(tmpdir(), 'render-smoke-'));
  execFileSync('unzip', ['-q', root, '-d', out]);
  root = out;
}
// Bundles may nest everything in one folder.
if (!existsSync(join(root, 'index.html'))) {
  const sub = readdirSync(root).find((d) => existsSync(join(root, d, 'index.html')));
  if (sub) root = join(root, sub);
}
if (!existsSync(join(root, 'index.html'))) { console.error('FAIL: no index.html in bundle'); process.exit(1); }

const failures = [];
const html = readFileSync(join(root, 'index.html'), 'utf8');
for (const needle of ['/src/', '@vite/client', '@react-refresh', 'localhost:']) {
  if (html.includes(needle)) failures.push(`dev shell: index.html references "${needle}"`);
}

const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? '').split('?')[0]);
  if (!path.startsWith(PREFIX)) { res.writeHead(404).end(); return; }
  const rel = path.slice(PREFIX.length) || 'index.html';
  const file = resolve(root, rel);
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const { chromium } = await import('playwright').catch(() => import('@playwright/test'));
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => failures.push(`boot error: ${e.message}`));
page.on('response', (r) => { if (r.url().startsWith(origin) && r.status() >= 400) failures.push(`${r.status()} ${r.url().replace(origin, '')}`); });
page.on('requestfailed', (r) => { if (r.url().startsWith(origin)) failures.push(`request failed ${r.url().replace(origin, '')}: ${r.failure()?.errorText}`); });

await page.goto(origin + PREFIX, { waitUntil: 'load' });
await page.waitForTimeout(WAIT_MS);
const children = await page.evaluate(() => (document.querySelector('#root') ?? document.querySelector('#app'))?.childElementCount ?? -1);
if (children < 1) failures.push(children === -1 ? 'white page: no #root/#app element' : 'white page: #root has no children after load');

mkdirSync('render-proof', { recursive: true });
await page.screenshot({ path: 'render-proof/screenshot.png' });
writeFileSync('render-proof/result.json', JSON.stringify({ bundle: arg, ok: failures.length === 0, failures }, null, 2));
await browser.close();
server.close();

if (failures.length) { console.error('FAIL\n- ' + failures.join('\n- ')); process.exit(1); }
console.log('PASS: bundle rendered (screenshot: render-proof/screenshot.png)');
