// Execute the current host's private boundary guards with the installed canonical Core services.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const { test } = require('node:test');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const repositoryFile = path.join(ROOT, 'src/app/core/visitor-workspace.repository.ts');
const repositoryExports = {};
vm.compileFunction(ts.transpileModule(fs.readFileSync(repositoryFile, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, ['exports'], { filename: repositoryFile })(repositoryExports);
const { VisitorWorkspaceRepository, VisitorWorkspaceError, visitorWorkspaceKey } = repositoryExports;

function hostHarness(core) {
  const file = path.join(ROOT, 'src/app/core/visitor-workspace.service.ts');
  const source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const cls = ast.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'VisitorWorkspaceService');
  assert.ok(cls, 'The real host service must exist');
  const methods = ['validatePage', 'validatePresentation'].map(name => {
    const method = cls.members.find(node => node.name?.getText(ast) === name);
    assert.ok(method, `The real host ${name} method must exist`);
    return method.getText(ast);
  }).join('\n');
  const js = ts.transpileModule(`class HostHarness {
    registry = { get: id => id === 'fixture-component' ? { component: class {}, ports: [
      { id: 'state', direction: 'input', semanticKind: 'value' },
      { id: 'output', direction: 'output', semanticKind: 'value' },
    ] } : undefined };
    validator = new CompositionValidatorService();
    ${methods}
  }; return HostHarness;`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const Host = vm.compileFunction(js, ['CompositionValidatorService', 'WidgetPageCompositionFactory', 'VisitorWorkspaceError'], { filename: file })(
    core.CompositionValidatorService, core.WidgetPageCompositionFactory, VisitorWorkspaceError,
  );
  return new Host();
}

function page() {
  return {
    layoutPreset: 'fixture-layout', themePreset: 'fixture-theme',
    layout: { orientation: 'columns', columns: 12, gap: '16px' },
    canvas: { mode: 'grid', columns: 12, items: { fixture: { col: 1, row: 1, colSpan: 6, rowSpan: 1, constraints: { lockSize: false } } } },
    state: { values: { total: 4 }, schema: { total: { initial: 0, tags: ['fixture'] } } },
    widgets: [{ key: 'fixture', definition: { id: 'fixture-component', inputs: { arbitraryChildConfig: { rows: [1, 2] } }, bindingOrder: ['arbitraryChildConfig'] }, shell: { actions: [{ id: 'fixture-action', label: 'Action' }] } }],
  };
}

function rejected(host, value) {
  assert.throws(() => host.validatePage(value), error => error instanceof VisitorWorkspaceError && error.code === 'invalid');
}

test('visitor page boundary guards use actual host methods and installed Core validation', async t => {
  await import('@angular/compiler');
  const core = await import('@praxisui/core');
  const host = hostHarness(core);

  await t.test('valid shared envelopes preserve component-owned input configuration', () => {
    const valid = page();
    const before = structuredClone(valid);
    assert.doesNotThrow(() => host.validatePage(valid));
    assert.deepEqual(valid, before);
    const shorthand = page();
    shorthand.state = { businessValue: [1, 2, 3] };
    assert.doesNotThrow(() => host.validatePage(shorthand), 'Core still accepts plain state shorthand');
  });

  await t.test('malformed shell/action/binding envelopes fail before runtime cloning', () => {
    for (const mutate of [
      p => { p.widgets[0].shell = []; },
      p => { p.widgets[0].shell.actions = {}; },
      p => { p.widgets[0].shell.actions = [null]; },
      p => { p.widgets[0].shell.actions = [{ id: 7 }]; },
      p => { p.widgets[0].shell.windowActions = []; },
      p => { p.widgets[0].definition.bindingOrder = {}; },
      p => { p.widgets[0].definition.bindingOrder = [7]; },
      p => { p.widgets[0].definition.inputs = []; },
      p => { p.widgets[0].definition.outputs = 'emit'; },
    ]) { const invalid = page(); mutate(invalid); rejected(host, invalid); }
    const broken = page(); broken.widgets[0].shell.actions = {};
    assert.throws(() => core.DynamicWidgetPageComponent.prototype.cloneWidgetInstance(broken.widgets[0]), /iterable/);
  });

  await t.test('malformed state and preset shapes fail rather than become runtime state', () => {
    for (const mutate of [
      p => { p.state = 'bad'; },
      p => { p.state.values = []; },
      p => { p.state.schema = []; },
      p => { p.state.schema = { total: null }; },
      p => { p.state.schema.total.tags = {}; },
      p => { p.state.derived = { total: { dependsOn: {}, compute: { kind: 'template', value: 0 } } }; },
      p => { p.state.derived = { total: { dependsOn: [], compute: null } }; },
      p => { p.layoutPreset = {}; },
      p => { p.themePreset = []; },
      p => { p.slotAssignments = { fixture: [] }; },
    ]) { const invalid = page(); mutate(invalid); rejected(host, invalid); }
  });

  await t.test('malformed presentation collections and scalar types fail closed', () => {
    for (const mutate of [
      p => { p.layout.columns = '12'; },
      p => { p.layout.orientation = ['columns']; },
      p => { p.layout.gap = []; },
      p => { p.canvas.items = []; },
      p => { p.canvas.items.fixture.constraints = []; },
      p => { p.canvas.items.fixture.constraints.lockSize = 'false'; },
      p => { p.canvas.items.fixture.contentSize = { heightPx: '100' }; },
      p => { p.deviceLayouts = { mobile: { widgetOverrides: { fixture: [] } } }; },
      p => { p.grouping = {}; },
      p => { p.grouping = [{ id: 'tabs', tabs: [{ id: 'one', label: 'One', widgetKeys: {} }] }]; },
      p => { p.wiring = {}; },
    ]) { const invalid = page(); mutate(invalid); rejected(host, invalid); }
  });

  await t.test('canonical composition diagnostics receive materialized links and registered components', () => {
    const invalid = page();
    invalid.composition = { links: [{ id: 'bad-port', intent: 'bind',
      from: { kind: 'component-port', ref: { widget: 'missing', port: 'value', direction: 'input' } },
      to: { kind: 'state', ref: { path: 'total', layer: 'values' } },
    }] };
    rejected(host, invalid);
    const unregistered = page(); unregistered.widgets[0].definition.id = 'missing-component';
    rejected(host, unregistered);
  });

  await t.test('declared data source arrays preserve valid payloads and block malformed connector envelopes', () => {
    const valid = page();
    valid.dataSources = [{ id: 'fixture-data', resourcePath: '/api/demo', endpointKey: 'default',
      targetStatePath: 'total', query: { filter: {} }, method: 'GET', autoFetch: false, transform: true }];
    const before = structuredClone(valid);
    assert.doesNotThrow(() => host.validatePage(valid));
    assert.deepEqual(valid, before, 'JSON Logic primitives and query content remain owned by Core');
    for (const source of [null, { id: 'data', resourcePath: '/api/demo', endpointKey: {} },
      { id: 'data', resourcePath: '/api/demo', targetStatePath: [] },
      { id: 'data', resourcePath: '/api/demo', query: [] },
      { id: 'data', resourcePath: '/api/demo', autoFetch: 'false' },
      { id: 'data', resourcePath: '/api/demo', refreshIntervalMs: {} },
    ]) { const invalid = page(); invalid.dataSources = [source]; rejected(host, invalid); }
    const map = page(); map.dataSources = { data: { resourcePath: '/api/demo' } };
    rejected(host, map); // rc.37's public WidgetPageDefinition declares arrays only.
    const runtime = Object.create(core.WidgetPageDataSourceRuntimeService.prototype);
    Object.assign(runtime, { http: { get: () => require('rxjs').of({}) }, apiUrlConfig: null, latestSnapshots: new Map() });
    assert.throws(() => runtime.startDataSources([{ id: 'data', resourcePath: '/api/demo', endpointKey: {} }], () => {}), /trim/,
      'The malformed connector previously threw synchronously before observable error handling');
  });

  await t.test('canonical endpoint variants and state/output port names remain accepted', () => {
    const state = { kind: 'state', ref: { path: 'total', layer: 'values' } };
    const input = { kind: 'component-port', ref: { widget: 'fixture', port: 'state', direction: 'input' } };
    const output = { kind: 'component-port', ref: { widget: 'fixture', port: 'output', direction: 'output' } };
    for (const link of [
      { id: 'read', intent: 'state-read', from: state, to: input },
      { id: 'write', intent: 'state-write', from: output, to: { kind: 'state', ref: { path: 'result' } } },
      { id: 'action', intent: 'command-dispatch', from: output, to: { kind: 'global-action', ref: { actionId: 'navigation.back' } } },
    ]) { const valid = page(); valid.composition = { links: [link] }; assert.doesNotThrow(() => host.validatePage(valid)); }
  });

  await t.test('malformed state paths fail the boundary instead of degrading bootstrap', () => {
    const invalid = page();
    invalid.composition = { links: [{ id: 'bad-path', intent: 'state-read',
      from: { kind: 'state', ref: { path: {} } },
      to: { kind: 'component-port', ref: { widget: 'fixture', port: 'state', direction: 'input' } },
    }] };
    const definition = new core.WidgetPageCompositionFactory().create(invalid);
    const diagnostics = new core.CompositionValidatorService().validatePage(invalid, { registry: host.registry, links: definition.links });
    assert.deepEqual(diagnostics, [], 'Semantic validation does not cover this structural path type');
    const result = new core.CompositionRuntimeFacade().bootstrap(definition);
    assert.equal(result.status, 'degraded');
    assert.ok(result.diagnostics.some(item => item.code === 'RUNTIME_LINK_EXECUTION_FAILED'));
    rejected(host, invalid);
    for (const endpoint of [null, { kind: 'state', ref: [] }, { kind: 'state', ref: { path: 'total', layer: [] } },
      { kind: 'component-port', ref: { widget: 'fixture', port: {}, direction: 'output' } },
      { kind: 'component-port', ref: { widget: 'fixture', port: 'output', direction: 'output', nestedPath: {} } },
      { kind: 'global-action', ref: { actionId: {} } },
    ]) { const malformed = page(); malformed.composition = structuredClone(invalid.composition); malformed.composition.links[0].from = endpoint; rejected(host, malformed); }
  });

  await t.test('corrupt persisted page shape rejects the whole envelope without rewriting it', () => {
    const invalid = page(); invalid.widgets[0].shell.actions = {};
    const owner = JSON.stringify(['tenant', 'persona']);
    const id = randomUUID();
    const raw = JSON.stringify({ version: 1, pages: [{ id, title: 'Saved', definition: invalid, createdAt: new Date().toISOString() }], menus: [] });
    let writes = 0;
    const storage = { getItem: key => key === visitorWorkspaceKey(owner) ? raw : null, setItem: () => { writes++; } };
    const repository = new VisitorWorkspaceRepository(storage, async (_, action) => action(), value => host.validatePage(value));
    assert.throws(() => repository.read(owner), error => error instanceof VisitorWorkspaceError && error.code === 'corrupt');
    assert.equal(writes, 0);
  });
});
