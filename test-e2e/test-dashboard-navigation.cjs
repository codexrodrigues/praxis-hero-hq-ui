// Exercises the transpiled runtime methods of HeroTacticalRadarComponent and
// reconcilePersistedDashboardPage in an isolated Node VM without bootstrapping Angular.
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

require('./test-route-catalog.cjs');

const ROOT = path.resolve(__dirname, '..');
const dashboardBundle = require('../src/app/pages/dashboard/dashboard-page.definition.json');

// 1. Transpile and execute HeroTacticalRadarComponent methods (isSafeInternalRoute, engageLockedContact, sanitizeResolvedText)
const radarSource = fs.readFileSync(
  path.join(ROOT, 'src/app/pages/dashboard/hero-tactical-radar.component.ts'),
  'utf8',
);
const radarAst = ts.createSourceFile('radar.ts', radarSource, ts.ScriptTarget.Latest, true);
const radarClass = radarAst.statements.find(
  (n) => ts.isClassDeclaration(n) && n.name?.text === 'HeroTacticalRadarComponent',
);

const findMethod = (cls, ast, name) =>
  cls.members.find((m) => m.name?.getText(ast) === name)?.getText(ast);

const radarHarnessTs = `
class RadarHarness {
  sonarPulseRadius = 0;
  sonarPulseOpacity = 0;
  lockedContactId: string | null = null;
  runtimeContacts: any[] = [];
  globalActions: any = null;
  router: any = null;

  ${findMethod(radarClass, radarAst, 'isSafeInternalRoute')}
  ${findMethod(radarClass, radarAst, 'engageLockedContact')}
  ${findMethod(radarClass, radarAst, 'sanitizeResolvedText')}
}
RadarHarness;
`;

