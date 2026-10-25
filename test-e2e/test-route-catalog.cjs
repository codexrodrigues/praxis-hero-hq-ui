// Isolated product route contract; does not bootstrap Angular or load lazy pages.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
const corporateContext = class CorporateContext {};
const corporateLifecycle = class CorporateLifecycle {};
const corporatePages = class CorporatePages {};
const corporateNavigation = class CorporateNavigation {};
const corporateOptions = {};
let guardCalls = 0;
const guard = () => { guardCalls++; };

function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    require(id) {
      if (id === '@praxisui/core') return { EnterpriseRuntimeContextService: corporateContext, UiLayoutLifecycleService: corporateLifecycle, PRAXIS_ENTERPRISE_RUNTIME_CONTEXT_OPTIONS: corporateOptions };
      if (id.endsWith('corporate-page-pilot.service')) return { CorporatePagePilotService: corporatePages };
      if (id.endsWith('corporate-navigation.service')) return { CorporateNavigationService: corporateNavigation };
      if (id.endsWith('tactical-clearance.guard')) return { tacticalClearanceGuard: guard };
      assert.ok(id.startsWith('.'), `Unexpected eager runtime import: ${id}`);
      return load(path.relative(root, path.resolve(path.dirname(file), `${id}.ts`)));
    },
  });
  return exports;
}

const { routes: rootRoutes } = load('src/app/app.routes.ts');
const corporateBoundary = rootRoutes.find(route => route.children);
assert.ok(corporateBoundary, 'Corporate entry/editor/reader share one provider boundary');
assert.ok(corporateBoundary.providers.includes(corporateContext));
assert.ok(corporateBoundary.providers.includes(corporateLifecycle));
assert.ok(corporateBoundary.providers.includes(corporatePages));
assert.ok(corporateBoundary.providers.includes(corporateNavigation));
assert.deepEqual(JSON.parse(JSON.stringify(corporateBoundary.providers.find(x => x.provide === corporateOptions).useValue)), { includeGlobalFetchHeaders: false, errorPolicy: 'fail' });
assert.deepEqual(JSON.parse(JSON.stringify(corporateBoundary.children.map(x => x.path))), ['workspace-corporativo', 'workspace-corporativo/paginas', 'workspace-corporativo/grupos', 'pages/:pageId']);
assert.equal(corporateBoundary.children.find(x => x.path === 'pages/:pageId').data.corporatePublished, true);
assert.equal(corporateBoundary.children.find(x => x.path === 'workspace-corporativo/grupos').data.corporateGroups, true);
const routes = rootRoutes.flatMap(route => route.children ?? [route]);
const { HERO_NAVIGATION } = load('src/app/core/navigation.model.ts');
const { HERO_PAGE_GROUPS } = load('src/app/core/page-definitions.ts');
const items = HERO_NAVIGATION.flatMap(group => group.items);
const definitions = HERO_PAGE_GROUPS.flatMap(group => group.items);
const plain = value => JSON.parse(JSON.stringify(value));
// Independent product inventory: removing a page from both projections must fail.
const expectedDestinations = [
  '/workspace-corporativo', '/laboratorio', '/', '/comando-studio', '/workspace-studio', '/rh/funcionarios', '/rh/folha-pagamento',
  '/rh/eventos-folha', '/rh/afastamentos', '/rh/cargos-departamentos', '/rh/reputacao',
  '/operacoes/missoes', '/operacoes/missao-participantes', '/operacoes/equipes',
  '/operacoes/bases', '/operacoes/incidentes', '/ativos/equipamentos', '/ativos/veiculos',
  '/suprimentos/contratos', '/suprimentos/pedidos', '/risco/ameacas', '/risco/indicadores',
];
assert.deepEqual(plain(items.map(item => item.path)), expectedDestinations);
const expectedResources = [
  'human-resources/funcionarios', 'human-resources/folhas-pagamento',
  'human-resources/eventos-folha', 'human-resources/ferias-afastamentos',
  'human-resources/departamentos', 'human-resources/vw-ranking-reputacao',
  'operations/missoes', 'operations/missao-participantes', 'operations/equipes',
  'operations/bases', 'operations/incidentes', 'assets/equipamentos', 'assets/veiculos',
  'procurement/contracts', 'procurement/purchase-orders',
  'risk-intelligence/ameacas', 'risk-intelligence/vw-indicadores-incidentes',
];
assert.deepEqual(plain(routes.filter(route => route.data?.resource).map(route => route.data.resource)), expectedResources);
assert.equal(new Set(items.map(item => item.path)).size, items.length, 'Unique menu destinations');
assert.equal(new Set(routes.map(route => route.path)).size, routes.length, 'Unique routes');
assert.equal(routes.length, items.length + 5, 'Wildcard, visitor page, corporate editor, corporate groups and published reader are outside the static menu');
assert.equal(typeof routes.find(route => route.path === 'laboratorio/paginas/:pageId')?.loadComponent, 'function', 'Saved visitor pages resolve from their persistent local identity');
assert.deepEqual(plain(routes.at(-1)), { path: '**', redirectTo: '' });
for (const definition of definitions) {
  const route = routes.find(route => `/${route.path}` === definition.path);
  const item = items.find(item => item.path === definition.path);
  assert.ok(route && item, `Route/menu coverage: ${definition.path}`);
  assert.equal(typeof route.loadComponent, 'function');
  assert.equal(item.page, undefined, 'Menu does not expose page bindings');
  assert.equal(route.canActivate.length, definition.clearance ? 1 : 0);
  assert.equal(route.data?.clearance, definition.clearance);
  if (definition.page.kind === 'resource') {
    assert.equal(route.data.resource, definition.page.resource);
    assert.equal(typeof route.resolve.metadata, 'function');
    assert.equal(route.canActivate.length, definition.clearance ? 1 : 0);
    if (definition.clearance) {
      assert.equal(route.canActivate[0], guard);
      assert.equal(route.data.clearance, definition.clearance);
      assert.equal(item.badge, definition.clearance);
    }
  }
}
assert.equal(guardCalls, 0, 'Projecting navigation never runs guards');
assert.deepEqual(plain(routes.filter(route => route.canActivate?.length).map(route => route.path)),
  ['rh/folha-pagamento', 'suprimentos/contratos']);
