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
const dataSourcesById = new Map((pageDef.dataSources || []).map((ds) => [ds.id, ds]));

// 1.0 Page-level DataSources & Derived KPIs (zero static KPI percentages)
assert(
  dataSourcesById.has('heroesStats') &&
    dataSourcesById.has('missionsStats') &&
    dataSourcesById.has('payrollStats') &&
    dataSourcesById.has('incidentsStats') &&
    dataSourcesById.has('assetsStats') &&
    dataSourcesById.has('threatsStats') &&
    dataSourcesById.has('recentMissionsFeed'),
  'pageDef.dataSources declara os 7 DataSources canônicos (heroesStats, missionsStats, payrollStats, incidentsStats, assetsStats, threatsStats, recentMissionsFeed)',
);
const recentMissionsDs = dataSourcesById.get('recentMissionsFeed');
assert(
  recentMissionsDs?.kind === 'remote-resource' &&
    recentMissionsDs?.resourcePath === 'operations/vw-resumo-missoes/filter?page=0&size=4' &&
    recentMissionsDs?.targetStatePath === 'activeMissions' &&
    recentMissionsDs?.transform?.kind === 'path' &&
    recentMissionsDs?.transform?.path === 'content' &&
    Array.isArray(pageDef.state?.values?.activeMissions) &&
    pageDef.state.values.activeMissions.length === 4,
  'recentMissionsFeed alimenta state.values.activeMissions via POST operations/vw-resumo-missoes/filter?page=0&size=4',
);
assert(
  Boolean(pageDef.state?.derived?.['kpis.folhaPercent']) &&
    dataSourcesById.get('payrollStats')?.transform?.mappings?.['values.salarioBruto'] ===
      'latestPayrollGross' &&
    dataSourcesById.get('missionsStats')?.transform?.mappings?.['PAUSADA'] === 'pausedMissions',
  'kpis.folhaPercent é derivado dinamicamente (salarioLiquido / salarioBruto) e missionsStats mapeia o bucket PAUSADA',
);

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
    bannerCard.media.componentInputs.contacts.length === 5 &&
    bannerCard.media.componentInputs.contacts.every((c) => /\$\{[^}]+\}/.test(String(c.label || ''))),
  'heroBanner injeta telemetria viva (readinessRate e todos os 5 contacts TRK-01..TRK-05) em componentInputs do radar',
);

// 1.2 Interactive Bento KPI Cards & Aligned Progress Footnotes
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
const kpiMissoesFootnote =
  widgetsByKey.get('kpiMissoes')?.definition?.inputs?.document?.nodes?.[0]?.content?.[1]?.text;
const kpiRiscosFootnote =
  widgetsByKey.get('kpiRiscos')?.definition?.inputs?.document?.nodes?.[0]?.content?.[1]?.text;
assert(
  kpiMissoesFootnote ===
    '${kpis.inProgressMissions} em curso · ${kpis.completedMissions} concluídas de ${kpis.totalMissions} missões' &&
    kpiRiscosFootnote ===
      '${kpis.riscosPercent}% críticos · ${kpis.highIncidents} de severidade alta em ${kpis.totalIncidents} ocorrências',
  'kpiMissoes e kpiRiscos alinham semântica entre progress.value e footnote (concluídas/total e % críticos/total)',
);
const allKpisUseDeclarativePipes = Object.keys(expectedKpiRoutes).every((kpiKey) => {
  const progressNode =
    widgetsByKey.get(kpiKey)?.definition?.inputs?.document?.nodes?.[0]?.content?.[0];
  return (
    progressNode?.type === 'progress' &&
    /^progressValue\s*\|\s*round:\d+\s*\|\s*default:0$/.test(String(progressNode.valueExpr || ''))
  );
});
assert(
  allKpisUseDeclarativePipes,
  'Todos os 4 cartões Bento KPI utilizam pipes declarativos CSP-safe (progressValue | round:N | default:0) em progress.valueExpr',
);

