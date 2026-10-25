// Offline tests of the real host model/service/controller, with Angular/SDK transport doubles.
// No browser, backend, authentication credential or publication evidence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
function load(file, dependencies = {}) {
  const result = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', result.outputText)(name => dependencies[name] ?? {}, module, module.exports);
  return module.exports;
}
const model = load('src/app/core/corporate-navigation.model.ts');
const group = n => ({ id: id(n), label: `Grupo ${n}`, icon: 'home', type: 'group', children: null });
const item = n => ({ id: `${id(n)}:${id(n + 100)}`, label: `Página ${n}`, icon: 'home', type: 'page', route: `/pages/${id(n)}`, children: [] });
const page = { kind: 'praxis.dynamic-page.editor', version: 1, config: { definition: { widgets: [] }, presentation: { title: 'Página', icon: 'home' }, navigation: [
  { id: id(1), groupId: id(10), label: 'Um', icon: 'home', order: 0 },
  { id: id(2), groupId: id(20), label: 'Dois', icon: 'home', order: 1 },
] } };
let tests = 0;
async function test(name, body) { await body(); tests++; console.log('PASS', name); }
function signal(initial) { let value = initial; const read = () => value; read.set = next => value = next; read.update = update => value = update(value); return read; }
function angular(tokens) { return { Injectable: () => value => value, Component: () => value => value, ViewChild: () => () => {}, DestroyRef: 'destroy', ChangeDetectionStrategy: {},
  inject: token => { assert.ok(tokens.has(token), `Unexpected injected token ${String(token)}`); return tokens.get(token); }, signal, computed: fn => fn, effect: fn => fn(), untracked: fn => fn() }; }
