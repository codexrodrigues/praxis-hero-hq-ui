// Executes the real, pure repository without Angular or browser storage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID, webcrypto } = require('node:crypto');
const { test } = require('node:test');
const ts = require('typescript');

const file = path.resolve(__dirname, '../src/app/core/visitor-workspace.repository.ts');
const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const exported = {};
// Same realm keeps the document's normal Object prototype while still executing the source module.
vm.compileFunction(compiled, ['exports', 'crypto'], { filename: file })(exported, webcrypto);
const { VisitorWorkspaceRepository, VisitorWorkspaceError, visitorWorkspaceKey, visitorPagePath } = exported;
const OWNER = JSON.stringify(['visitor', 'explorer']);

class MemoryStorage {
  values = new Map();
  writes = 0;
  failGet = false;
  failSet = false;
  getItem(key) {
    if (this.failGet) throw new Error('SECRET raw storage detail');
    return this.values.get(key) ?? null;
  }
  setItem(key, value) {
    if (this.failSet) throw new Error('SECRET quota detail');
    this.values.set(key, value);
    this.writes++;
  }
}

function queueLock() {
  const pending = new Map();
  return (name, action) => {
    const next = (pending.get(name) ?? Promise.resolve()).then(action);
    pending.set(name, next.catch(() => {}));
    return next;
  };
}

// Core owns the actual schema. This fixture proves the repository calls its validator.
function validatePage(page) {
  assert.equal(page.version, 1);
  assert.ok(Array.isArray(page.widgets));
  assert.ok(page.widgets.every(widget => widget && typeof widget.type === 'string'));
}

function setup() {
  const storage = new MemoryStorage();
  const lock = queueLock();
  const repository = new VisitorWorkspaceRepository(storage, lock, validatePage);
  return { storage, lock, repository };
}

function input(overrides = {}) {
  return {
    id: randomUUID(), title: 'Minha página',
    definition: { version: 1, widgets: [{ type: 'test-widget', value: 'original' }] },
    menuLabel: 'Meu menu', ...overrides,
  };
}

function hasCode(code) {
  return error => {
    assert.ok(error instanceof VisitorWorkspaceError);
    assert.equal(error.code, code);
    assert.ok(!error.message.includes('SECRET'));
    return true;
  };
}

function assertIntegrity(workspace) {
  const ids = new Set(workspace.pages.map(page => page.id));
  assert.equal(ids.size, workspace.pages.length);
  for (const menu of workspace.menus) {
    assert.equal(new Set(menu.items.map(item => item.pageId)).size, menu.items.length);
    assert.ok(menu.items.every(item => ids.has(item.pageId)));
  }
}

test('save publishes page and menu reference atomically and survives a new instance', async () => {
  const { repository, storage, lock } = setup();
  assert.deepEqual(repository.read(OWNER), { version: 1, pages: [], menus: [] });
  const request = input({ title: '  Página salva  ', menuLabel: '  Meu menu  ' });
  const saved = await repository.savePage(OWNER, request);
  assert.equal(storage.writes, 1);
  assert.equal(saved.pages[0].title, 'Página salva');
  assert.equal(saved.menus[0].label, 'Meu menu');
  assert.deepEqual(saved.menus[0].items, [{ pageId: request.id, label: 'Página salva', icon: 'web' }]);
  assert.ok(Number.isFinite(Date.parse(saved.pages[0].createdAt)));
  assert.equal(visitorPagePath(request.id), `/laboratorio/paginas/${request.id}`);
  const reloaded = new VisitorWorkspaceRepository(storage, lock, validatePage).read(OWNER);
  assert.deepEqual(reloaded, saved);
  saved.pages[0].title = 'External mutation';
  assert.equal(repository.read(OWNER).pages[0].title, 'Página salva');
});

test('stable retries keep the original identity, date and single reference', async () => {
  const { repository, storage } = setup();
  const request = input();
  const saved = await repository.savePage(OWNER, request);
  const retry = { ...request, definition: { widgets: request.definition.widgets, version: 1 } };
  assert.deepEqual(await repository.savePage(OWNER, retry), saved);
  assert.equal(storage.writes, 1);
  await repository.removeMenu(OWNER, saved.menus[0].id);
  const reconciled = await repository.savePage(OWNER, request);
  assert.equal(reconciled.pages.length, 1);
  assert.equal(reconciled.pages[0].createdAt, saved.pages[0].createdAt);
  assert.equal(reconciled.menus[0].items.length, 1);
  assertIntegrity(reconciled);
});