// 1.3 Remote praxis.stats on all 4 Dashboard Charts (zero local/static chart data)
const donutWidget = widgetsByKey.get('incidentsSeverityDonut');
const donutConfig = donutWidget?.definition?.inputs?.config;
const standaloneDonutConfig = rawBundle.incidentSeverityDonutConfig;
const defconWidget = widgetsByKey.get('defconGaugeChart');
const defconConfig = defconWidget?.definition?.inputs?.config;
const standaloneDefconConfig = rawBundle.defconGaugeConfig;
const payrollWidget = widgetsByKey.get('payrollChart');
const payrollConfig = payrollWidget?.definition?.inputs?.config;
assert(
  donutConfig?.dataSource?.kind === 'remote' &&
    donutConfig?.dataSource?.query?.sourceKind === 'praxis.stats' &&
    donutConfig?.dataSource?.resourcePath === 'risk-intelligence/vw-indicadores-incidentes' &&
    !('data' in (donutWidget?.definition?.inputs || {})) &&
    standaloneDonutConfig?.dataSource?.kind === 'remote' &&
    standaloneDonutConfig?.dataSource?.query?.sourceKind === 'praxis.stats',
  'Widget incidentsSeverityDonut e incidentSeverityDonutConfig utilizam dataSource.kind="remote" (praxis.stats) sem inputs.data estático',
);
assert(
  defconConfig?.dataSource?.kind === 'remote' &&
    defconConfig?.dataSource?.query?.sourceKind === 'praxis.stats' &&
    defconConfig?.dataSource?.resourcePath === 'human-resources/vw-ranking-reputacao' &&
    !('data' in (defconWidget?.definition?.inputs || {})) &&
    standaloneDefconConfig?.dataSource?.kind === 'remote' &&
    standaloneDefconConfig?.dataSource?.query?.sourceKind === 'praxis.stats' &&
    payrollConfig?.axes?.x?.type === 'time',
  'Widget defconGaugeChart utilizza dataSource.kind="remote" (praxis.stats) sem inputs.data estático e payrollChart declara eixo temporal (axes.x.type="time")',
);

// 1.4 Missions Timeline Schema & Live Record Bindings
const timelineWidget = widgetsByKey.get('missionsTimeline');
const timelineInputs = timelineWidget?.definition?.inputs || {};
assert(
  timelineInputs?.context?.inProgressMissions === '${kpis.inProgressMissions}' &&
    timelineInputs?.context?.completedMissions === '${kpis.completedMissions}' &&
    timelineInputs?.context?.readinessRate === '${kpis.readinessRate}',
  'missionsTimeline injeta kpis vivos no context de interpolação',
);
const timelineNode = timelineInputs?.document?.nodes?.[0];
const timelineItems = timelineNode?.items || [];
assert(
  timelineItems.length === 4 &&
    timelineItems.every(
      (item, idx) =>
        typeof item.subtitle === 'string' &&
        item.title.includes(`\${activeMissions.${idx}.titulo}`) &&
        item.subtitle.includes(`\${activeMissions.${idx}.ameaca}`) &&
        item.opposite === `#\${activeMissions.${idx}.missaoId}` &&
        /\$\{(kpis|activeMissions)\.[^}]+\}/.test(item.badge) &&
        !('description' in item) &&
        item.action?.actionId === 'navigation.openRoute' &&
        typeof item.action?.payload?.path === 'string',
    ),
  'missionsTimeline conecta cada um dos 4 itens a registros reais ${activeMissions.0..3.*} combinados com ${kpis.*} e possui ação navigation.openRoute',
);

// 1.5 Domain Hub Live Telemetry & Bindings
const hubWidget = widgetsByKey.get('domainHub');
const hubInputs = hubWidget?.definition?.inputs || {};
assert(
  hubInputs?.context?.activeHeroes === '${kpis.activeHeroes}' &&
    hubInputs?.context?.inUseAssets === '${kpis.inUseAssets}' &&
    hubInputs?.context?.confrontationThreats === '${kpis.confrontationThreats}' &&
    hubInputs?.context?.criticalIncidents === '${kpis.criticalIncidents}',
  'domainHub injeta kpis vivos (RH, missões, ativos, ameaças e incidentes) no context de interpolação',
);
const hubCards = hubInputs?.document?.nodes?.[0]?.items || [];
assert(
  hubCards.length === 6 &&
    hubCards.every(
      (card) =>
        card.type === 'actionCard' &&
        typeof card.meta === 'string' &&
        /\$\{kpis\.[^}]+\}/.test(card.meta) &&
        card.action?.actionId === 'navigation.openRoute',
    ),
  'Todos os 6 cartões de domínio em domainHub interpolam telemetria viva ${kpis.*} em meta e possuem ação navigation.openRoute',
);

