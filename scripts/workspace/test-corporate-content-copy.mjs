// Focused host checks. Owner codecs/layout are real public SDK; Angular mounting/HTTP are doubles.
import '@angular/compiler';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as core from '@praxisui/core';
import * as form from '@praxisui/dynamic-form';
import * as http from '@angular/common/http';
import { Subject, firstValueFrom } from 'rxjs';
import { corporateFormOwnerFixture } from './corporate-form-owner-fixture.mjs';
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const origin = { kind: 'published-page', pageId: id(1), releaseId: id(2), revisionId: id(3) };
const target = pageId => ({ componentType: 'praxis-dynamic-page', componentId: pageId });
const page = inputs => ({ kind: 'praxis.dynamic-page.editor', version: 1, config: {
  definition: { widgets: [{ key: id(40), definition: { id: 'praxis-dynamic-form', inputs } }] },
  presentation: { title: 'Página', icon: 'home' }, navigation: [],
} });
function load(file, dependencies) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)(name => { assert.ok(name in dependencies, `Unknown module ${name}`); return dependencies[name]; }, module, module.exports);
  return module.exports;
}
let tests = 0;
async function test(name, fn) { await fn(); console.log('PASS', name); tests++; }
function serviceFixture() {
  const requests = [], changes = new Subject(); let generation = 1;
  const session = { authenticated: () => true, generation: () => generation };
  const runtime = { contextChanges$: changes, snapshot: { state: 'ready', effectiveContext: { contextVersion: 'ctx' } }, effectiveContext: { contextVersion: 'ctx' }, invalidate() { changes.next(null); }, applyHeaders: headers => headers.set('X-Test-Context', 'ctx') };
  const client = { request(method, url, options) { const response = new Subject(); requests.push({ method, url, options, response }); return response; } };
  const tokens = new Map([[http.HttpClient, client], [core.EnterpriseRuntimeContextService, runtime], ['session', session], ['destroy', { onDestroy() {} }]]);
  const exports = load('src/app/core/corporate-page-pilot.service.ts', {
    '@angular/core': { Injectable: () => value => value, DestroyRef: 'destroy', inject: token => tokens.get(token), effect: fn => fn(), untracked: fn => fn() },
    '@angular/common/http': http, rxjs: { firstValueFrom }, '@praxisui/core': core,
    './corporate-session.service': { CorporateSessionService: 'session' }, './platform.config': { PRAXIS_API_BASE_URL: '/api' },
  });
  const service = new exports.CorporatePagePilotService();
  const creation = (source = origin) => ({ creationKey: id(10), pageId: id(20), draftId: id(21), target: target(id(20)), routePath: `/pages/${id(20)}`, draftEtag: '"draft"', source });
  const respond = (body, status = 201, etag = '"draft"') => requests.at(-1).response.next({ body, status, headers: new http.HttpHeaders({ ETag: etag }) });
  return { service, exports, requests, creation, respond, replaceSession: () => ++generation };
}
function editorFixture(document, initialEditorDocument) {
  const callbacks = [];
  const exports = load('src/app/pages/corporate-pages/corporate-form-editor.component.ts', {
    '@angular/core': { Component: () => value => value, Input: () => () => {}, ViewChild: () => () => {}, ChangeDetectionStrategy: {}, Injector: { create: options => options },
      inject: () => ({}), afterNextRender: callback => callbacks.push(callback) },
    '@angular/common': { NgComponentOutlet: class {} }, '@praxisui/core': core, '@praxisui/dynamic-form': form, '@praxisui/settings-panel': { SETTINGS_PANEL_DATA: 'data' },
  });
  let current = structuredClone(initialEditorDocument);
  const editor = new exports.CorporateFormEditorComponent(); editor.document = document;
  editor.outlet = { componentInstance: { getSettingsValue: () => form.serializeDynamicFormAuthoringDocument(current), isBusy$: { value: false }, isValid$: { value: true } } };
  callbacks.splice(0).forEach(fn => fn());
  return { editor, update: value => current = structuredClone(value) };
}
await test('native layout fixture admits four real local fields and preserves canonical field items', () => {
  const fixture = corporateFormOwnerFixture(); assert.deepEqual(fixture.projected.diagnostics, []);
  const document = page(fixture.projected.inputs);
  assert.equal(core.validatePageAuthoringDocument(document, { 'praxis-dynamic-form': form.validateDynamicFormPageWidget }).ok, true);
  const col = fixture.projected.inputs.config.sections[0].rows[0].columns[0];
  assert.deepEqual(col.items.map(item => item.fieldName), col.fields);
  assert.equal(form.materializeDynamicFormPageRuntimeInputs(fixture.projected.inputs, id(20), id(40)).inputs.configPersistenceStrategy, 'volatile');
});
await test('editor no-op preserves raw input and explicit local content round-trips without defaults', () => {
  const fixture = corporateFormOwnerFixture(), original = page({ config: fixture.seed.config });
  const baseline = form.normalizeDynamicFormAuthoringDocument(fixture.seed);
  const f = editorFixture(original, baseline); assert.deepEqual(f.editor.readDocument(), original);
  const changed = structuredClone(baseline); changed.config.fieldMetadata = fixture.candidate.config.fieldMetadata; changed.config.sections = fixture.candidate.config.sections;
  f.update(changed); const saved = f.editor.readDocument();
  assert.deepEqual(saved.config.definition.widgets[0].definition.inputs, fixture.projectedEditor.inputs);
  assert.deepEqual(Object.keys(saved.config.definition.widgets[0].definition.inputs.config).sort(), ['fieldMetadata', 'sections', 'title']);
  assert.equal(original.config.definition.widgets[0].definition.inputs.config.fieldMetadata.length, 0);
  const reopened = editorFixture(saved, form.normalizeDynamicFormAuthoringDocument(form.decodeDynamicFormPageInputs(fixture.projectedEditor.inputs).document));
  assert.deepEqual(reopened.editor.readDocument(), saved);
});
await test('editor refuses envelope changes without stripping or resetting the repairable draft', () => {
  const fixture = corporateFormOwnerFixture(), f = editorFixture(page({ config: fixture.seed.config }), fixture.seed);
  const wrong = { ...structuredClone(fixture.candidate), bindings: { mode: 'view' } }; f.update(wrong);
  assert.throws(() => f.editor.readDocument(), /FORM_ENVELOPE_CHANGED/);
  assert.equal(f.editor.outlet.componentInstance.getSettingsValue().bindings.mode, 'view');
  assert.equal(f.editor.outlet.componentInstance.getSettingsValue().config.fieldMetadata.length, 4);
  f.update(fixture.candidate); assert.equal(f.editor.readDocument().config.definition.widgets[0].definition.inputs.config.fieldMetadata.length, 4);
});
await test('copy posts only the exact server source and accepts a distinct new identity', async () => {
  const f = serviceFixture(), op = f.service.copyPublished(id(10), 'Cópia', origin);
  assert.deepEqual(f.requests[0].options.body, { creationKey: id(10), title: 'Cópia', source: origin });
  f.respond(f.creation()); const result = await op;
  assert.notEqual(result.body.pageId, origin.pageId); assert.deepEqual(result.body.source, origin);
  assert.equal(f.requests.length, 1);
});
await test('published selector correlates page/head and rejects missing or foreign revision evidence', async () => {
  for (const source of [undefined, { ...origin, pageId: id(99) }, { ...origin, releaseId: id(99) }, { ...origin, revisionId: 'unknown' }, { ...origin, grant: true }]) {
    const f = serviceFixture(), op = f.service.published(id(1));
    f.respond({ schemaVersion: 'praxis.published-page/v1', pageId: id(1), route: `/pages/${id(1)}`, contextVersion: 'ctx', receiptEtag: 'r', head: { rootTarget: target(id(1)), activeReleaseRef: id(2), headEtag: id(4) }, copySource: source, document: page({ config: corporateFormOwnerFixture().seed.config }) }, 200, 'W/"published"');
    await assert.rejects(op, error => error.code === 'CONTRACT');
  }
});
await test('copy receipt cannot change source or reuse original page identity', async () => {
  for (const body of [{ source: { ...origin, revisionId: id(99) } }, { pageId: id(1), target: target(id(1)), routePath: `/pages/${id(1)}` }]) {
    const f = serviceFixture(), op = f.service.copyPublished(id(10), 'Cópia', origin); f.respond({ ...f.creation(), ...body });
    await assert.rejects(op, error => error.code === 'CONTRACT');
  }
});
await test('by-key recovery preserves published source and never replays POST', async () => {
  const f = serviceFixture(), op = f.service.reconcile(id(10)); assert.equal(f.requests[0].method, 'GET');
  f.respond(f.creation(), 200); const result = await op; assert.deepEqual(result.body.source, origin);
  assert.equal(f.requests.length, 1);
});
await test('SESSION change while copying makes outcome uncertain and later by-key lookup is read-only', async () => {
  const f = serviceFixture(), op = f.service.copyPublished(id(10), 'Cópia', origin);
  f.replaceSession(); f.respond(f.creation()); await assert.rejects(op, error => error.code === 'UNCERTAIN');
  const recovery = f.service.reconcile(id(10)); f.respond(f.creation(), 200); await recovery;
  assert.deepEqual(f.requests.map(request => request.method), ['POST', 'GET']);
});
console.log(`PASS ${tests} content/copy checks with real SDK codecs; mounted Angular/browser and real publication remain separate.`);
