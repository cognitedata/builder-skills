import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, copyFile, symlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Compile against the real SDK, then exercise the emitted consumer with a fake
// instances transport. No CDF calls or authentication are needed.
export async function checkConsumer(code, folder, fixtureDirectory, appDirectory) {
  const require = createRequire(resolve(appDirectory, 'package.json'));
  const ts = require('typescript');
  await mkdir(resolve(folder, 'generated'), { recursive: true });
  for (const name of ['types.ts', 'views.ts']) {
    await copyFile(resolve(fixtureDirectory, name), resolve(folder, 'generated', name));
  }
  await symlink(resolve(appDirectory, 'node_modules'), resolve(folder, 'node_modules'), 'dir');
  const sourcePath = resolve(folder, 'consumer.ts');
  await writeFile(sourcePath, code);
  const program = ts.createProgram([sourcePath], {
    strict: true, noEmit: true, skipLibCheck: true, types: [],
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program).map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  const results = { compile: { passed: diagnostics.length === 0, evidence: diagnostics.join('\n') || 'Strict TypeScript compilation passed against the supplied generated files and installed @cognite/sdk.' } };
  if (diagnostics.length) {
    results.behavior = { passed: false, evidence: 'Runtime check not run because compilation failed.' };
    return results;
  }
  const transpile = text => ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const viewsContext = vm.createContext({ exports: {} });
  vm.runInContext(transpile(await readFile(resolve(folder, 'generated/views.ts'), 'utf8')), viewsContext, { timeout: 1000 });
  const view = viewsContext.exports.CogniteEquipmentView;
  const requests = [];
  const properties = value => ({ properties: { [view.space]: { [`${view.externalId}/${view.version}`]: value } } });
  const items = [properties({ name: 'Pump' }), properties({ name: 42 }), properties({ name: null }), properties({}), {}, { properties: { wrong_space: { [`${view.externalId}/${view.version}`]: { name: 'Wrong space' } } } }, { properties: { [view.space]: { [view.externalId]: { name: 'Wrong version' } } } }];
  const context = vm.createContext({
    exports: {},
    require: name => {
      if (['./generated/views', './generated/views.js'].includes(name)) return viewsContext.exports;
      throw new Error(`Unexpected runtime import: ${name}`);
    },
    sdk: { instances: { list: async request => { requests.push(JSON.parse(JSON.stringify(request))); return { items }; } } },
  });
  try {
    vm.runInContext(transpile(code), context, { timeout: 1000 });
    const returned = vm.runInContext('exports.listEquipmentNames(sdk)', context, { timeout: 1000 });
    let timeout;
    const names = await Promise.race([returned, new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Consumer timed out')), 2000); })]).finally(() => clearTimeout(timeout));
    assert.deepEqual(JSON.parse(JSON.stringify(names)), ['Pump']);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].instanceType, 'node');
    assert.deepEqual(requests[0].sources, [{ source: JSON.parse(JSON.stringify(view)) }]);
    results.behavior = { passed: true, evidence: 'One native instances.list call with the generated view source. Returned Pump and skipped non-string, missing, wrong-space and wrong-version properties.' };
  } catch (error) {
    results.behavior = { passed: false, evidence: error.message };
  }
  return results;
}