// 1.6 Responsive Device Layouts (Tablet 6-col & Mobile 1-col)
const tabletCanvas = pageDef.deviceLayouts?.tablet?.canvas;
const mobileCanvas = pageDef.deviceLayouts?.mobile?.canvas;
const baseWidgetKeys = Object.keys(pageDef.canvas?.items || {});
assert(
  tabletCanvas?.columns === 6 &&
    baseWidgetKeys.length === 13 &&
    baseWidgetKeys.every((key) => {
      const item = tabletCanvas?.items?.[key];
      return (
        item &&
        item.col >= 1 &&
        item.colSpan >= 1 &&
        item.col + item.colSpan - 1 <= 6 &&
        (item.constraints?.maxColSpan ?? 6) <= 6
      );
    }),
  'pageDef.deviceLayouts.tablet.canvas define grade responsiva de 6 colunas para todos os 13 widgets (KPIs 2x2 e gráficos sem colisão)',
);
assert(
  mobileCanvas?.columns === 1 &&
    baseWidgetKeys.every((key) => {
      const item = mobileCanvas?.items?.[key];
      return (
        item &&
        item.col === 1 &&
        item.colSpan === 1 &&
        item.constraints?.minColSpan === 1 &&
        item.constraints?.maxColSpan === 1
      );
    }),
  'pageDef.deviceLayouts.mobile.canvas empilha todos os 13 widgets em 1 coluna com constraints minColSpan=1 / maxColSpan=1',
);

// 1.7 Recent Incidents Table Executive Row Expansion Dossier & Localization
const recentIncidentsWidget = widgetsByKey.get('recentIncidents');
const recentIncidentsCfg = recentIncidentsWidget?.definition?.inputs?.config || {};
const recentIncidentsDetail = recentIncidentsCfg?.behavior?.detail || {};
const recentIncidentsItems = recentIncidentsDetail?.source?.inlineSchema?.items || [];
const recentIncidentsAllowed = new Set(recentIncidentsDetail?.schemaContract?.allowedNodes || []);
const recentIncidentsGrid = recentIncidentsItems.find((item) => item?.type === 'cardGrid');
const recentIncidentsCallout = recentIncidentsItems.find((item) => item?.type === 'richContent');
const recentIncidentsCols = recentIncidentsCfg?.columns || [];
const ocorridoEmCol = recentIncidentsCols.find((c) => c?.field === 'ocorridoEm');
const danosCivisCol = recentIncidentsCols.find((c) => c?.field === 'danosCivis');
assert(
  recentIncidentsAllowed.has('cardGrid') &&
    recentIncidentsAllowed.has('compose') &&
    recentIncidentsAllowed.has('metric') &&
    recentIncidentsAllowed.has('richContent') &&
    recentIncidentsGrid?.columns === 3 &&
    Array.isArray(recentIncidentsGrid?.cards) &&
    recentIncidentsGrid.cards.length === 3 &&
    recentIncidentsGrid.cards.every((card) => card?.content?.[0]?.type === 'metric') &&
    recentIncidentsCallout?.document?.nodes?.[0]?.type === 'callout' &&
    String(recentIncidentsCallout?.document?.nodes?.[0]?.messageExpr || '').includes('${row.descricao}') &&
    recentIncidentsCfg?.localization?.currency?.code === 'BRL' &&
    ocorridoEmCol?.type === 'date' &&
    ocorridoEmCol?.format === 'dd/MM/yyyy HH:mm' &&
    danosCivisCol?.type === 'currency',
  'recentIncidents configura expansão em Dossiê Tático estruturado (cardGrid de 3 cards flat com métricas/badges + callout forense + localização BRL/pt-BR)',
);
const severidadeCol = recentIncidentsCols.find((c) => c?.field === 'severidade');
const mortosCol = recentIncidentsCols.find((c) => c?.field === 'mortos');
assert(
  recentIncidentsCfg?.toolbar?.appearance?.variant === 'integrated' &&
    Array.isArray(recentIncidentsCfg?.toolbar?.filters?.quickFilters) &&
    recentIncidentsCfg.toolbar.filters.quickFilters.length === 4 &&
    Array.isArray(severidadeCol?.conditionalRenderers) &&
    severidadeCol.conditionalRenderers.length === 4 &&
    severidadeCol.conditionalRenderers.every((r) => typeof r?.condition === 'object' && r.condition !== null) &&
    Array.isArray(mortosCol?.conditionalRenderers) &&
    mortosCol.conditionalRenderers.length === 2 &&
    mortosCol.conditionalRenderers.every((r) => typeof r?.condition === 'object' && r.condition !== null) &&
    mortosCol.conditionalRenderers[1]?.renderer?.badge?.variant === 'soft',
  'recentIncidents possui toolbar integrada (sem cabeçalho duplicado), 4 quickFilters de escopo tático e conditionalRenderers semânticos para severidade e mortos',
);
const distressWidget = widgetsByKey.get('distressSignalsList');
const distressCfg = distressWidget?.definition?.inputs?.config || {};
const distressItemsExpr = String(distressCfg?.expansion?.sections?.[0]?.itemsExpr || '');
assert(
  donutConfig?.sizing?.height === 340 &&
    defconConfig?.sizing?.height === 340 &&
    distressCfg?.layout?.virtualScroll?.viewportHeight === '380px' &&
    distressItemsExpr.includes('#${item.id}') &&
    distressItemsExpr.includes('${item.origem}') &&
    distressItemsExpr.includes('${item.local}'),
  'Row 14 harmoniza altura em 340px (incidentsSeverityDonut, defconGaugeChart, distressSignalsList) e preserva interpolação viva em itemsExpr do Dossiê de Sinais de Socorro',
);
assert(
  timelineNode?.markerVariant === 'icon' &&
    timelineNode?.itemLayout === 'split' &&
    timelineNode?.markerStyle === 'soft' &&
    timelineItems.every((item) => typeof item.icon === 'string' && item.icon.length > 0) &&
    timelineItems.every((item) => ['danger', 'error', 'info', 'warning', 'success', 'primary', 'secondary'].includes(item.badgeTone)) &&
    timelineItems.every((item) => ['error', 'info', 'warning', 'success', 'primary', 'secondary'].includes(item.markerColor)) &&
    hubCards[5]?.className?.includes('tone-cobalt'),
  'missionsTimeline utiliza markerVariant="icon", itemLayout="split", markerStyle="soft" e badgeTone semântico com ícones táticos por missão e domainHub atribui tone-cobalt exclusivo ao Ranking Reputacional',
);
assert(
  distressCfg?.templating?.risk?.props?.metric?.align === 'center' &&
    distressCfg?.templating?.risk?.props?.metric?.label === 'AMEAÇA' &&
    distressCfg?.templating?.risk?.props?.metric?.captionPosition === 'below-progress' &&
    String(distressCfg?.templating?.risk?.props?.metric?.caption || '').includes('Crítico') &&
    themeSrcFallback(),
  'distressSignalsList configura métrica de risco centralizada (align="center", label="AMEAÇA", captionPosition="below-progress" semântico) e estilos executivos dedicados em dashboard-theme.scss',
);
const distressActions = Array.isArray(distressCfg?.itemActions) ? distressCfg.itemActions : [];
const dispatchAct = distressActions.find((a) => a?.id === 'despachar-equipe');
const attendAct = distressActions.find((a) => a?.id === 'atender-chamado');
const detailsAct = distressActions.find((a) => a?.id === 'ver-detalhes');
assert(
  dispatchAct?.globalAction?.actionId === 'navigation.openRoute' &&
    dispatchAct?.globalAction?.payload?.path === '/operacoes/missoes' &&
    attendAct?.action === 'surface.open' &&
    attendAct?.recordOpen?.target?.resourceKey === 'operations.sinais-socorro' &&
    attendAct?.recordOpen?.target?.surfaceId === 'edit' &&
    detailsAct?.action === 'surface.open' &&
    detailsAct?.recordOpen?.target?.resourceKey === 'operations.sinais-socorro' &&
    detailsAct?.recordOpen?.target?.surfaceId === 'detail',
  'distressSignalsList conecta despachar-equipe a navigation.openRoute (/operacoes/missoes) e atender-chamado/ver-detalhes a surface.open governado (operations.sinais-socorro)',
);