test('retry with a conflicting title or document cannot overwrite its stable ID', async () => {
  const { repository, storage } = setup();
  const request = input();
  const saved = await repository.savePage(OWNER, request);
  for (const conflicting of [
    { ...request, title: 'Outra página' },
    { ...request, definition: { version: 1, widgets: [] } },
  ]) await assert.rejects(repository.savePage(OWNER, conflicting), hasCode('conflict'));
  assert.equal(storage.writes, 1);
  assert.deepEqual(repository.read(OWNER), saved);
});

test('separate stale tabs read the latest state inside the shared exclusive lock', async () => {
  const { repository, storage, lock } = setup();
  const otherTab = new VisitorWorkspaceRepository(storage, lock, validatePage);
  repository.read(OWNER);
  otherTab.read(OWNER);
  const one = input();
  const two = input({ title: 'Segunda página' });
  await Promise.all([repository.savePage(OWNER, one), otherTab.savePage(OWNER, two)]);
  const saved = repository.read(OWNER);
  assert.equal(saved.pages.length, 2);
  assert.equal(saved.menus.length, 1);
  assert.deepEqual(new Set(saved.menus[0].items.map(item => item.pageId)), new Set([one.id, two.id]));
  assertIntegrity(saved);
});

test('a save snapshots the document before it waits for another tab', async () => {
  const { repository, lock } = setup();
  let release;
  const barrier = new Promise(resolve => { release = resolve; });
  const holding = lock(visitorWorkspaceKey(OWNER), () => barrier);
  const request = input();
  const saving = repository.savePage(OWNER, request);
  request.definition.widgets[0].value = 'changed during lock';
  request.title = 'changed title';
  release();
  await holding;
  const saved = await saving;
  assert.equal(saved.pages[0].definition.widgets[0].value, 'original');
  assert.equal(saved.pages[0].title, 'Minha página');
});

test('all malformed persisted envelopes fail closed and cannot be overwritten by a mutation', async () => {
  const { repository, storage } = setup();
  const saved = await repository.savePage(OWNER, input());
  const variants = [
    () => null,
    page => ({ ...page, version: 2 }),
    page => ({ ...page, pages: [page.pages[0], page.pages[0]] }),
    page => ({ ...page, menus: [page.menus[0], page.menus[0]] }),
    page => { page.pages[0].title = 123; return page; },
    page => { page.pages[0].createdAt = 'yesterday'; return page; },
    page => { page.pages[0].definition = { version: 2 }; return page; },
    page => { page.menus[0].items[0].pageId = randomUUID(); return page; },
    page => { page.menus[0].items.push(page.menus[0].items[0]); return page; },
    page => { page.menus[0].items[0].path = 'https://external.test'; return page; },
    page => { page.menus[0].id = '../outside'; return page; },
    page => { page.menus[0].items[0].label = []; return page; },
  ];
  for (const variant of variants) {
    const raw = JSON.stringify(variant(structuredClone(saved)));
    storage.values.set(visitorWorkspaceKey(OWNER), raw);
    assert.throws(() => repository.read(OWNER), hasCode('corrupt'));
    await assert.rejects(repository.removePage(OWNER, saved.pages[0].id), hasCode('corrupt'));
    assert.equal(storage.values.get(visitorWorkspaceKey(OWNER)), raw);
  }
  storage.values.set(visitorWorkspaceKey(OWNER), '{broken json');
  assert.throws(() => repository.read(OWNER), hasCode('corrupt'));
});

