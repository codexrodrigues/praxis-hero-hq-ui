// Actual service/repository execution with isolated Angular scheduling and browser adapters.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
function compile(relative, imports, globals = {}) {
  const file = path.join(root, relative), exported = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true } }).outputText;
  vm.compileFunction(code, ['exports', 'require', ...Object.keys(globals)], { filename: file })(exported, imports, ...Object.values(globals));
  return exported;
}
const repo = compile('src/app/core/visitor-workspace.repository.ts', () => { throw Error('Unexpected import'); }, { crypto: webcrypto });
const signal = initial => { let value = initial; const read = () => value; read.set = next => { value = next; }; read.asReadonly = () => read; return read; };

test('queued browser saves reject a switched context including A/B/A and preserve current state', async () => {
  await import('@angular/compiler');
  const core = await import('@praxisui/core');
  const authToken = class {};
  let persona = { tenant: 'demo', id: 'a' };
  const revision = signal(0);
  const auth = { currentPersona: () => persona, identityRevision: revision };
  const storage = new Map(), pending = [];
  const registry = { get: id => id === 'fixture-component' ? { component: class {}, ports: [] } : undefined };
  const angular = { Injectable: () => type => type, signal, computed: read => read, effect: () => {}, inject: token => {
    if (token === authToken) return auth;
    if (token === core.ComponentMetadataRegistry) return registry;
    throw Error('Unexpected DI token');
  } };
  const exported = compile('src/app/core/visitor-workspace.service.ts', id => {
    if (id === '@angular/core') return angular;
    if (id === '@praxisui/core') return core;
    if (id.endsWith('auth-simulation.service')) return { AuthSimulationService: authToken };
    if (id.endsWith('visitor-workspace.repository')) return repo;
    throw Error('Unexpected import');
  }, {
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    navigator: { locks: { request: (_, action) => new Promise((resolve, reject) => pending.push(() => Promise.resolve().then(action).then(resolve, reject))) } },
    window: { addEventListener() {} },
  });
  const service = new exported.VisitorWorkspaceService();
  const input = () => ({ id: webcrypto.randomUUID(), title: 'Local page', menuLabel: 'Menu', definition: { widgets: [{ key: 'widget', definition: { id: 'fixture-component' } }] } });
  const stale = service.save(input());
  persona = { tenant: 'demo', id: 'b' }; revision.set(1);
  persona = { tenant: 'demo', id: 'a' }; revision.set(2);
  await pending.shift()();
  await assert.rejects(stale, error => error instanceof repo.VisitorWorkspaceError && error.code === 'conflict');
  assert.equal(storage.size, 0);
  assert.equal(service.workspace().pages.length, 0);
  const current = service.save(input());
  await pending.shift()(); await current;
  assert.equal(storage.size, 1);
  assert.equal(service.workspace().pages.length, 1);
  persona = { tenant: 'demo', id: 'b' }; revision.set(3);
  assert.equal(service.ready(), false);
  assert.equal(service.workspace().pages.length, 0, 'Previous persona pages are hidden before the reload effect');
  service.reload();
  assert.equal(service.ready(), true);
  assert.equal(service.workspace().pages.length, 0);
});
