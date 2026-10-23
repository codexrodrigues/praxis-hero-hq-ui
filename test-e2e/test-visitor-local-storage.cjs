// Executes the host's actual scoped storage implementation with isolated DI/storage.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const file = path.resolve(__dirname, '../src/app/pages/visitor-lab/visitor-local-config-storage.ts');
const tokens = Object.fromEntries(['DestroyRef','ActivatedRoute','VisitorWorkspaceService','LocalStorageConfigService','LocalStorageAsyncAdapter','FilterConfigService','FormLayoutService','LocalConnectionStorage','ASYNC_CONFIG_STORAGE','CONFIG_STORAGE','CONNECTION_STORAGE','SettingsPanelService'].map(key => [key, class {}]));
let owner = 'persona-a', revision = 0, route = 'page-a', destroy, blocked = false;
const values = new Map();
class VisitorWorkspaceError extends Error { constructor(code, message) { super(message); this.code = code; } }
const exported = {};
vm.compileFunction(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true } }).outputText,
['exports','require','localStorage'], { filename: file })(exported, (id) => {
  if (id === '@angular/core') return { ...tokens, Injectable: () => type => type, inject: token => {
    if (token === tokens.VisitorWorkspaceService) return { owner: () => owner, revision: () => revision };
    if (token === tokens.ActivatedRoute) return { snapshot: { paramMap: { get: () => route } } };
    if (token === tokens.DestroyRef) return { onDestroy: callback => { destroy = callback; } };
    throw new Error('Unexpected injection');
  } };
  if (id.endsWith('visitor-workspace.repository')) return { VisitorWorkspaceError };
  if (id === '@praxisui/settings-panel') return { ...tokens, providePraxisSettingsPanelBridge: () => [{ provide: 'scoped-settings-bridge', useFactory: true }] };
  return tokens;
}, { getItem: key => { if (blocked) throw Error('secret'); return values.get(key) ?? null; }, setItem: (key, value) => { if (blocked) throw Error('secret'); values.set(key, value); }, removeItem: key => { if (blocked) throw Error('secret'); values.delete(key); } });
const { VisitorLocalStorage, visitorLocalStorageProviders } = exported;
const code = expected => error => error instanceof VisitorWorkspaceError && error.code === expected;
test('preferences are isolated by route and owner', () => {
  const a = new VisitorLocalStorage(); a.saveConfig('same', { value: 1 });
  route = 'page-b'; const b = new VisitorLocalStorage(); assert.equal(b.loadConfig('same'), null);
  b.saveConfig('same', { value: 2 }); assert.deepEqual(a.loadConfig('same'), { value: 1 });
  owner = 'persona-b'; revision++; const c = new VisitorLocalStorage(); assert.equal(c.loadConfig('same'), null);
});
test('closed, switched and A/B/A editors cannot read or write preferences', () => {
  owner = 'persona-a'; revision++; const a = new VisitorLocalStorage();
  owner = 'persona-b'; revision++; owner = 'persona-a'; revision++;
  assert.throws(() => a.saveConfig('late', {}), code('conflict'));
  assert.equal(a.trySaveConfig('late', {}), false);
  const current = new VisitorLocalStorage(); destroy();
  assert.throws(() => current.loadConfig('same'), code('conflict'));
  assert.equal(current.tryClearConfig('same'), false);
});
test('quota, corruption and reentrant serialization never report success', () => {
  const a = new VisitorLocalStorage(); a.saveConfig('safe', { value: 3 });
  blocked = true; assert.equal(a.trySaveConfig('safe', { value: 4 }), false); blocked = false;
  assert.deepEqual(a.loadConfig('safe'), { value: 3 });
  const key = [...values.keys()].find(key => key.endsWith(':safe'));
  values.set(key, '{'); assert.throws(() => a.loadConfig('safe'), code('corrupt'));
  assert.throws(() => a.saveConfig('late', { toJSON() { revision++; return {}; } }), code('conflict'));
  assert.equal([...values.keys()].some(key => key.endsWith(':late')), false);
});
test('all reachable persistence facades resolve within the local editor', () => {
  assert.ok(visitorLocalStorageProviders.some(provider => provider.provide === 'scoped-settings-bridge'));
  for (const token of [tokens.SettingsPanelService,tokens.FilterConfigService,tokens.FormLayoutService,tokens.LocalConnectionStorage,tokens.LocalStorageAsyncAdapter]) assert.ok(visitorLocalStorageProviders.includes(token));
  for (const token of [tokens.CONFIG_STORAGE,tokens.LocalStorageConfigService]) assert.equal(visitorLocalStorageProviders.find(provider => provider.provide === token).useExisting, VisitorLocalStorage);
  assert.equal(visitorLocalStorageProviders.find(provider => provider.provide === tokens.ASYNC_CONFIG_STORAGE).useExisting, tokens.LocalStorageAsyncAdapter);
  assert.equal(visitorLocalStorageProviders.find(provider => provider.provide === tokens.CONNECTION_STORAGE).useExisting, tokens.LocalConnectionStorage);
});