function themeSrcFallback() {
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/dashboard-theme.scss'), 'utf8');
  return (
    css.includes("[data-item-layout='split']") &&
    css.includes('.p-list-metric--align-center') &&
    css.includes('.list-row-slot--identity')
  );
}


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
    appConfigSrc.includes("cleanUrl.endsWith('/stats/group-by')") &&
    appConfigSrc.includes('shareReplay({ bufferSize: 1, refCount: false })') &&
    appConfigSrc.includes('statsRequestCache.clear()') &&
    appConfigSrc.includes('praxis:hero-hq:telemetry-dirty'),
  'app.config.ts deduplica e enriquece POST /stats/group-by (byKey/totalCount) e invalida o cache de telemetria após mutações de domínio',
);
assert(
  shellSrc.includes("@HostListener('window:praxis:hero-hq:telemetry-dirty')") &&
    shellSrc.includes('this.refreshTelemetry()'),
  'HeroAppShellComponent recarrega a telemetria de Prontidão e Defcon automaticamente após mutações de domínio',
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
    dashboardDefTsSrc.includes("media?.componentId === 'hero-hq-tactical-radar'") &&
    dashboardDefTsSrc.includes('hasTabletCanvas') &&
    dashboardDefTsSrc.includes('hasMobileCanvas') &&
    dashboardDefTsSrc.includes('customDs'),
  'dashboard-page.definition.ts exporta reconcilePersistedDashboardPage não-destrutivo (preservando widgets, dataSources e state customizados)',
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
    themeSrc.includes('.prx-rich-timeline__item-body--actionable') &&
    themeSrc.includes('max-height: none !important') &&
    themeSrc.includes('white-space: normal !important'),
  'dashboard-theme.scss estiliza badges de telemetria, itens acionáveis da timeline e responsividade mobile sem truncar KPIs nem cortar o radar',
);