test('storage quota/read/lock failures expose safe errors and retain the last committed state', async () => {
  const { repository, storage } = setup();
  const saved = await repository.savePage(OWNER, input());
  const before = storage.values.get(visitorWorkspaceKey(OWNER));
  storage.failSet = true;
  await assert.rejects(repository.savePage(OWNER, input()), hasCode('storage'));
  await assert.rejects(repository.renameMenu(OWNER, saved.menus[0].id, 'Renamed'), hasCode('storage'));
  assert.equal(storage.values.get(visitorWorkspaceKey(OWNER)), before);
  storage.failSet = false;
  assert.deepEqual(repository.read(OWNER), saved);
  storage.failGet = true;
  assert.throws(() => repository.read(OWNER), hasCode('storage'));
  storage.failGet = false;
  const deniedLock = new VisitorWorkspaceRepository(storage, async () => { throw new Error('SECRET lock'); }, validatePage);
  await assert.rejects(deniedLock.savePage(OWNER, input()), hasCode('storage'));
});

test('menus can be renamed, linked and removed while pages remain recoverable', async () => {
  const { repository } = setup();
  const one = input();
  const two = input({ title: 'Second', menuLabel: 'Segundo menu' });
  await repository.savePage(OWNER, one);
  let state = await repository.savePage(OWNER, two);
  const [firstMenu, secondMenu] = state.menus;
  state = await repository.renameMenu(OWNER, firstMenu.id, '  Favoritos  ');
  assert.equal(state.menus[0].label, 'Favoritos');
  await assert.rejects(repository.renameMenu(OWNER, secondMenu.id, 'Favoritos'), hasCode('conflict'));
  await repository.linkPage(OWNER, one.id, secondMenu.id, 'Atalho');
  state = await repository.linkPage(OWNER, one.id, secondMenu.id, 'Novo atalho');
  assert.equal(state.menus[1].items.length, 2);
  assert.equal(state.menus[1].items.find(item => item.pageId === one.id).label, 'Novo atalho');
  await assert.rejects(repository.linkPage(OWNER, randomUUID(), secondMenu.id, 'Missing'), hasCode('invalid'));
  await assert.rejects(repository.linkPage(OWNER, one.id, randomUUID(), 'Missing'), hasCode('invalid'));
  state = await repository.removeMenu(OWNER, firstMenu.id);
  assert.equal(state.pages.length, 2);
  assert.equal(state.menus.length, 1);
  state = await repository.removePage(OWNER, one.id);
  assert.equal(state.pages.length, 1);
  assert.ok(state.menus.every(menu => menu.items.every(item => item.pageId !== one.id)));
  assertIntegrity(state);
});

test('owner keys isolate local personas and paths only accept saved UUID4 identities', async () => {
  const { repository } = setup();
  const other = JSON.stringify(['visitor:explorer', 'other']);
  await repository.savePage(OWNER, input());
  assert.deepEqual(repository.read(other), { version: 1, pages: [], menus: [] });
  await repository.savePage(other, input({ title: 'Other owner' }));
  assert.equal(repository.read(OWNER).pages[0].title, 'Minha página');
  assert.equal(repository.read(other).pages[0].title, 'Other owner');
  assert.notEqual(visitorWorkspaceKey('a:b'), visitorWorkspaceKey('a%3Ab'));
  for (const bad of ['https://evil.test', '../outside', '', randomUUID().replace(/-4/, '-1')]) {
    assert.throws(() => visitorPagePath(bad), hasCode('invalid'));
  }
  assert.throws(() => repository.read(''), hasCode('invalid'));
});

test('input validation and explicit volume/size limits do not leave partial writes', async () => {
  const { repository, storage } = setup();
  const cyclic = { version: 1, widgets: [] };
  cyclic.self = cyclic;
  for (const bad of [
    input({ id: '../outside' }), input({ title: ' ' }), input({ title: 'x'.repeat(81) }),
    input({ menuLabel: 'x'.repeat(61) }), input({ definition: {} }),
    input({ definition: { version: 1, widgets: [], invalidArray: [undefined] } }), input({ definition: cyclic }),
  ]) await assert.rejects(repository.savePage(OWNER, bad), hasCode('invalid'));
  assert.equal(storage.writes, 0);
  await assert.rejects(repository.savePage(OWNER, input({ definition: { version: 1, widgets: [], huge: 'x'.repeat(1024 * 1024) } })), hasCode('limit'));
  assert.equal(storage.writes, 0);
  for (let index = 0; index < 30; index++) await repository.savePage(OWNER, input({ title: `Page ${index}` }));
  const before = storage.values.get(visitorWorkspaceKey(OWNER));
  await assert.rejects(repository.savePage(OWNER, input()), hasCode('limit'));
  assert.equal(storage.values.get(visitorWorkspaceKey(OWNER)), before);
  const other = setup();
  for (let index = 0; index < 20; index++) await other.repository.savePage(OWNER, input({ menuLabel: `Menu ${index}` }));
  const beforeMenus = other.storage.values.get(visitorWorkspaceKey(OWNER));
  await assert.rejects(other.repository.savePage(OWNER, input({ menuLabel: 'Overflow' })), hasCode('limit'));
  assert.equal(other.storage.values.get(visitorWorkspaceKey(OWNER)), beforeMenus);
});

