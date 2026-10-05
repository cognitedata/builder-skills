import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkConsumer } from './check-consumer.mjs';

const fixture = process.env.TYGEN_FIXTURE_DIR;
const app = process.env.TYGEN_APP_DIR;
if (!fixture || !app) throw new Error('Set TYGEN_FIXTURE_DIR and TYGEN_APP_DIR to validate the consumer checker');
const valid = `
import type { CogniteClient } from '@cognite/sdk';
import { CogniteEquipmentView as view } from './generated/views';
export async function listEquipmentNames(sdk: Pick<CogniteClient, 'instances'>): Promise<string[]> {
  const response = await sdk.instances.list({ instanceType: 'node', sources: [{ source: view }] });
  const names: string[] = [];
  for (const node of response.items) {
    const properties = node.properties?.[view.space]?.[view.externalId + '/' + view.version];
    if (properties && typeof properties.name === 'string') names.push(properties.name);
  }
  return names;
}`;

for (const [name, code, compile, behavior] of [
  ['accepts a guarded native consumer', valid, true, true],
  ['rejects nonexistent generated helpers', valid.replace('sdk.instances.list', 'sdk.queryTyped'), false, false],
  ['rejects incorrect source nesting', valid.replace('sources: [{ source: view }]', 'sources: [view]'), false, false],
  ['rejects missing runtime validation', valid.replace("typeof properties.name === 'string'", "true").replace('names.push(properties.name)', 'names.push(properties.name as string)'), true, false],
  ['rejects incorrect property key', valid.replace("view.externalId + '/' + view.version", 'view.externalId'), true, false],
]) {
  test(name, async () => {
    const folder = await mkdtemp(join(tmpdir(), 'tygen-consumer-check-'));
    try {
      const result = await checkConsumer(code, folder, fixture, app);
      assert.equal(result.compile.passed, compile, result.compile.evidence);
      assert.equal(result.behavior.passed, behavior, result.behavior.evidence);
    } finally { await rm(folder, { recursive: true }); }
  });
}