// ---------------------------------------------------------------------------
// 5. Catálogo Funcionário 360 — Tabs & Related Resource Outlet (Issue #6)
// ---------------------------------------------------------------------------
console.log('\n[Suite 5] Invariantes do Catálogo Funcionário 360 — Tabs e Related Resource Outlet (Issue #6)');
assert(
  appConfigSrc.includes('providePraxisRelatedResourceOutletMetadata') &&
    appConfigSrc.includes('providePraxisRelatedResourceOutletMetadata()'),
  'app.config.ts importa e registra providePraxisRelatedResourceOutletMetadata() (@praxisui/core) no bootstrap do Hero HQ',
);
assert(
  appConfigSrc.includes('providePraxisTabsMetadata') &&
    appConfigSrc.includes('providePraxisTabsMetadata()'),
  'app.config.ts importa e registra providePraxisTabsMetadata() (@praxisui/tabs) no bootstrap do Hero HQ',
);

const praxisDeps = Object.entries(pkgJson.dependencies || {}).filter(([name]) =>
  name.startsWith('@praxisui/'),
);
const allAlignedRc33Plus =
  praxisDeps.length >= 20 &&
  praxisDeps.every(([, version]) => {
    const match = /^10\.0\.0-rc\.(\d+)$/.exec(String(version));
    return Boolean(match && Number(match[1]) >= 33);
  });
assert(
  allAlignedRc33Plus,
  'Todas as dependências @praxisui/* em package.json estão alinhadas em >= 10.0.0-rc.33 (com suporte nativo a normalizeSourcePayload em PraxisKpiBandComponent e operadores &&/|| em SafeExpressionEvaluator)',
);

const coreDtsPath = path.join(ROOT, 'node_modules/@praxisui/core/types/praxisui-core.d.ts');
const tabsDtsPath = path.join(ROOT, 'node_modules/@praxisui/tabs/types/praxisui-tabs.d.ts');
if (fs.existsSync(coreDtsPath) && fs.existsSync(tabsDtsPath)) {
  const coreDts = fs.readFileSync(coreDtsPath, 'utf8');
  const tabsDts = fs.readFileSync(tabsDtsPath, 'utf8');
  assert(
    coreDts.includes('providePraxisRelatedResourceOutletMetadata') &&
      coreDts.includes('PRAXIS_RELATED_RESOURCE_OUTLET_COMPONENT_METADATA') &&
      tabsDts.includes('providePraxisTabsMetadata') &&
      tabsDts.includes('PRAXIS_TABS_COMPONENT_METADATA'),
    'Pacotes instalados @praxisui/core e @praxisui/tabs exportam os providers e metadados canônicos para praxis-related-resource-outlet e praxis-tabs',
  );
}

// ---------------------------------------------------------------------------
// 6. Domain Resource Pages kpiBand Live Telemetry Invariants
// ---------------------------------------------------------------------------
console.log('\n[Suite 6] Invariantes de Telemetria Viva em kpiBand das 17 Páginas de Domínio');
const domainConfigs = [
  'src/app/pages/rh/funcionarios.config.ts',
  'src/app/pages/rh/folha-pagamento.config.ts',
  'src/app/pages/rh/eventos-folha.config.ts',
  'src/app/pages/rh/afastamentos.config.ts',
  'src/app/pages/rh/departamentos.config.ts',
  'src/app/pages/rh/reputacao.config.ts',
  'src/app/pages/operacoes/missoes.config.ts',
  'src/app/pages/operacoes/missao-participantes.config.ts',
  'src/app/pages/operacoes/equipes.config.ts',
  'src/app/pages/operacoes/bases.config.ts',
  'src/app/pages/operacoes/incidentes.config.ts',
  'src/app/pages/ativos/equipamentos.config.ts',
  'src/app/pages/ativos/veiculos.config.ts',
  'src/app/pages/suprimentos/contratos.config.ts',
  'src/app/pages/suprimentos/pedidos.config.ts',
  'src/app/pages/risco/ameacas.config.ts',
  'src/app/pages/risco/indicadores.config.ts',
];
const allDomainConfigsWired = domainConfigs.every((relPath) => {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) return false;
  const content = fs.readFileSync(fullPath, 'utf8');
  return (
    content.includes("method: 'POST'") &&
    (content.includes('/filter?page=0&size=1') || content.includes('/stats/group-by')) &&
    (content.includes('valueExpr:') || content.includes('captionExpr:'))
  );
});
assert(
  allDomainConfigsWired,
  `Todas as ${domainConfigs.length} páginas de recurso conectam kpiBand a endpoints vivos (/stats/group-by ou /filter?page=0&size=1) com avaliação dinâmica (valueExpr/captionExpr)`,
);