function observable() { const observers = []; return { subscribe(fn) { observers.push(fn); return { unsubscribe() {} }; }, emit(value) { observers.forEach(fn => fn(value)); } }; }
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function navigationFixture() {
  const changes = observable(), requests = [], session = { generation: signal(1), authenticated: signal(true) };
  const runtime = { contextChanges$: changes, snapshot: { state: 'ready' }, effectiveContext: { contextVersion: 'c1' }, navigation(options) {
    const request = deferred(); requests.push({ options, ...request }); return request.promise;
  } };
  const sync = { count: 0, synchronizeSession() { this.count++; } };
  const tokens = new Map([['runtime', runtime], ['session', session], ['pages', sync], ['destroy', { onDestroy() {} }]]);
  const { CorporateNavigationService } = load('src/app/core/corporate-navigation.service.ts', {
    '@angular/core': angular(tokens), '@praxisui/core': { EnterpriseRuntimeContextService: 'runtime' },
    './corporate-session.service': { CorporateSessionService: 'session' }, './corporate-page-pilot.service': { CorporatePagePilotService: 'pages' }, './corporate-navigation.model': model,
  });
  const menu = new CorporateNavigationService();
  const response = (nodes, nextCursor = null) => ({ schemaVersion: 'praxis-enterprise-runtime-navigation.v1', nodes, nextCursor, contextVersion: runtime.effectiveContext.contextVersion, receiptEtag: 'receipt', headReceipts: [] });
  return { menu, requests, runtime, changes, session, response, sync };
}
class HttpError extends Error { constructor(status) { super('sanitized'); this.status = status; } }
class ContractError extends Error { constructor(code) { super(code); this.code = code; } }
class PageError extends ContractError { constructor(code, status = 0) { super(code); this.status = status; } }
function editorFixture(mode, query = {}) {
  const queries = observable();
  const changes = observable(), requests = [], navigate = [], session = { generation: signal(1), authenticated: signal(true), busy: signal(true) };
  const runtime = { contextChanges$: changes, snapshot: { state: 'ready' }, effectiveContext: { contextVersion: 'c1', activeTenant: { tenantId: 'lab-a' }, activeOrganizationId: 'org-1', capabilities: ['ui.authoring.configure', 'ui.layout.publish'] } };
  const route = { snapshot: { data: { corporateGroups: mode === 'groups', corporatePublished: mode === 'published' }, queryParamMap: { get: key => query[key] ?? null }, paramMap: { get: () => mode === 'published' ? id(50) : null } }, paramMap: {}, queryParamMap: {} };
  const pages = { synchronizeSession() {} };
  const lifecycle = {}, menu = { ready: signal(true), busy: signal(false), groups: signal([group(10), group(20)]), async refresh() { requests.push('menu'); } };
  const router = { async navigate(_, options) { navigate.push(options); } };
  const tokens = new Map([['runtime', runtime], ['session', session], ['pages', pages], ['lifecycle', lifecycle], ['route', route], ['router', router], ['menu', menu], ['destroy', { onDestroy() {} }]]);
  const core = { EnterpriseRuntimeContextService: 'runtime', UiLayoutLifecycleService: 'lifecycle', UiLayoutLifecycleHttpError: HttpError, UiLayoutLifecycleContractError: ContractError,
    readStrongResourceEtag: value => /^"[^"]+"$/.test(value) ? value : null };
  const { CorporatePagesComponent } = load('src/app/pages/corporate-pages/corporate-pages.component.ts', {
    '@angular/core': angular(tokens), '@angular/router': { ActivatedRoute: 'route', Router: 'router' }, '@praxisui/core': core,
    'rxjs': { combineLatest: () => queries },
    '../../core/corporate-session.service': { CorporateSessionService: 'session' }, '../../core/corporate-navigation.service': { CorporateNavigationService: 'menu' },
    '../../core/corporate-navigation.model': model,
    '../../core/corporate-page-pilot.service': { CorporatePagePilotService: 'pages', CorporatePageError: PageError,
      corporatePageId: value => typeof value === 'string' && /^[0-9a-f-]{36}$/.test(value), corporatePageTarget: pageId => ({ componentType: 'praxis-dynamic-page', componentId: pageId }), corporatePageDocument: value => structuredClone(value) },
  });
  const editor = new CorporatePagesComponent(); editor.ready.set(true);
  const setQuery = next => { for (const key of Object.keys(query)) delete query[key]; Object.assign(query, next); queries.emit(null); };
  return { editor, lifecycle, pages, menu, requests, navigate, changes, session, setQuery, router };
}
(async () => {
  await test('closed group document and first aggregate never replace another group', () => {
    const empty = { kind: 'praxis.navigation-groups.editor', version: 1, config: { groups: [] } };
    const first = model.firstCorporateGroup(empty, id(10), ' Primeira ', 2);
    assert.deepEqual(first.config.groups, [{ id: id(10), label: 'Primeira', icon: 'home', order: 2 }]);
    assert.equal(empty.config.groups.length, 0);
    assert.throws(() => model.firstCorporateGroup(first, id(11), 'Outro', 0));
    const multi = model.upsertCorporateGroup(first, id(11), 'Segunda', 3, 'dashboard');
    assert.equal(multi.config.groups.length, 2);
    assert.equal(multi.config.groups[1].icon, 'dashboard');
    for (const corrupt of [{ ...empty, extra: true }, { ...empty, config: { groups: [first.config.groups[0], first.config.groups[0]] } }, { ...empty, config: { groups: [{ ...first.config.groups[0], icon: 'bad' }] } }]) assert.throws(() => model.corporateGroupsDocument(corrupt));
  });
  await test('binding update preserves all other bindings and content', () => {
    const changed = model.bindCorporatePage(page, id(1), id(20), ' Editado ', 3);
    assert.deepEqual(changed.config.navigation[1], page.config.navigation[1]);
    assert.deepEqual(changed.config.definition, page.config.definition); assert.equal(page.config.navigation[0].label, 'Um');
    assert.equal(changed.config.navigation[0].label, 'Editado');
    assert.equal(model.bindCorporatePage(changed, id(3), id(10), 'Novo', 1, 'description').config.navigation.length, 3);
    assert.throws(() => model.bindCorporatePage(page, id(1), 'foreign', 'A', 0));
  });
  await test('menu rejects external routes, wrong identity and eager/private children', () => {
    assert.equal(model.corporateMenuNodes([group(1)], null).length, 1);
    assert.equal(model.corporateMenuNodes([{ ...group(2), icon: 'folder' }], null).length, 1);
    assert.equal(model.corporateMenuNodes([item(1)], id(10)).length, 1);
    for (const bad of [{ ...group(1), children: [] }, { ...group(1), id: 'x' }, { ...group(1), href: 'https://evil.test' }]) assert.throws(() => model.corporateMenuNodes([bad], null));
    for (const bad of [{ ...item(1), route: 'https://evil.test' }, { ...item(1), route: `/pages/${id(2)}` }, { ...item(1), children: [group(1)] }]) assert.throws(() => model.corporateMenuNodes([bad], id(10)));
  });
  await test('SDK root pagination and lazy children use parentRef with fresh reads on reopen and project to shell', async () => {
    const f = navigationFixture(); let op = f.menu.refresh(); f.requests[0].resolve(f.response([group(1)], 'next')); await op;
    op = f.menu.moreGroups(); assert.equal(f.requests[1].options.cursor, 'next'); f.requests[1].resolve(f.response([group(2)])); await op;
    assert.equal(f.menu.groups().length, 2);
    assert.equal(model.readCorporateShellProjection().length, 2);
    op = f.menu.open(id(1)); assert.equal(f.requests[2].options.parentRef, id(1)); f.requests[2].resolve(f.response([item(5)])); await op;
    assert.equal(f.menu.children()[id(1)][0].route, `/pages/${id(5)}`);
    assert.equal(model.readCorporateShellProjection()[0].items[0].path, `/pages/${id(5)}`);
    op = f.menu.open(id(1)); assert.equal(f.menu.children()[id(1)].length, 0); f.requests[3].resolve(f.response([])); await op;
    assert.equal(f.requests.length, 4);
  });
  await test('late success/error after context invalidation or SESSION replacement cannot restore menu', async () => {
    for (const cause of ['context', 'session', 'error']) {
      const f = navigationFixture(); const op = f.menu.refresh();
      if (cause === 'session') f.session.generation.set(2); else f.changes.emit(null);
      if (cause === 'error') f.requests[0].reject(new Error('private')); else f.requests[0].resolve(f.response([group(1)]));
      await op; assert.equal(f.menu.groups().length, 0); assert.equal(f.menu.ready(), false); assert.equal(f.menu.message(), '');
      assert.equal(model.readCorporateShellProjection().length, 0);
    }
  });
  await test('malformed response, duplicate page and cursor cycle clear the whole projection', async () => {
    for (const malformed of [{ schemaVersion: 'bad' }, { nextCursor: 9 }, { nodes: [group(1), group(1)] }]) {
      const f = navigationFixture(); const op = f.menu.refresh(); f.requests[0].resolve({ ...f.response([group(1)]), ...malformed }); await op;
      assert.equal(f.menu.groups().length, 0); assert.equal(f.menu.ready(), false); assert.ok(f.menu.message());
    }
    const f = navigationFixture(); let op = f.menu.refresh(); f.requests[0].resolve(f.response([group(1)], 'a')); await op;
    op = f.menu.moreGroups(); f.requests[1].resolve(f.response([group(2)], 'b')); await op;
    op = f.menu.moreGroups(); f.requests[2].resolve(f.response([group(3)], 'a')); await op;
    assert.equal(f.menu.ready(), false); assert.equal(f.menu.groups().length, 0);
  });
  await test('bounded projection explains its limit and never presents a truncated menu', async () => {
    const f = navigationFixture();
    for (let batch = 0; batch < 11; batch++) {
      const op = batch === 0 ? f.menu.refresh() : f.menu.moreGroups();
      f.requests[batch].resolve(f.response(Array.from({ length: 20 }, (_, i) => group(batch * 20 + i + 1)), `cursor-${batch}`));
      await op;
    }
    assert.equal(f.menu.ready(), false); assert.equal(f.menu.groups().length, 0);
    assert.match(f.menu.message(), /200 itens por nível/);
  });
  await test('editor, groups and published routes share one corporate provider scope with distinct route configs', () => {
    const providers = [{}];
    const { routes } = load('src/app/app.routes.ts', {
      './core/page-definitions': { HERO_PAGE_GROUPS: [] },
      './core/corporate-runtime.providers': { CORPORATE_RUNTIME_PROVIDERS: providers },
    });
    const corporate = routes[0]; assert.equal(corporate.providers, providers); assert.equal(typeof corporate.loadComponent, 'function');
    const editor = corporate.children.find(route => route.path === 'workspace-corporativo/paginas');
    const groups = corporate.children.find(route => route.path === 'workspace-corporativo/grupos');
    const published = corporate.children.find(route => route.path === 'pages/:pageId');
    assert.notEqual(editor, groups); assert.notEqual(groups, published);
    assert.equal(groups.data.corporateGroups, true); assert.equal(published.data.corporatePublished, true);
    assert.ok([editor, groups, published].every(route => !route.providers));
  });
  await test('groups mode preserves review/login route and never creates over an existing head', async () => {
    const f = editorFixture('groups'); f.lifecycle.readHead = async () => ({ etag: `"${id(8)}"`, body: { rootTarget: model.CORPORATE_GROUPS_TARGET, headEtag: id(8), activeReleaseRef: id(9) } });
    f.lifecycle.createDraft = async () => { throw new Error('MUST NOT CREATE'); };
    await f.editor.createGroups(); assert.equal(f.editor.headAbsent(), false); assert.ok(f.editor.head());
    assert.equal(f.editor.entryParams().corporateView, 'groups'); assert.equal(f.editor.editorPath, '/workspace-corporativo/grupos');
    assert.equal(f.editor.target().componentType, 'praxis-app-shell');
    const pageEditor = editorFixture('editor', { pageId: id(50) }).editor;
    const published = editorFixture('published').editor;
    assert.equal(pageEditor.target().componentType, 'praxis-dynamic-page'); assert.equal(pageEditor.groupsMode, false);
    assert.equal(published.publishedMode, true); assert.equal(published.groupsMode, false);
  });
  await test('groups publication uses first-publish and fences a concurrent head conflict', async () => {
    const f = editorFixture('groups', { releaseId: id(3) }); f.editor.headAbsent.set(true); f.editor.reason = 'Revisão';
    f.lifecycle.publish = async (target, condition) => { f.requests.push({ target, condition }); throw new HttpError(412); };
    await f.editor.publish(); assert.deepEqual(f.requests[0].condition, { kind: 'first-publish' });
    assert.equal(f.editor.fenced(), true); assert.equal(f.editor.head(), null); assert.equal(f.requests.length, 1);
    await f.editor.publish(); assert.equal(f.requests.length, 1, 'No automatic or manual replay while uncertain');
  });
  await test('copy intent uses confirmed source, independent target and explicit menu rebinding', async () => {
    const f = editorFixture('editor', { copyFrom: id(50) });
    const source = { kind: 'published-page', pageId: id(50), releaseId: id(51), revisionId: id(52) };
    f.editor.copyOrigin.set({ pageId: id(50), copySource: source }); f.editor.title = 'Cópia';
    f.pages.createNative = () => { throw new Error('Must not replace copy intent with native source'); };
    f.pages.copyPublished = async (key, title, origin) => { f.requests.push({ key, title, origin }); return { body: { pageId: id(60), draftId: id(61), source } }; };
    f.editor.loadDraft = async () => f.editor.document.set({ ...structuredClone(page), config: { ...structuredClone(page.config), navigation: [] } });
    await f.editor.create(); assert.equal(f.requests.length, 0);
    await f.editor.copyPublished(); assert.deepEqual(f.requests[0].origin, source);
    assert.equal(f.editor.pageId(), id(60)); assert.equal(f.editor.document().config.navigation.length, 0);
    assert.equal(f.editor.entryParams().corporateCopyFrom, id(50));
    assert.equal(f.navigate.at(-1).queryParams.pageId, id(60)); assert.equal(f.navigate.at(-1).queryParams.copyFrom, id(50));
  });
  await test('uncertain copy keeps creation key for GET reconciliation and prevents another POST', async () => {
    const f = editorFixture('editor', { copyFrom: id(50) });
    const source = { kind: 'published-page', pageId: id(50), releaseId: id(51), revisionId: id(52) };
    f.editor.copyOrigin.set({ pageId: id(50), copySource: source }); f.editor.title = 'Cópia';
    f.pages.copyPublished = async key => { f.requests.push({ method: 'POST', key }); throw new PageError('UNCERTAIN'); };
    await f.editor.copyPublished(); const key = f.editor.creationKey(); assert.ok(key); assert.equal(f.editor.fenced(), true);
    await f.editor.copyPublished(); assert.equal(f.requests.length, 1);
    f.pages.reconcile = async receivedKey => { f.requests.push({ method: 'GET', key: receivedKey }); return { body: { pageId: id(60), draftId: id(61), source } }; };
    f.editor.loadDraft = async () => {}; await f.editor.reconcile();
    assert.deepEqual(f.requests.map(request => request.method), ['POST', 'GET']); assert.equal(f.requests[1].key, key);
  });
  await test('query reuse scopes uncertainty to its creation key and context changes never clear it', async () => {
    const f = editorFixture('editor', { copyFrom: id(50) });
    f.editor.copyOrigin.set({ pageId: id(50), copySource: { kind: 'published-page', pageId: id(50), releaseId: id(51), revisionId: id(52) } });
    f.editor.title = 'Cópia';
    f.pages.copyPublished = async () => { f.requests.push('POST copy'); throw new PageError('HTTP', 503); };
    await f.editor.copyPublished(); const key = f.editor.creationKey(); assert.equal(f.editor.fenced(), true);
    f.setQuery({}); assert.equal(f.editor.creationKey(), ''); assert.equal(f.editor.fenced(), false);
    assert.equal(f.editor.ready(), false, 'A new query still needs fresh runtime resolution');
    f.editor.ready.set(true); f.editor.title = 'Independente';
    f.pages.createNative = async () => { f.requests.push('POST native'); throw new PageError('HTTP', 503); };
    await f.editor.create(); assert.notEqual(f.editor.creationKey(), key);
    f.setQuery({ copyFrom: id(50), creationKey: key }); assert.equal(f.editor.fenced(), true);
    f.changes.emit(null); assert.equal(f.editor.fenced(), true); assert.equal(f.editor.ready(), false);
    f.editor.ready.set(true); await f.editor.copyPublished();
    assert.deepEqual(f.requests, ['POST copy', 'POST native']);
    f.pages.reconcile = async () => { throw new PageError('HTTP', 404); };
    await f.editor.reconcile(); assert.equal(f.editor.fenced(), true, '404 is not reconciliation success');
  });
  await test('late command error after query/context replacement fences the captured attempt only', async () => {
    for (const cause of ['query', 'context']) {
      const f = editorFixture('editor'); f.editor.title = 'Nova'; const pending = deferred();
      f.pages.createNative = async () => { f.requests.push('POST'); return pending.promise; };
      const operation = f.editor.create(); await Promise.resolve(); await Promise.resolve();
      const key = f.editor.creationKey(); assert.ok(key); assert.equal(f.requests.length, 1);
      if (cause === 'query') f.setQuery({}); else f.changes.emit(null);
      pending.reject(new PageError('HTTP', 503)); await operation;
      if (cause === 'query') { assert.equal(f.editor.fenced(), false); f.setQuery({ creationKey: key }); }
      assert.equal(f.editor.fenced(), true); assert.equal(f.editor.ready(), false);
      assert.equal(f.editor.message(), '', 'Stale failure must not repaint another scope');
    }
  });
  await test('failure after receiving a new page keeps the creation identity and malformed reads do not clear it', async () => {
    const f = editorFixture('editor'); f.editor.title = 'Nova';
    f.pages.createNative = async () => ({ body: { pageId: id(60), draftId: id(61) } });
    f.lifecycle.readDraft = async () => { throw new HttpError(503); };
    await f.editor.create(); const key = f.editor.creationKey(); assert.equal(f.editor.fenced(), true);
    f.setQuery({}); assert.equal(f.editor.fenced(), false);
    f.setQuery({ creationKey: key, pageId: id(60), draftId: id(61) }); f.editor.ready.set(true);
    f.lifecycle.readDraft = async () => ({ etag: '"current"', body: {} });
    await f.editor.reload(); assert.equal(f.editor.fenced(), true, 'Malformed receipt cannot release uncertainty');
  });
  await test('validated current draft releases only its own creation attempt', async () => {
    const f = editorFixture('groups');
    f.lifecycle.readHead = async () => { throw new HttpError(404); };
    f.lifecycle.createDraft = async () => { throw new HttpError(503); };
    await f.editor.createGroups(); const oldKey = f.editor.creationKey(); assert.equal(f.editor.fenced(), true);
    f.setQuery({}); f.editor.ready.set(true); await f.editor.createGroups();
    const key = f.editor.creationKey(); assert.notEqual(key, oldKey); assert.equal(f.editor.fenced(), true);
    f.setQuery({ creationKey: key, draftId: id(61) }); f.editor.ready.set(true);
    f.lifecycle.readDraft = async () => ({ etag: '"current"', body: {
      draft: { draftRef: id(61), rootTarget: model.CORPORATE_GROUPS_TARGET },
      targets: [{ target: model.CORPORATE_GROUPS_TARGET, working: { document: {
        kind: 'praxis.navigation-groups.editor', version: 1, config: { groups: [] },
      } } }],
    } });
    await f.editor.reload(); assert.equal(f.editor.fenced(), false); assert.ok(f.editor.workspace());
    f.setQuery({ creationKey: oldKey }); assert.equal(f.editor.fenced(), true);
    assert.equal(f.editor.workspace(), null, 'An alias must reread canonical state before any write');
  });
  await test('groups creation never dispatches after route/context changed during location update', async () => {
    for (const cause of ['query', 'context']) {
      const f = editorFixture('groups'), navigation = deferred();
      f.lifecycle.readHead = async () => { throw new HttpError(404); };
      f.lifecycle.createDraft = async () => { f.requests.push('POST'); throw new Error('Must not dispatch'); };
      f.router.navigate = async () => navigation.promise;
      const operation = f.editor.createGroups();
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
      const key = f.editor.creationKey(); assert.ok(key);
      if (cause === 'query') f.setQuery({}); else f.changes.emit(null);
      navigation.resolve(true); await operation; assert.deepEqual(f.requests, []);
    }
  });
  await test('orchestrated saveAndSubmitForReview and approveAndPublish execute sequential lifecycle steps with CAS and fence guards', async () => {
    const f = editorFixture('groups', { draftId: id(61) });
    f.editor.headAbsent.set(true);
    const makeWorkspace = (rev, assign, frozen) => ({
      etag: `"${id(70)}"`,
      body: {
        draft: { draftRef: id(61), rootTarget: model.CORPORATE_GROUPS_TARGET, state: frozen ? 'RELEASED' : 'DRAFT' },
        targets: [{
          target: model.CORPORATE_GROUPS_TARGET,
          working: { document: { kind: 'praxis.navigation-groups.editor', version: 1, config: { groups: [{ id: id(10), label: 'Operações', icon: 'dashboard', order: 1 }] } } },
          selectedRevision: rev ? { revisionRef: id(71) } : null,
          selectedAssignment: assign ? { assignmentRevisionRef: id(72) } : null,
        }],
        frozenReleaseRef: frozen ? id(73) : null,
      },
    });
    f.editor.workspace.set(makeWorkspace(false, false, false));
    f.editor.groupsDocument.set(f.editor.workspace().body.targets[0].working.document);
    f.editor.groupId = id(10);
    f.editor.groupIcon = 'dashboard';
    f.editor.title = 'Operações';
    f.editor.reason = 'Fluxo orquestrado';
    f.lifecycle.readHead = async () => { throw new HttpError(404); };
    f.lifecycle.createRevision = async () => { f.requests.push('revision'); return { etag: `"${id(71)}"`, body: { nextDraft: makeWorkspace(true, false, false).body } }; };
    f.lifecycle.createAssignment = async () => { f.requests.push('assignment'); return { etag: `"${id(72)}"`, body: { nextDraft: makeWorkspace(true, true, false).body } }; };
    f.lifecycle.freezeRelease = async () => { f.requests.push('freeze'); return { etag: `"${id(73)}"`, body: { release: { releaseRef: id(73) }, nextDraft: makeWorkspace(true, true, true).body } }; };
    f.lifecycle.readReview = async () => ({ etag: `"${id(74)}"`, body: { releaseRef: id(73), rootTarget: model.CORPORATE_GROUPS_TARGET, reviewEtag: id(74), state: 'DRAFT' } });
    f.lifecycle.submit = async () => { f.requests.push('submit'); return { etag: `"${id(75)}"`, body: { releaseRef: id(73), rootTarget: model.CORPORATE_GROUPS_TARGET, reviewEtag: id(75), state: 'SUBMITTED' } }; };
    await f.editor.saveAndSubmitForReview();
    assert.deepEqual(f.requests, ['revision', 'assignment', 'freeze', 'submit']);
    assert.equal(f.editor.review().body.state, 'SUBMITTED');

    f.lifecycle.approve = async () => { f.requests.push('approve'); return { etag: `"${id(76)}"`, body: { releaseRef: id(73), rootTarget: model.CORPORATE_GROUPS_TARGET, reviewEtag: id(76), state: 'APPROVED' } }; };
    f.lifecycle.publish = async () => { f.requests.push('publish'); return { etag: `"${id(77)}"`, body: { rootTarget: model.CORPORATE_GROUPS_TARGET, headEtag: id(77), activeReleaseRef: id(73) } }; };
    f.lifecycle.readHead = async () => ({ etag: `"${id(77)}"`, body: { rootTarget: model.CORPORATE_GROUPS_TARGET, headEtag: id(77), activeReleaseRef: id(73) } });
    await f.editor.approveAndPublish();
    assert.deepEqual(f.requests, ['revision', 'assignment', 'freeze', 'submit', 'approve', 'publish', 'menu']);
    assert.equal(f.editor.isReleaseAlreadyActive(), true);
    await f.editor.approveAndPublish();
    await f.editor.publish();
    assert.deepEqual(f.requests, ['revision', 'assignment', 'freeze', 'submit', 'approve', 'publish', 'menu'], 'Already active release must not republish');

    const pageFix = editorFixture('editor', { pageId: id(1), draftId: id(62) });
    pageFix.editor.workspace.set({
      etag: `"${id(80)}"`,
      body: {
        draft: { draftRef: id(62), rootTarget: { componentType: 'praxis-dynamic-page', componentId: id(1) }, state: 'DRAFT' },
        targets: [{
          target: { componentType: 'praxis-dynamic-page', componentId: id(1) },
          working: { document: page },
          selectedRevision: { revisionRef: id(81) },
          selectedAssignment: null,
        }],
        frozenReleaseRef: null,
      },
    });
    pageFix.editor.document.set(page);
    pageFix.editor.title = 'Página com revisão prévia';
    pageFix.editor.reason = 'Tentativa inválida no editor';
    pageFix.editor.formEditor = { readDocument() { throw new Error('Invalid form edit'); } };
    pageFix.lifecycle.createAssignment = async () => { pageFix.requests.push('stale-assignment'); throw new Error('Must not assign stale revision'); };
    await pageFix.editor.saveAndSubmitForReview();
    assert.deepEqual(pageFix.requests, [], 'Failed local save must never freeze or submit a pre-existing revision');
    assert.match(pageFix.editor.message(), /Corrija o conteúdo no editor/);
  });
  console.log(`PASS ${tests} offline corporate navigation checks; browser/real HTTP remain separate.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