const radarHarnessJs = ts.transpileModule(radarHarnessTs, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const RadarHarness = vm.runInNewContext(radarHarnessJs);

const navigatedRoutes = [];
const radar = new RadarHarness();
radar.router = { navigateByUrl: (url) => navigatedRoutes.push(url) };
radar.runtimeContacts = [
  { id: 'EXT-1', route: 'https://example.com', phosphor: 0, flashRing: 0 },
  { id: 'EXT-2', route: '//example.com', phosphor: 0, flashRing: 0 },
  { id: 'EXT-3', route: 'javascript:alert(1)', phosphor: 0, flashRing: 0 },
  { id: 'INT-1', route: '/rh/funcionarios', phosphor: 0, flashRing: 0 },
  { id: 'INT-2', route: '/operacoes/missoes', phosphor: 0, flashRing: 0 },
];

for (const unsafeId of ['EXT-1', 'EXT-2', 'EXT-3']) {
  radar.lockedContactId = unsafeId;
  radar.engageLockedContact();
}
assert.deepEqual(navigatedRoutes, [], 'Unsafe or external routes must be rejected');

for (const safeId of ['INT-1', 'INT-2']) {
  radar.lockedContactId = safeId;
  radar.engageLockedContact();
}
assert.deepEqual(navigatedRoutes, ['/rh/funcionarios', '/operacoes/missoes']);

assert.equal(
  radar.sanitizeResolvedText('IFF · PRONTIDÃO ${readinessRate}%', 'FALLBACK'),
  'IFF · PRONTIDÃO',
);
assert.equal(
  radar.sanitizeResolvedText('Heróis Ativos (${activeHeroes})', 'FALLBACK'),
  'Heróis Ativos',
);

// 2. Transpile and execute reconcilePersistedDashboardPage from dashboard-page.definition.ts
const defSource = fs.readFileSync(
  path.join(ROOT, 'src/app/pages/dashboard/dashboard-page.definition.ts'),
  'utf8',
);
const defAst = ts.createSourceFile('def.ts', defSource, ts.ScriptTarget.Latest, true);
const reconcileFnNode = defAst.statements.find(
  (n) => ts.isFunctionDeclaration(n) && n.name?.text === 'reconcilePersistedDashboardPage',
);
const defHarnessTs = `
const DASHBOARD_PAGE_DEFINITION = __bundle.dashboardPageDefinition;
${reconcileFnNode.getText(defAst).replace(/^export\s+/, '')}
reconcilePersistedDashboardPage;
`;
const defHarnessJs = ts.transpileModule(defHarnessTs, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const reconcilePersistedDashboardPage = vm.runInNewContext(defHarnessJs, {
  __bundle: dashboardBundle,
  structuredClone,
});

const legacySnapshot = {
  state: {
    values: {
      customEnterpriseFilter: 'SOKOVIA_AUDIT',
    },
  },
  dataSources: [
    {
      id: 'customEnterpriseFeed',
      kind: 'http',
      request: { method: 'GET', path: '/api/custom' },
    },
  ],
  widgets: [
    {
      key: 'heroBanner',
      definition: {
        id: 'praxis-rich-content',
        inputs: {
          document: {
            kind: 'praxis.rich-content',
            version: '1.0.0',
            nodes: [{ type: 'card', variant: 'hero', media: { kind: 'icon', icon: 'radar' } }],
          },
        },
      },
    },
    { key: 'customWidget', definition: { id: 'praxis-rich-content', inputs: {} } },
  ],
};

const upgraded = reconcilePersistedDashboardPage(legacySnapshot);
assert.equal(
  upgraded.widgets[0].definition.inputs.document.nodes[0].media.componentId,
  'hero-hq-tactical-radar',
);
assert.equal(upgraded.widgets[1].key, 'customWidget');
assert.ok(
  Array.isArray(upgraded.dataSources) &&
    upgraded.dataSources.some((ds) => ds.id === 'recentMissionsFeed') &&
    upgraded.dataSources.some((ds) => ds.id === 'customEnterpriseFeed'),
  'Legacy snapshots must be upgraded to include recentMissionsFeed while preserving custom enterprise DataSources',
);
assert.equal(
  upgraded.state?.values?.customEnterpriseFilter,
  'SOKOVIA_AUDIT',
  'Reconciliation must preserve custom enterprise state variables',
);
assert.ok(
  Array.isArray(upgraded.state?.values?.activeMissions) &&
    upgraded.state.values.activeMissions.length === 4,
  'Legacy snapshots must be upgraded with activeMissions initial state',
);
assert.equal(
  upgraded.deviceLayouts?.tablet?.canvas?.columns,
  6,
  'Legacy snapshots must receive responsive 6-column tablet deviceLayout',
);
assert.equal(
  upgraded.deviceLayouts?.mobile?.canvas?.columns,
  1,
  'Legacy snapshots must receive responsive 1-column mobile deviceLayout',
);
assert.equal(
  reconcilePersistedDashboardPage(upgraded),
  upgraded,
  'Already-reconciled snapshots must be returned by reference without redundant cloning',
);

const staleWidgetsSnapshot = {
  widgets: [
    {
      key: 'kpiFolha',
      definition: {
        id: 'praxis-rich-content',
        inputs: { document: { kind: 'praxis.rich-content', version: '1.0.0', nodes: [{ type: 'card', className: 'glass-panel bento-kpi-card' }] } },
      },
    },
    {
      key: 'incidentsSeverityDonut',
      definition: { id: 'praxis-chart', inputs: { config: { sizing: { mode: 'fixed', height: 280 } } } },
    },
    {
      key: 'distressSignalsList',
      definition: {
        id: 'praxis-list',
        inputs: {
          config: {
            selection: { showControl: false },
            layout: { virtualScroll: { viewportHeight: '380px' } },
            expansion: { sections: [{ id: 'tactical-telemetry', itemsExpr: '[]' }] },
          },
        },
      },
    },
    {
      key: 'recentIncidents',
      definition: {
        id: 'praxis-table',
        inputs: { config: { columns: [{ field: 'severidade' }, { field: 'mortos' }], toolbar: { visible: true, title: 'Incidentes em Campo' } } },
      },
    },
    {
      key: 'missionsTimeline',
      definition: {
        id: 'praxis-rich-content',
        inputs: { document: { kind: 'praxis.rich-content', version: '1.0.0', nodes: [{ type: 'timeline', markerVariant: 'dot', items: [] }] } },
      },
    },
    {
      key: 'domainHub',
      definition: {
        id: 'praxis-rich-content',
        inputs: { document: { kind: 'praxis.rich-content', version: '1.0.0', nodes: [{ type: 'compose', items: [{ className: 'glass-panel hub-card-action tone-operations' }] }] } },
      },
    },
  ],
};
const upgradedWidgets = reconcilePersistedDashboardPage(staleWidgetsSnapshot);
const byKey = new Map(upgradedWidgets.widgets.map((w) => [w.key, w]));
assert.ok(byKey.get('kpiFolha').definition.inputs.document.nodes[0].className.includes('kpi-tone-rh'));
assert.equal(byKey.get('incidentsSeverityDonut').definition.inputs.config.sizing.height, 340);
assert.equal(byKey.get('distressSignalsList').definition.inputs.config.layout.virtualScroll.viewportHeight, '340px');
assert.ok(byKey.get('distressSignalsList').definition.inputs.config.expansion.sections[0].itemsExpr.includes('#${item.id}'));
assert.equal(byKey.get('recentIncidents').definition.inputs.config.toolbar.appearance.variant, 'integrated');
assert.equal(byKey.get('missionsTimeline').definition.inputs.document.nodes[0].markerVariant, 'icon');
assert.ok(byKey.get('domainHub').definition.inputs.document.nodes[0].items[5].className.includes('tone-cobalt'));

console.log(
  'PASS: explicit internal navigation only, placeholder sanitization, and non-destructive persisted dashboard snapshot reconciliation verified at runtime',
);