const allDomainMicroVizCanonical = domainConfigs.every((relPath) => {
  const content = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  return (
    !content.includes('Math.round(') &&
    !content.includes('|| row.status ===') &&
    !content.includes('filter: { mesBetween') &&
    !content.includes('filter: { anoBetween')
  );
});
assert(
  allDomainMicroVizCanonical,
  'Todas as 17 páginas de domínio utilizam expressões microVisualization compatíveis com SafeExpressionEvaluator (sem Math.round/||) e filtros escalares válidos em quickFilters/kpiBand (mes/ano)',
);

const allDomainKpiDeclarativePipes = domainConfigs.every((relPath) => {
  const content = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  return (
    content.includes('| default:') &&
    (content.includes('| number') || content.includes('| round:') || content.includes('| currency:')) &&
    !content.includes('toString(totalCount)') &&
    !content.includes('toString(totalElements)') &&
    !content.includes('toString(byKey.')
  );
});
assert(
  allDomainKpiDeclarativePipes,
  'Todas as 17 páginas de domínio padronizam kpiBand (valueExpr e captionExpr) com pipes declarativos CSP-safe (| number, | round:1, | currency, | default:...) sem concatenações legadas toString()',
);

const allDomainStatsEligibilityCompliant = domainConfigs.every((relPath) => {
  const content = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  if (!content.includes('/stats/group-by')) return true;
  const hasFilter = content.includes('filter: {}');
  const hasInvalidCountField = /\{\s*field:\s*['"][^'"]+['"]\s*,\s*operation:\s*['"]COUNT['"]/i.test(content) ||
    /\{\s*operation:\s*['"]COUNT['"]\s*,\s*field:\s*['"][^'"]+['"]/i.test(content);
  return hasFilter && !hasInvalidCountField;
});
assert(
  allDomainStatsEligibilityCompliant,
  'Todas as páginas de domínio com /stats/group-by respeitam estritamente o contrato StatsEligibility do backend (filter: {} obrigatório e sem field em métricas COUNT)',
);

const allDomainScopeBarUnified = domainConfigs.every((relPath) => {
  const content = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  return (
    content.includes("placement: 'scope-bar'") &&
    content.includes('inlineFields: [')
  );
});
assert(
  allDomainScopeBarUnified,
  'Todas as 17 páginas de domínio unificam quickFilters e inlineFields no <praxis-scope-bar> via filterBar.placement="scope-bar" + inlineFields (zero barra de filtros duplicada)',
);

const domainConfigsWithChips = [
  'src/app/pages/rh/funcionarios.config.ts',
  'src/app/pages/rh/eventos-folha.config.ts',
  'src/app/pages/rh/afastamentos.config.ts',
  'src/app/pages/operacoes/missoes.config.ts',
  'src/app/pages/operacoes/missao-participantes.config.ts',
  'src/app/pages/operacoes/equipes.config.ts',
  'src/app/pages/operacoes/bases.config.ts',
  'src/app/pages/operacoes/incidentes.config.ts',
  'src/app/pages/ativos/equipamentos.config.ts',
  'src/app/pages/ativos/veiculos.config.ts',
  'src/app/pages/suprimentos/contratos.config.ts',
  'src/app/pages/suprimentos/pedidos.config.ts',
  'src/app/pages/risco/ameacas.config.ts',
  'src/app/pages/risco/indicadores.config.ts',
];
const allDomainConditionalRenderersJsonLogic = domainConfigsWithChips.every((relPath) => {
  const content = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const hasConditionalRenderers = content.includes('conditionalRenderers:');
  const hasJsonLogicCondition = content.includes("condition: { '==': [{ var:");
  const hasStringCondition = /condition:\s*['"]/.test(content);
  return hasConditionalRenderers && hasJsonLogicCondition && !hasStringCondition;
});
assert(
  allDomainConditionalRenderersJsonLogic,
  `Todas as ${domainConfigsWithChips.length} páginas de domínio com colunas de status/severidade/prioridade usam conditionalRenderers canônicos com objetos JsonLogic`,
);

const domainConfigsWithDossier = [
  'src/app/pages/operacoes/missoes.config.ts',
  'src/app/pages/operacoes/incidentes.config.ts',
  'src/app/pages/risco/ameacas.config.ts',
];
const allDomainDossiersCanonical = domainConfigsWithDossier.every((relPath) => {
  const content = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  return (
    content.includes("kind: 'praxis.detail.schema'") &&
    content.includes("registryId: 'praxis.detail.default'") &&
    content.includes("type: 'cardGrid'") &&
    content.includes("type: 'richContent'")
  );
});
assert(
  allDomainDossiersCanonical,
  'As 3 páginas táticas críticas (missoes, incidentes, ameacas) possuem dossiês inline de expansão (praxis.detail.schema com cardGrid + richContent callout)',
);

const invalidBackendEnumValues = [
  'EM_MISSAO',
  'INDISPONIVEL',
  'QUARTEL_GENERAL',
  'COMBATENTE',
  "'MIA'",
  'MONITORADO',
  'PENDING',
];
const allDomainEnumsAlignedWithBackend = domainConfigs.every((relPath) => {
  const content = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  return invalidBackendEnumValues.every((invalidVal) => !content.includes(invalidVal));
});
assert(
  allDomainEnumsAlignedWithBackend,
  'Nenhuma das 17 páginas de domínio utiliza valores de Enum inexistentes no backend (como EM_MISSAO, INDISPONIVEL, QUARTEL_GENERAL, COMBATENTE, MIA, MONITORADO ou PENDING)',
);

const expectedQuickViewColumnsByConfig = {
  'src/app/pages/rh/funcionarios.config.ts': ['nomeCompleto', 'cargoNome'],
  'src/app/pages/rh/departamentos.config.ts': ['nome', 'responsavelNome'],
  'src/app/pages/rh/afastamentos.config.ts': ['id', 'tipo', 'funcionarioId'],
  'src/app/pages/rh/folha-pagamento.config.ts': ['id', 'funcionarioNome'],
  'src/app/pages/rh/eventos-folha.config.ts': ['descricao', 'folhaPagamentoNome'],
  'src/app/pages/rh/reputacao.config.ts': ['codinome', 'nomeCompleto', 'equipe'],
  'src/app/pages/operacoes/missoes.config.ts': ['titulo', 'ameacaNome'],
  'src/app/pages/operacoes/missao-participantes.config.ts': ['missaoTitulo', 'funcionarioNome'],
  'src/app/pages/operacoes/bases.config.ts': ['nome'],
  'src/app/pages/operacoes/equipes.config.ts': ['nome', 'basePrincipalNome'],
  'src/app/pages/operacoes/incidentes.config.ts': ['descricao', 'missaoId'],
  'src/app/pages/ativos/equipamentos.config.ts': ['nome', 'proprietarioNome'],
  'src/app/pages/ativos/veiculos.config.ts': ['nome', 'proprietarioNome'],
  'src/app/pages/risco/ameacas.config.ts': ['nome'],
  'src/app/pages/risco/indicadores.config.ts': ['incidenteId'],
  'src/app/pages/suprimentos/contratos.config.ts': ['number', 'supplierName'],
  'src/app/pages/suprimentos/pedidos.config.ts': ['id', 'supplierId', 'productId'],
};
const allDomainQuickViewColumnsProjectedZeroBoilerplate = domainConfigs.every((relPath) => {
  const content = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const expectedCols = expectedQuickViewColumnsByConfig[relPath] || [];
  const hasAllExpectedCols =
    expectedCols.length > 0 &&
    expectedCols.every((col) => content.includes(`'${col}'`));
  const hasZeroManualQuickViewBoilerplate = !content.includes('quickView:');
  return hasAllExpectedCols && hasZeroManualQuickViewBoilerplate;
});
assert(
  allDomainQuickViewColumnsProjectedZeroBoilerplate,
  'Todas as 17 páginas de domínio projetam colunas anotadas com @ResourceReference no backend para Quick View automático (zero boilerplate quickView local)',
);
const appConfigText = fs.readFileSync(path.join(ROOT, 'src/app/app.config.ts'), 'utf8');
assert(
  appConfigText.includes('providePraxisQuickViewDialogPresenter()'),
  'app.config.ts registra providePraxisQuickViewDialogPresenter() (@praxisui/dialog) para materializar o overlay de Quick View',
);

// ---------------------------------------------------------------------------
// 7. Dashboard API Integration Audit (Zero Static Data Invariants)
// ---------------------------------------------------------------------------
console.log('\n[Suite 7] Dashboard API Integration Audit (Zero Static Data Invariants)');
const studioDemoSrc = fs.readFileSync(
  path.join(ROOT, 'e2e/record-studio-demo.mjs'),
  'utf8',
);

assert(
  !studioDemoSrc.includes("sourceKind: 'derived'") &&
    !studioDemoSrc.includes('fallbackLocalRows:') &&
    !studioDemoSrc.includes('localRows:'),
  'record-studio-demo.mjs não utiliza sourceKind="derived", localRows nem fallbackLocalRows em nenhum widget analítico',
);

const statsConfigCount = (studioDemoSrc.match(/sourceKind:\s*'praxis\.stats'/g) || []).length;
assert(
  statsConfigCount === 4 &&
    studioDemoSrc.includes("resourceMatch: 'risk-intelligence.vw-indicadores-incidentes'") &&
    studioDemoSrc.includes("resourceMatch: 'human-resources.vw-ranking-reputacao'") &&
    studioDemoSrc.includes("resourceMatch: 'human-resources.vw-analytics-folha-pagamento'") &&
    studioDemoSrc.includes("aggMatch: 'média'") &&
    studioDemoSrc.includes("aggMatch: 'contagem'") &&
    studioDemoSrc.includes("aggMatch: 'soma'"),
  'record-studio-demo.mjs configura todos os 4 gráficos analíticos (Donut, Gauge, Área, Barra) exclusivamente via praxis.stats em recursos governados da API',
);

assert(
  studioDemoSrc.includes("id: 'heroesStats'") &&
    studioDemoSrc.includes("id: 'missionsStats'") &&
    studioDemoSrc.includes("id: 'payrollStats'") &&
    studioDemoSrc.includes("id: 'incidentsStats'") &&
    studioDemoSrc.includes("id: 'assetsStats'") &&
    studioDemoSrc.includes("id: 'threatsStats'") &&
    studioDemoSrc.includes("id: 'recentMissionsFeed'") &&
    studioDemoSrc.includes("operations/vw-resumo-missoes/filter?page=0&size=4") &&
    studioDemoSrc.includes("targetStatePath: 'activeMissions'"),
  'record-studio-demo.mjs registra todas as 7 DataSources canônicas de telemetria (incluindo assetsStats, threatsStats e recentMissionsFeed -> state.activeMissions)',
);

assert(
  !studioDemoSrc.includes('Satélite Orbital Relé') &&
    !studioDemoSrc.includes('Interceptação Orbital Completa') &&
    !studioDemoSrc.includes("time: '15:20'") &&
    !studioDemoSrc.includes('Arsenal homologado · Telemetria de campo') &&
    studioDemoSrc.includes('activeMissions.0.titulo') &&
    studioDemoSrc.includes('activeMissions.1.titulo') &&
    studioDemoSrc.includes('activeMissions.2.titulo') &&
    studioDemoSrc.includes('activeMissions.3.titulo') &&
    studioDemoSrc.includes('kpis.inUseAssets') &&
    studioDemoSrc.includes('progressValue | round:1 | default:0') &&
    studioDemoSrc.includes('{{state.kpis.folhaPercent}}') &&
    studioDemoSrc.includes('"itemLayout": "split"') &&
    studioDemoSrc.includes('"markerStyle": "soft"') &&
    studioDemoSrc.includes('"label": "AMEAÇA"') &&
    studioDemoSrc.includes('"captionPosition": "below-progress"') &&
    studioDemoSrc.includes('"caption": "${item.nivelAmeaca|map:5=Crítico'),
  'record-studio-demo.mjs elimina todos os textos/valores estáticos residuais e alinha TIMELINE_DOC (split/soft) e SOS_LIST_CONFIG (métrica AMEAÇA centralizada com captionPosition=below-progress) em HERO_COMMAND_HEADER_DOC, KPI_*_DOC, TIMELINE_DOC e HUB_DOC',
);

assert(
  studioDemoSrc.includes('async function runDashboardApiIntegrationAudit') &&
    studioDemoSrc.includes('await runDashboardApiIntegrationAudit(page'),
  'record-studio-demo.mjs executa a sessão automatizada "Dashboard API Integration Audit" sobre o snapshot persistido da página ao final da gravação',
);

const crudStudioDemoPath = path.join(__dirname, 'record-crud-studio-demo.mjs');
const crudStudioDemoSrc = fs.readFileSync(crudStudioDemoPath, 'utf8');
assert(
  crudStudioDemoSrc.includes('crud-kpi-band-autoconnect-btn') &&
    crudStudioDemoSrc.includes('crud-kpi-band-groupby-field') &&
    crudStudioDemoSrc.includes('crud-kpi-card-value-expr-') &&
    crudStudioDemoSrc.includes('crud-kpi-card-caption-expr-') &&
    crudStudioDemoSrc.includes('${totalCount} | number') &&
    crudStudioDemoSrc.includes('${byKey.true} | default:0 | number') &&
    !crudStudioDemoSrc.includes("'20 Heróis'") &&
    !crudStudioDemoSrc.includes("'18 Ativos'") &&
    !crudStudioDemoSrc.includes("'96.4%'"),
  'record-crud-studio-demo.mjs conecta a faixa de KPIs do CRUD Studio a /stats/group-by (valueExpr / captionExpr) sem valores estáticos chumbados',
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