// Canonical child editors materialize optional page keys as undefined before save.
test('optional undefined object properties are omitted while sparse arrays remain invalid', async () => {
  const { repository } = setup();
  const request = input(); request.definition.grouping = undefined;
  request.definition.widgets[0].optional = undefined;
  const saved = await repository.savePage(OWNER, request);
  assert.equal(Object.hasOwn(saved.pages[0].definition, 'grouping'), false);
  assert.equal(Object.hasOwn(saved.pages[0].definition.widgets[0], 'optional'), false);
  await assert.rejects(repository.savePage(OWNER, input({ definition: { version: 1, widgets: new Array(1) } })), hasCode('invalid'));
});

test('menu icons round-trip, reject markup and preserve older saved pages', async () => {
  const { repository, storage } = setup();
  const request = input({ menuIcon: 'assignment' });
  const saved = await repository.savePage(OWNER, request);
  assert.equal(saved.menus[0].items[0].icon, 'assignment');
  await repository.savePage(OWNER, { ...request, menuIcon: 'groups' });
  assert.equal(repository.read(OWNER).menus[0].items[0].icon, 'groups');
  assert.equal(repository.read(OWNER).pages.length, 1);
  const before = storage.getItem(visitorWorkspaceKey(OWNER));
  await assert.rejects(repository.savePage(OWNER, { ...request, menuIcon: '<svg/onload=alert(1)>' }), hasCode('invalid'));
  assert.equal(storage.getItem(visitorWorkspaceKey(OWNER)), before);
  const legacy = JSON.parse(before);
  delete legacy.menus[0].items[0].icon;
  storage.setItem(visitorWorkspaceKey(OWNER), JSON.stringify(legacy));
  assert.equal(repository.read(OWNER).pages[0].id, request.id);
  assert.equal(repository.read(OWNER).menus[0].items[0].icon, undefined);
  const migrated = await repository.migrate(OWNER);
  assert.equal(migrated.menus[0].items[0].icon, 'web');
  assert.equal(repository.read(OWNER).menus[0].items[0].icon, 'web');
});

test('renaming a saved page preserves its UUID, URL and definition while allowing duplicate titles across distinct pages', async () => {
  const { repository } = setup();
  const first = input({ title: 'Mesmo título', menuLabel: 'Menu A' });
  const second = input({ title: 'Mesmo título', menuLabel: 'Menu B' });
  await repository.savePage(OWNER, first);
  let state = await repository.savePage(OWNER, second);
  assert.notEqual(state.pages[0].id, state.pages[1].id);
  assert.equal(visitorPagePath(first.id), `/laboratorio/paginas/${first.id}`);
  await repository.linkPage(OWNER, first.id, state.menus[1].id, 'Atalho customizado');
  state = await repository.renamePage(OWNER, first.id, '  Título renomeado  ');
  const renamed = state.pages.find(page => page.id === first.id);
  assert.equal(renamed.title, 'Título renomeado');
  assert.equal(visitorPagePath(renamed.id), `/laboratorio/paginas/${first.id}`);
  assert.deepEqual(renamed.definition, first.definition);
  assert.equal(state.menus[0].items.find(item => item.pageId === first.id).label, 'Título renomeado');
  assert.equal(state.menus[1].items.find(item => item.pageId === first.id).label, 'Atalho customizado');
  await assert.rejects(repository.renamePage(OWNER, randomUUID(), 'Inexistente'), hasCode('invalid'));
});
