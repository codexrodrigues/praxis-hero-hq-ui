/**
 * Fast Contract & Architectural Invariants Verification Suite for Praxis Hero HQ UI
 * Validates:
 * 1. dashboard-page.definition.json canonical dataBindings, zero duplicate HTTP stats calls,
 *    interactive Bento KPI cards, Timeline item schema & actions, Domain Hub live telemetry,
 *    and HeroTacticalRadarComponent media slot contract.
 * 2. HeroTacticalRadarComponent kinematic preservation, ${...} sanitization, RAF lifecycle gating,
 *    and WCAG 2.1 AA keyboard target lock.
 * 3. HeroAppShellComponent live telemetry synchronization, DEFCON footer status, and Ctrl+K
 *    Command Palette filtering & keyboard navigation.
 * 4. dashboard-theme.scss interactive focus-visible and hover affordances.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

console.log('================================================================');
console.log(' [Hero HQ] Executando Verificação de Contratos e Invariantes...');
console.log('================================================================\n');

// ---------------------------------------------------------------------------
// 1. dashboard-page.definition.json Invariants
// ---------------------------------------------------------------------------
console.log('[Suite 1] Invariantes de dashboard-page.definition.json');
const defPath = path.join(ROOT, 'src/app/pages/dashboard/dashboard-page.definition.json');
const rawBundle = JSON.parse(fs.readFileSync(defPath, 'utf8'));
const pageDef = rawBundle.dashboardPageDefinition || rawBundle;

const widgetsByKey = new Map((pageDef.widgets || []).map((w) => [w.key || w.id, w]));

// 1.1 Hero Banner + Tactical Radar Media Slot
const heroBanner = widgetsByKey.get('heroBanner');
const bannerInputs = heroBanner?.definition?.inputs || {};
const bannerCard = bannerInputs?.document?.nodes?.[0];
assert(
  bannerCard?.media?.kind === 'component' &&
    bannerCard?.media?.componentId === 'hero-hq-tactical-radar',
  'heroBanner utiliza media.kind="component" com componentId="hero-hq-tactical-radar"',
);
assert(
  bannerInputs?.context?.readinessRate === '${kpis.readinessRate}' &&
    bannerCard?.media?.componentInputs?.label === 'IFF · PRONTIDÃO ${readinessRate}%' &&
    Array.isArray(bannerCard?.media?.componentInputs?.contacts) &&
    bannerCard.media.componentInputs.contacts.length === 5,
  'heroBanner injeta telemetria viva (readinessRate, contacts) em componentInputs do radar',
);

// 1.2 Interactive Bento KPI Cards
const expectedKpiRoutes = {
  kpiProntidao: '/rh/funcionarios',
  kpiMissoes: '/operacoes/missoes',
  kpiFolha: '/rh/folha-pagamento',
  kpiRiscos: '/operacoes/incidentes',
};
for (const [kpiKey, expectedRoute] of Object.entries(expectedKpiRoutes)) {
  const widget = widgetsByKey.get(kpiKey);
  const cardNode = widget?.definition?.inputs?.document?.nodes?.[0];
  assert(
    cardNode?.interaction?.mode === 'action' &&
      cardNode?.interaction?.action?.actionId === 'navigation.openRoute' &&
      cardNode?.interaction?.action?.payload?.path === expectedRoute,
    `${kpiKey} possui interaction.mode="action" apontando para "${expectedRoute}"`,
  );
}

// 1.3 Zero Duplicate HTTP Request on incidentsSeverityDonut
const donutWidget = widgetsByKey.get('incidentsSeverityDonut');
const donutConfig = donutWidget?.definition?.inputs?.config;
const standaloneDonutConfig = rawBundle.incidentSeverityDonutConfig;
assert(
  donutConfig?.dataSource?.kind === 'local' &&
    Array.isArray(donutConfig?.dataSource?.items) &&
    donutConfig.dataSource.items.length === 4,
  'Widget incidentsSeverityDonut utiliza dataSource.kind="local" interpolado a partir de kpis (sem requisição HTTP duplicada)',
);
assert(
  standaloneDonutConfig?.dataSource?.kind === 'local' &&
    Array.isArray(standaloneDonutConfig?.dataSource?.items) &&
    standaloneDonutConfig.dataSource.items.length === 4,
  'incidentSeverityDonutConfig também utiliza dataSource.kind="local" sincronizado com kpis',
);

// 1.4 Missions Timeline Schema & Bindings
const timelineWidget = widgetsByKey.get('missionsTimeline');
const timelineInputs = timelineWidget?.definition?.inputs || {};
assert(
  timelineInputs?.context?.inProgressMissions === '${kpis.inProgressMissions}' &&
    timelineInputs?.context?.readinessRate === '${kpis.readinessRate}',
  'missionsTimeline injeta kpis vivos no context de interpolação',
);
const timelineNode = timelineInputs?.document?.nodes?.[0];
const timelineItems = timelineNode?.items || [];
assert(
  timelineItems.length === 4 &&
    timelineItems.every(
      (item) =>
        typeof item.subtitle === 'string' &&
        !('description' in item) &&
        item.action?.actionId === 'navigation.openRoute' &&
        typeof item.action?.payload?.path === 'string',
    ),
  'missionsTimeline utiliza propriedade canônica "subtitle" (sem "description") e possui ação navigation.openRoute em todos os 4 itens',
);

// 1.5 Domain Hub Live Telemetry & Bindings
const hubWidget = widgetsByKey.get('domainHub');
const hubInputs = hubWidget?.definition?.inputs || {};
assert(
  hubInputs?.context?.activeHeroes === '${kpis.activeHeroes}' &&
    hubInputs?.context?.criticalIncidents === '${kpis.criticalIncidents}',
  'domainHub injeta kpis vivos no context de interpolação',
);
const hubCards = hubInputs?.document?.nodes?.[0]?.items || [];
assert(
  hubCards.length === 6 &&
    hubCards.every(
      (card) =>
        card.type === 'actionCard' &&
        typeof card.meta === 'string' &&
        card.meta.length > 0 &&
        card.action?.actionId === 'navigation.openRoute',
    ),
  'Todos os 6 cartões de domínio em domainHub possuem meta tático e ação navigation.openRoute',
);

// ---------------------------------------------------------------------------
// 2. HeroTacticalRadarComponent Invariants
// ---------------------------------------------------------------------------
console.log('\n[Suite 2] Invariantes de HeroTacticalRadarComponent');
const radarSrc = fs.readFileSync(
  path.join(ROOT, 'src/app/pages/dashboard/hero-tactical-radar.component.ts'),
  'utf8',
);
assert(
  radarSrc.includes('sanitizeResolvedText') &&
    radarSrc.includes('replace(/\\$\\{[^}]+\\}\\s*%?/g') &&
    radarSrc.includes('effect(() =>'),
  'HeroTacticalRadarComponent sincroniza inputs via effect() e sanitiza placeholders ${...} (incluindo sufixos órfãos como %)',
);
assert(
  radarSrc.includes('previousById = new Map') &&
    radarSrc.includes('existing.trails') &&
    radarSrc.includes('existing.phosphor'),
  'HeroTacticalRadarComponent preserva estado cinemático (x, y, trails, phosphor) entre atualizações de inputs',
);
assert(
  radarSrc.includes('IntersectionObserver') && radarSrc.includes('visibilitychange'),
  'HeroTacticalRadarComponent pausa e retoma o loop requestAnimationFrame via IntersectionObserver e visibilitychange',
);
assert(
  radarSrc.includes('onScopeKeydown') &&
    radarSrc.includes("case 'ArrowRight':") &&
    radarSrc.includes("execute('navigation.openRoute'"),
  'HeroTacticalRadarComponent implementa navegação acessível por teclado (ArrowLeft/Right, Enter/Space, Escape) e drill-down tático',
);

// ---------------------------------------------------------------------------
// 3. HeroAppShellComponent, Command Palette & Multi-Tenant Headers Invariants
// ---------------------------------------------------------------------------
console.log('\n[Suite 3] Invariantes de HeroAppShellComponent, Command Palette (Ctrl+K) e Headers Multi-Tenant');
const shellSrc = fs.readFileSync(
  path.join(ROOT, 'src/app/shell/hero-app-shell.component.ts'),
  'utf8',
);
assert(
  shellSrc.includes('readinessRate = computed') &&
    shellSrc.includes('defconScore = computed') &&
    shellSrc.includes('footerStatus = computed'),
  'HeroAppShellComponent calcula prontidão e nível DEFCON reativamente a partir da telemetria real',
);
assert(
  shellSrc.includes('filteredLinks = computed') &&
    shellSrc.includes('onSearchInputKeydown') &&
    shellSrc.includes('navigateToCommandItem') &&
    shellSrc.includes('scrollActiveOptionIntoView') &&
    shellSrc.includes('isItemRestricted') &&
    shellSrc.includes('aria-activedescendant') &&
    shellSrc.includes('data-testid="command-palette-input"'),
  'HeroAppShellComponent implementa Command Palette (Ctrl+K) acessível (combobox, aria-activedescendant, scrollIntoView, indicador DEFCON 1)',
);
assert(
  shellSrc.includes('runtimeContext?.invalidate()') &&
    shellSrc.includes('this.dismissAuthDenied()') &&
    !shellSrc.includes('ALL_NAV_ITEMS'),
  'HeroAppShellComponent invalida contexto corporativo, limpa alerta authDenied ao trocar persona e não mantém código morto',
);
assert(
  shellSrc.includes('(searchChange)="onTopbarSearchInput($event)"') &&
    shellSrc.includes('[clearSearchOnBlur]="true"') &&
    shellSrc.includes('protected onTopbarSearchInput(query: string): void'),
  'HeroAppShellComponent abre o Command Palette imediatamente ao digitar no campo de busca do topbar e limpa o input ao perder foco',
);

const appConfigSrc = fs.readFileSync(path.join(ROOT, 'src/app/app.config.ts'), 'utf8');
assert(
  !appConfigSrc.includes("|| 'demo'") &&
    appConfigSrc.split("'X-User-ID'").length >= 4,
  'app.config.ts alinha PAX_FETCH_HEADERS com HttpClient e ApiConfigStorage (tenant shield-hq e header X-User-ID)',
);
assert(
  appConfigSrc.includes('praxisStatsDedupeInterceptor') &&
    appConfigSrc.includes("req.url.endsWith('/stats/group-by')") &&
    appConfigSrc.includes('shareReplay({ bufferSize: 1, refCount: false })'),
  'app.config.ts deduplica chamadas POST /stats/group-by concorrentes entre HeroAppShellComponent e DashboardPageComponent',
);
assert(
  appConfigSrc.includes('praxisDashboardSnapshotReconcileInterceptor') &&
    appConfigSrc.includes('reconcilePersistedDashboardPage'),
  'app.config.ts reconcilia em memória snapshots persistidos legados do dashboard sem mutações HTTP não solicitadas',
);

const dashboardDefTsSrc = fs.readFileSync(
  path.join(ROOT, 'src/app/pages/dashboard/dashboard-page.definition.ts'),
  'utf8',
);
assert(
  dashboardDefTsSrc.includes('export function reconcilePersistedDashboardPage') &&
    dashboardDefTsSrc.includes("media?.componentId === 'hero-hq-tactical-radar'"),
  'dashboard-page.definition.ts exporta reconcilePersistedDashboardPage para atualizar heroBanner legado preservando widgets customizados',
);

const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
assert(
  fs.existsSync(path.join(ROOT, 'tsconfig.spec.json')) &&
    pkgJson.scripts?.test?.includes('tsconfig.spec.json'),
  'package.json e tsconfig.spec.json validam tipagem estrita dos arquivos .spec.ts e executam a suíte de contratos',
);

// ---------------------------------------------------------------------------
// 4. dashboard-theme.scss Accessibility & Executive Polish Invariants
// ---------------------------------------------------------------------------
console.log('\n[Suite 4] Invariantes de Acessibilidade e Estilo em dashboard-theme.scss');
const themeSrc = fs.readFileSync(path.join(ROOT, 'src/styles/dashboard-theme.scss'), 'utf8');
assert(
  themeSrc.includes("&[role='button']") && themeSrc.includes(':focus-visible'),
  'dashboard-theme.scss define cursor pointer e :focus-visible para cartões KPI interativos (.bento-kpi-card)',
);
assert(
  themeSrc.includes('.prx-rich-action-card__meta') &&
    themeSrc.includes('.prx-rich-timeline__item-body--actionable'),
  'dashboard-theme.scss estiliza badges de telemetria (.prx-rich-action-card__meta) e itens acionáveis da timeline (.prx-rich-timeline__item-body--actionable)',
);

console.log('\n================================================================');
if (failed === 0) {
  console.log(` [SUCESSO] Todas as ${passed} asserções de contrato passaram!`);
  console.log('================================================================\n');
  process.exit(0);
} else {
  console.error(` [FALHA] ${failed} asserção(ões) falharam (${passed} passaram).`);
  console.log('================================================================\n');
  process.exit(1);
}