const orders = routes.find(route => route.path === 'suprimentos/pedidos');
assert.equal(orders.data.title, 'Pedidos de Compra & Reposição');
assert.equal(orders.data.domain.icon, 'shopping_cart_checkout');
const ordersMenu = items.find(item => item.path === '/suprimentos/pedidos');
assert.equal(ordersMenu.label, 'Pedidos de Compra');
assert.equal(ordersMenu.icon, 'shopping_cart');
assert.deepEqual(plain(HERO_NAVIGATION.map(group => group.domainKey)),
  ['overview', 'rh', 'operations', 'assets', 'supplies', 'risk']);

// Exercise the actual guard with isolated DI; no session or backend authorization is implied.
let clearance = 'DEFCON 2';
const auth = { currentPersona: () => ({ name: 'Test persona', clearance, clearanceLevel: 'Display label' }) };
const router = { parseUrl: url => ({ redirect: url }) };
const authToken = {};
const routerToken = {};
const guardExports = {};
vm.runInNewContext(ts.transpileModule(
  fs.readFileSync(path.join(root, 'src/app/core/tactical-clearance.guard.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, {
  exports: guardExports,
  console: { warn() {} },
  require(id) {
    if (id === '@angular/core') return { inject: token => token === authToken ? auth : router };
    if (id === '@angular/router') return { Router: routerToken };
    if (id === './tactical-access') return load('src/app/core/tactical-access.ts');
    if (id === './auth-simulation.service') return { AuthSimulationService: authToken };
    throw new Error(`Unexpected guard dependency: ${id}`);
  },
});
for (const route of routes.filter(route => route.canActivate?.length)) {
  const denied = guardExports.tacticalClearanceGuard(route, { url: `/${route.path}` });
  assert.ok(denied.redirect.startsWith('/?authDenied=true&resource='));
  clearance = 'DEFCON 1';
  assert.equal(guardExports.tacticalClearanceGuard(route, { url: `/${route.path}` }), true);
  clearance = 'DEFCON 2';
}
assert.equal(guardExports.tacticalClearanceGuard({ data: {} }, { url: '/' }), true);

const shellSource = fs.readFileSync(path.join(root, 'src/app/shell/hero-app-shell.component.ts'), 'utf8');
const shellAst = ts.createSourceFile('shell.ts', shellSource, ts.ScriptTarget.Latest, true);
const shellClass = shellAst.statements.find(node =>
  ts.isClassDeclaration(node) && node.name?.text === 'HeroAppShellComponent');
const restrictionMethod = shellClass.members.find(member =>
  member.name?.getText(shellAst) === 'isItemRestricted');
const shellExports = {};
vm.runInNewContext(ts.transpileModule(
  `export class ShellHarness {
    authService = injectedAuth;
    ${restrictionMethod.getText(shellAst)}
  }`,
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, { exports: shellExports, injectedAuth: auth, canAccessTacticalPage: load('src/app/core/tactical-access.ts').canAccessTacticalPage });
const shell = new shellExports.ShellHarness();
assert.equal(shell.isItemRestricted({ badge: 'DEFCON 1' }), false, 'A badge alone is not an access rule');
assert.equal(shell.isItemRestricted({ clearance: 'DEFCON 1', badge: 'Different label' }), true);
clearance = 'DEFCON 1';
assert.equal(shell.isItemRestricted({ clearance: 'DEFCON 1' }), false);
// The same requirement must protect component pages too, including direct URL navigation.
cache.delete(path.resolve(root, 'src/app/app.routes.ts'));
cache.set(path.resolve(root, 'src/app/core/page-definitions.ts'), {
  HERO_PAGE_GROUPS: [{ items: [{
    path: '/protected-component', label: 'Protected component', description: 'Test',
    clearance: 'DEFCON 1',
    page: { kind: 'component', title: 'Protected component', loadComponent: () => Promise.resolve(null) },
  }] }],
});
const protectedRoute = load('src/app/app.routes.ts').routes.find(route => route.path === 'protected-component');
assert.equal(protectedRoute.canActivate[0], guard);
assert.equal(protectedRoute.data.clearance, 'DEFCON 1');
clearance = 'DEFCON 2';
assert.ok(guardExports.tacticalClearanceGuard(protectedRoute, { url: '/protected-component' }).redirect);
clearance = 'DEFCON 1';
assert.equal(guardExports.tacticalClearanceGuard(protectedRoute, { url: '/protected-component' }), true);
const { canAccessTacticalPage } = load('src/app/core/tactical-access.ts');
for (const [current, required, expected] of [
  ['DEFCON 1', 'DEFCON 1', true], ['DEFCON 1', 'DEFCON 2', true],
  ['DEFCON 2', 'DEFCON 1', false], ['DEFCON 2', 'DEFCON 2', true],
  [undefined, 'DEFCON 2', false], ['DEFCON 1', 'UNKNOWN', false],
]) {
  assert.equal(canAccessTacticalPage(current, required), expected);
  clearance = current;
  assert.equal(shell.isItemRestricted({ clearance: required }), !expected);
  const decision = guardExports.tacticalClearanceGuard({ data: { clearance: required } }, { url: '/probe' });
  assert.equal(decision === true, expected);
}
console.log('PASS: route/menu coverage, lazy projections, clearance bindings and editorial exceptions');
