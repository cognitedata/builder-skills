import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const runner = fileURLToPath(new URL('./run-local.mjs', import.meta.url));
// Fake provider tests the adapter only. These are not model-evaluation results.
const fake = `
let prompt = '';
for await (const chunk of process.stdin) prompt += chunk;
const match = prompt.match(/Expectations:\\n(.*)\\nUser prompt:/);
if (!match && prompt.includes('Response requires COGNITE_ALPHA_ENABLE_TYGEN')) throw new Error('Assertion leaked to executor');
const result = match ? JSON.stringify({
  expectations: JSON.parse(match[1]).map(text => ({text, passed: process.env.TEST_MODE !== 'fail', evidence: 'Synthetic unit-test evidence'})),
  timing: null, execution_metrics: null, user_notes_summary: null
}) : 'Synthetic unit-test response';
console.log(JSON.stringify({ result, is_error: process.env.TEST_MODE === 'error', usage: { input_tokens: 10, output_tokens: 5 } }));
`;

for (const mode of ['pass', 'fail', 'error']) {
  test(`runner handles ${mode} without leaking assertions`, async () => {
    const folder = await mkdtemp(join(tmpdir(), 'tygen-runner-test-'));
    try {
      const provider = join(folder, 'fake.mjs');
      await writeFile(provider, fake);
      const output = join(folder, 'results');
      const env = { ...process.env, EVAL_IDS: '1', TEST_MODE: mode, CLAUDE_COMMAND: JSON.stringify([process.execPath, provider]) };
      let exitCode = 0;
      try { await exec(process.execPath, [runner, output], { env }); }
      catch (error) { exitCode = error.code; }
      assert.equal(exitCode, mode === 'pass' ? 0 : 1);
      if (mode !== 'error') {
        const grading = JSON.parse(await readFile(join(output, 'eval-1/with_skill/run-1/grading.json'), 'utf8'));
        assert.equal(grading.summary.pass_rate, mode === 'pass' ? 1 : 0);
        assert.equal(grading.timing.total_tokens, 15);
        assert.equal(grading.execution_metrics.total_tool_calls, 0);
      }
      await assert.rejects(exec(process.execPath, [runner, output], { env }), /EEXIST/);
    } finally { await rm(folder, { recursive: true }); }
  });
}
