const path = require('node:path');
const playwrightPath = require.resolve('@playwright/test', {
  paths: [__dirname, path.resolve(__dirname, '../../praxis-ui-angular/node_modules')],
});
const { chromium } = require(playwrightPath);

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:4302';

async function runE2E() {
  console.log(`[E2E] Iniciando validação E2E e regressão visual contra ${BASE_URL}...`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  let failures = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
    } else {
      console.error(`  [FAIL] ${message}`);
      failures++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Dashboard Navigation & Hero Executive Banner
    // -------------------------------------------------------------
    console.log('\n[Test 1] Validando Hero Executive Banner & Telemetria...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);

    const banner = page.locator('.hero-executive-banner').first();
    assert(await banner.count() > 0, 'Componente .hero-executive-banner está presente no DOM');

    const bannerTitle = await banner.innerText();
    assert(/Centro de Comando & Prontidão/i.test(bannerTitle), 'Título executivo do banner renderizado');
    assert(/Sistemas Táticos Ativos/i.test(bannerTitle), 'Badge de sistemas ativos presente no banner');
    assert(/Praxis Platform 9\.0/i.test(bannerTitle), 'Badge da plataforma presente no banner');

    const radarMedia = page.locator('.hero-executive-banner .prx-rich-card-media, .hero-executive-banner [class*="media"]').first();
    assert(await radarMedia.count() > 0, 'Container de telemetria presente no banner');

    const radarComponent = page.locator('.hero-executive-banner app-hero-tactical-radar').first();
    assert(await radarComponent.count() > 0, 'Componente host app-hero-tactical-radar instanciado no slot de mídia do banner');

    // Validar acessibilidade por teclado no radar tático (ArrowRight -> lock, Escape -> unlock)
    const radarScope = radarComponent.locator('.radar-scope').first();
    if ((await radarScope.count()) > 0) {
      await radarScope.focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(150);
      assert(
        (await radarComponent.locator('.target-lock-hud').count()) > 0,
        'Radar tático trava contato via teclado (ArrowRight) e exibe HUD de Target Lock',
      );
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      assert(
        (await radarComponent.locator('.target-lock-hud').count()) === 0,
        'Radar tático limpa Target Lock ao pressionar Escape',
      );
    }

    const shellReadiness = page.locator('[data-testid="shell-readiness-val"]').first();
    assert(await shellReadiness.count() > 0, 'Indicador de prontidão dinâmico presente na barra superior da Shell');

    // Validar Command Palette (Ctrl+K) com filtro em tempo real e navegação por teclado
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    const commandPalette = page.locator('[data-testid="command-palette-modal"]').first();
    assert(await commandPalette.count() > 0, 'Command Palette (Ctrl+K) aberto com sucesso');

    const commandInput = page.locator('[data-testid="command-palette-input"]').first();
    await commandInput.fill('missao');
    await page.waitForTimeout(200);
    const filteredItemsCount = await page.locator('[data-testid="command-palette-item"]').count();
    assert(filteredItemsCount >= 2 && filteredItemsCount < 16, `Command Palette filtra módulos em tempo real ("missao" -> ${filteredItemsCount} resultados)`);

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    const activeDescendant = await commandInput.getAttribute('aria-activedescendant');
    assert(
      activeDescendant === 'command-palette-opt-1',
      'Command Palette atualiza aria-activedescendant="command-palette-opt-1" ao navegar com ArrowDown',
    );

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    assert(await commandPalette.count() === 0, 'Command Palette fecha ao pressionar Escape');

    // Validar abertura imediata ao digitar no campo de busca da Topbar
    const topbarSearchInput = page.locator('.praxis-shell__search-input').first();
    if ((await topbarSearchInput.count()) > 0) {
      await topbarSearchInput.fill('folha');
      await page.waitForTimeout(200);
      assert(
        (await commandPalette.count()) > 0,
        'Digitar no campo de busca da Topbar abre imediatamente o Command Palette',
      );
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }


    // -------------------------------------------------------------
    // Test 2: Bento KPIs & Governed Data
    // -------------------------------------------------------------
    console.log('\n[Test 2] Validando Bento KPIs no Dashboard...');
    const bodyText = await page.innerText('body');
    assert(bodyText.includes('53 Ativos'), 'KPI "53 Ativos" renderizado');
    assert(bodyText.includes('14 Planejadas') || bodyText.includes('15 Planejadas') || /\d+\s+Planejadas/.test(bodyText), 'KPI de missões planejadas ("Planejadas") renderizado');
    assert(bodyText.includes('R$ 3,09 M') || bodyText.includes('3,09 M') || bodyText.includes('3.09 M'), 'KPI de execução orçamentária formatado em Real presente');
    assert(bodyText.includes('18 Críticos'), 'KPI "18 Críticos" renderizado');

    // -------------------------------------------------------------
    // Test 2.1: Governance Toolbar + Floating Toolbar + DataSources State Preservation
    // -------------------------------------------------------------
    console.log('\n[Test 2.1] Validando Governança de Layout, Floating Toolbar e Preservação de Estado dos DataSources...');
    const customizeBtn = page.locator('[data-testid="toggle-customization-btn"]').first();
    assert((await customizeBtn.count()) > 0, 'Botão "Customizar Layout" da barra de governança presente');
    await customizeBtn.click();
    await page.waitForTimeout(800);

    const floatingToolbarBtns = page.locator('praxis-floating-toolbar button');
    assert((await floatingToolbarBtns.count()) > 0, 'Floating Toolbar fica visível com ações de edição ao ativar Customizar Layout via barra de governança');

    const bodyAfterCustomize = await page.innerText('body');
    assert(bodyAfterCustomize.includes('53 Ativos'), 'Dados vivos dos DataSources ("53 Ativos") preservados ao entrar em modo de customização');
    assert(bodyAfterCustomize.includes('18 Críticos'), 'Dados vivos dos DataSources ("18 Críticos") preservados ao entrar em modo de customização');

    // Sair do modo de customização
    await customizeBtn.click();
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // Test 3: Distress Signals List pt-BR Localization
    // -------------------------------------------------------------
    console.log('\n[Test 3] Validando Sinais de Socorro com formatação canônica pt-BR...');
    const listEl = page.locator('#hero-distress-signals-list, praxis-list').first();
    assert(await listEl.count() > 0, 'Lista de sinais de socorro presente');

    const metaSpans = await page.$$eval('.meta span, .meta, [class*="meta"]', els => els.map(e => e.innerText.trim()).filter(Boolean));
    if (metaSpans.length > 0) {
      assert(metaSpans.length > 0, `Nós de metadados relativos renderizados (${metaSpans.length} encontrados)`);
      const hasEnglishWords = metaSpans.some(t => /days ago|hours ago|minutes ago/i.test(t));
      assert(!hasEnglishWords, 'Nenhum termo em inglês detectado nos valores relativos (zero "days ago")');
      const hasPtBrWords = metaSpans.some(t => /anteontem|ontem|há|segundos|minutos|horas|dias/i.test(t));
      assert(hasPtBrWords, `Valores relativos devidamente formatados em português brasileiro (exemplo: "${metaSpans[0]}")`);
    } else {
      const listText = await listEl.innerText();
      assert(!/days ago|hours ago|minutes ago/i.test(listText), 'Nenhum termo em inglês detectado nos valores relativos');
      assert(/anteontem|ontem|há|segundos|minutos|horas|dias|\d{2}\/\d{2}/i.test(listText), 'Valores temporais formatados em pt-BR');
    }

    const hasPaginator = (await listEl.locator('mat-paginator').count()) > 0;
    if (hasPaginator) {
      const paginatorText = await listEl.locator('mat-paginator').innerText();
      assert(!/items per page/i.test(paginatorText), 'Paginação não possui strings em inglês ("items per page")');
      assert(/itens por página/i.test(paginatorText), 'Paginação devidamente localizada em pt-BR ("Itens por página")');
    } else {
      const listText = await listEl.innerText();
      assert(!/items per page/i.test(listText), 'Lista não possui resquícios de strings em inglês ("items per page")');
    }

    // -------------------------------------------------------------
    // Test 4: Resource Page - Incidentes Táticos (HTML5 PushState)
    // -------------------------------------------------------------
    console.log('\n[Test 4] Validando Página de Recurso: Incidentes Táticos...');
    await page.goto(`${BASE_URL}/operacoes/incidentes`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const incidentsTitle = page.locator('h1, [class*="title"]').filter({ hasText: /Incidentes Táticos/i }).first();
    await incidentsTitle.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    assert(await incidentsTitle.count() > 0, 'Página de Incidentes Táticos carregou com sucesso');

    await page.waitForTimeout(3000);
    const incidentsBody = await page.innerText('body');
    assert(incidentsBody.includes('TOTAL DE OCORRÊNCIAS') || incidentsBody.includes('74 Registros'), 'KPI de Total de Ocorrências presente');
    assert(incidentsBody.includes('R$ 154,4 M') || incidentsBody.includes('154,4 M'), 'KPI de Danos Materiais formatado em Real presente');

    // -------------------------------------------------------------
    // Test 5: Resource Page - Heróis & Colaboradores (HTML5 PushState)
    // -------------------------------------------------------------
    console.log('\n[Test 5] Validando Página de Recurso: Heróis & Colaboradores + Reconciliação CONFIG_STORAGE...');
    // Semear localStorage com snapshot legado (apenas 1 campo inline) para provar reconciliação de alwaysVisibleFields
    await page.evaluate(() => {
      const legacyConfig = {
        columns: [],
        behavior: {
          filtering: {
            enabled: true,
            advancedFilters: {
              enabled: true,
              settings: {
                alwaysVisibleFields: ['nomeCompleto'],
              },
            },
          },
        },
      };
      localStorage.setItem('table-config:crud-human-resources-funcionarios', JSON.stringify(legacyConfig));
    });

    await page.goto(`${BASE_URL}/rh/funcionarios`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const heroesTitle = page.locator('h1, [class*="title"]').filter({ hasText: /Heróis & Colaboradores/i }).first();
    await heroesTitle.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    assert(await heroesTitle.count() > 0, 'Página de Heróis & Colaboradores carregou com sucesso');

    await page.waitForTimeout(3000);
    const heroesBody = await page.innerText('body');
    assert(heroesBody.includes('EFETIVO TOTAL') || heroesBody.includes('101 Cadastrados'), 'KPI de Efetivo Total ("101 Cadastrados") presente');
    assert(heroesBody.includes('101 Ativos'), 'KPI de Prontidão Ativa ("101 Ativos") presente');

    // Validar que os 3 filtros inline declarados pelo host continuam presentes mesmo após snapshot legado no localStorage
    const inlineFilterFields = page.locator('praxis-filter .compact-fields .pfx-field-shell');
    await inlineFilterFields.nth(2).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    assert((await inlineFilterFields.count()) >= 3, 'Todos os 3 filtros inline declarados pelo host permanecem visíveis após reconciliação de CONFIG_STORAGE');

    // Test 5.1: Sincronismo Bidirecional KPI <-> ScopeBar e Preservação de Capabilities
    console.log('\n[Test 5.1] Validando Sincronismo Bidirecional KPI <-> ScopeBar e Preservação de Capabilities...');
    const activeKpiCard = page.locator('praxis-kpi-band .praxis-kpi-card').filter({ hasText: /Em Prontidão Ativa/i }).first();
    await activeKpiCard.click();
    await page.waitForTimeout(1000);

    const isKpiMarkedActive = await activeKpiCard.evaluate((el) => el.classList.contains('active') && el.getAttribute('aria-pressed') === 'true');
    assert(isKpiMarkedActive, 'Card KPI "Em Prontidão Ativa" recebe classe .active e aria-pressed="true" ao ser clicado');

    const newHeroBtn = page.locator('praxis-table .praxis-toolbar button').filter({ hasText: /Novo Colaborador|Novo Herói|Adicionar/i }).first();
    assert((await newHeroBtn.count()) > 0, 'Botão de criação da coleção permanece visível após filtrar por KPI/ScopeBar (collectionCapabilities preservadas)');

    const totalKpiCard = page.locator('praxis-kpi-band .praxis-kpi-card').filter({ hasText: /Efetivo Total/i }).first();
    await totalKpiCard.click();
    await page.waitForTimeout(1000);

    const isTotalKpiActive = await totalKpiCard.evaluate((el) => el.classList.contains('active') && el.getAttribute('aria-pressed') === 'true');
    assert(isTotalKpiActive, 'Card KPI "Efetivo Total" (filter: {}) reativa escopo "Todos" e recebe estado ativo');

    // Test 5.2: Modo de Customização Global na Barra Principal (Qualquer Rota)
    console.log('\n[Test 5.2] Validando Modo de Customização na Barra Principal em Rota de Recurso (/rh/funcionarios)...');
    const resourceConfigureBtn = page.locator('[data-testid="resource-page-configure-btn"]');
    assert((await resourceConfigureBtn.count()) === 0, 'Botão "Configurar Página" oculto antes de ativar o modo de customização na barra principal');

    const topbarCustomizeBtn = page.locator('praxis-app-shell .praxis-shell__topbar [data-testid="toggle-customization-btn"]').first();
    assert((await topbarCustomizeBtn.count()) > 0, 'Botão "Customizar Layout" presente na barra superior principal (PraxisAppShellComponent)');
    await topbarCustomizeBtn.click();
    await page.waitForTimeout(600);

    assert((await resourceConfigureBtn.count()) > 0, 'Botão "Configurar Página" torna-se visível na rota de recurso ao ativar Customizar Layout na barra principal');

    // Validar que o modo de customização permanece ativo ao navegar via SPA para outra rota
    const eventosFolhaLink = page.locator('a[href="/rh/eventos-folha"]').first();
    if (await eventosFolhaLink.count() > 0) {
      await eventosFolhaLink.click();
      await page.waitForTimeout(1500);
      assert((await resourceConfigureBtn.count()) > 0, 'Modo de customização permanece ativo ao navegar entre rotas via SPA (/rh/funcionarios -> /rh/eventos-folha)');
    }

    await topbarCustomizeBtn.click();
    await page.waitForTimeout(500);
    assert((await resourceConfigureBtn.count()) === 0, 'Botão "Configurar Página" ocultado ao finalizar o modo de customização na barra principal');

    // -------------------------------------------------------------
    // Test 6: Tactical Clearance Guard & Governança de Autorização
    // -------------------------------------------------------------
    console.log('\n[Test 6] Validando Tactical Clearance Guard & Governança de Autorização...');
    const personaBtn = page.locator('[data-testid="persona-switcher"]').first();
    if (await personaBtn.count() > 0) {
      await personaBtn.click();
      await page.waitForTimeout(500);

      const tonyOption = page.locator('[data-testid="persona-option-tony.stark"]').first();
      assert(await tonyOption.count() > 0, 'Opção Tony Stark presente no switcher de persona');
      await tonyOption.click();
      await page.waitForTimeout(1000);

      // Tentar acessar recurso restrito a DEFCON 1 (/rh/folha-pagamento)
      console.log('  Tentando navegar para /rh/folha-pagamento com credencial DEFCON 2...');
      await page.goto(`${BASE_URL}/rh/folha-pagamento`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      assert(currentUrl.includes('authDenied=true') || currentUrl.endsWith('/'), 'Navegação bloqueada pelo Tactical Clearance Guard e redirecionada ao Dashboard');

      const authAlert = page.locator('[data-testid="tactical-auth-alert"]').first();
      assert(await authAlert.count() > 0, 'Alerta tático de acesso restrito renderizado no Dashboard');

      // Reverter para Nick Fury (DEFCON 1)
      await personaBtn.click();
      await page.waitForTimeout(500);
      const furyOption = page.locator('[data-testid="persona-option-nick.fury"]').first();
      await furyOption.click();
      await page.waitForTimeout(1000);

      // Acessar novamente /rh/folha-pagamento com DEFCON 1
      console.log('  Navegando para /rh/folha-pagamento com credencial DEFCON 1 (Nick Fury)...');
      await page.goto(`${BASE_URL}/rh/folha-pagamento`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      const payrollTitle = page.locator('h1, [class*="title"]').filter({ hasText: /Folha de Pagamento/i }).first();
      assert(await payrollTitle.count() > 0, 'Acesso autorizado com sucesso para Nick Fury (DEFCON 1)');

      // Validar badges visuais de restrição tática DEFCON 1 na navegação
      const defconBadges = page.locator('.praxis-shell__nav-badge').filter({ hasText: /DEFCON 1/i });
      assert(await defconBadges.count() >= 2, 'Badges táticos "DEFCON 1" visíveis nos itens de menu restritos (Folha de Pagamento e Contratos)');
    }

    // -------------------------------------------------------------
    // Test 7: Governed Bulk Operations & 2-Phase Protocol (/rh/eventos-folha)
    // -------------------------------------------------------------
    console.log('\n[Test 7] Validando Operações em Lote Governadas (Protocolo de 2 Fases em /rh/eventos-folha)...');

    await page.route('**/api/human-resources/eventos-folha/capabilities**', async (route) => {
      const body = {
        resourceKey: 'human-resources.eventos-folha',
        resourcePath: '/api/human-resources/eventos-folha',
        group: 'api-human-resources-eventos-folha',
        resourceId: null,
        canonicalOperations: {
          update: true,
          delete: true,
          byId: true,
          cursor: true,
          filter: true,
          create: true,
          options: true,
          all: true,
        },
        operations: {
          'bulk-approve': {
            id: 'bulk-approve',
            supported: true,
            scope: 'COLLECTION',
            preferredMethod: 'POST',
            availability: { allowed: true, reason: null, metadata: {} },
          },
        },
        actions: [
          {
            id: 'bulk-approve',
            title: 'Aprovar eventos de folha em lote',
            scope: 'COLLECTION',
            availability: { allowed: true, reason: null, metadata: {} },
            execution: {
              bulk: {
                mode: 'DOMAIN_COMMAND',
                atomicity: 'PER_ITEM',
                selectionModes: ['EXPLICIT'],
                executionModes: ['SYNC'],
                parametersPointer: '/properties/parameters',
                limits: {
                  maxTargets: 25,
                  maxRequestBytes: 65536,
                  proposalLifetimeMillis: 300000,
                  unitDeadlineMillis: 5000,
                },
                evaluationOperation: {
                  operation: {
                    operationId: 'evaluateBulkApproval',
                    path: '/api/human-resources/eventos-folha/actions/bulk-approve/evaluation',
                    method: 'POST',
                  },
                  requestSchema: {
                    schemaId: 'bulk-approve-eval-req',
                    schemaType: 'request',
                    url: '/schemas/filtered?path=%2Fapi%2Fhuman-resources%2Feventos-folha%2Factions%2Fbulk-approve%2Fevaluation&operation=post&schemaType=request&idField=id&readOnly=false',
                  },
                  responseSchema: {
                    schemaId: 'bulk-approve-eval-res',
                    schemaType: 'response',
                    url: '/schemas/filtered?path=%2Fapi%2Fhuman-resources%2Feventos-folha%2Factions%2Fbulk-approve%2Fevaluation&operation=post&schemaType=response&idField=id&readOnly=false',
                  },
                },
                confirmationOperation: {
                  operation: {
                    operationId: 'human-resources.eventos-folha.bulk-approve',
                    path: '/api/human-resources/eventos-folha/actions/bulk-approve',
                    method: 'POST',
                  },
                  responseSchema: {
                    schemaId: 'bulk-approve-confirm-res',
                    schemaType: 'response',
                    url: '/schemas/filtered?path=%2Fapi%2Fhuman-resources%2Feventos-folha%2Factions%2Fbulk-approve&operation=post&schemaType=response&idField=id&readOnly=false',
                  },
                },
                proposalOperation: {
                  operation: {
                    operationId: 'getBulkProposal',
                    path: '/api/human-resources/eventos-folha/bulk-proposals/{proposalId}',
                    method: 'GET',
                  },
                  responseSchema: {
                    schemaId: 'bulk-proposal-res',
                    schemaType: 'response',
                    url: '/schemas/filtered?id=bulk-proposal-res',
                  },
                },
                proposalResultsOperation: {
                  operation: {
                    operationId: 'getBulkProposalResults',
                    path: '/api/human-resources/eventos-folha/bulk-proposals/{proposalId}/results',
                    method: 'GET',
                  },
                  responseSchema: {
                    schemaId: 'bulk-proposal-results-res',
                    schemaType: 'response',
                    url: '/schemas/filtered?id=bulk-proposal-results-res',
                  },
                },
                executionOperation: {
                  operation: {
                    operationId: 'getBulkExecution',
                    path: '/api/human-resources/eventos-folha/bulk-executions/{executionId}',
                    method: 'GET',
                  },
                  responseSchema: {
                    schemaId: 'bulk-execution-res',
                    schemaType: 'response',
                    url: '/schemas/filtered?id=bulk-execution-res',
                  },
                },
                resultsOperation: {
                  operation: {
                    operationId: 'getBulkExecutionResults',
                    path: '/api/human-resources/eventos-folha/bulk-executions/{executionId}/results',
                    method: 'GET',
                  },
                  responseSchema: {
                    schemaId: 'bulk-execution-results-res',
                    schemaType: 'response',
                    url: '/schemas/filtered?id=bulk-execution-results-res',
                  },
                },
                cancelOperation: {
                  operation: {
                    operationId: 'cancelBulkExecution',
                    path: '/api/human-resources/eventos-folha/bulk-executions/{executionId}/cancel',
                    method: 'POST',
                  },
                  responseSchema: {
                    schemaId: 'bulk-execution-cancel-res',
                    schemaType: 'response',
                    url: '/schemas/filtered?id=bulk-execution-cancel-res',
                  },
                },
              },
            },
          },
        ],
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    await page.route('**/api/human-resources/eventos-folha/actions/bulk-approve/evaluation**', async (route) => {
      const reqBody = route.request().postDataJSON();
      const targetCount = reqBody?.selection?.targets?.length || 2;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          proposalId: 'prop-eventos-folha-e2e',
          operationRef: {
            operationId: 'human-resources.eventos-folha.bulk-approve',
            path: '/api/human-resources/eventos-folha/actions/bulk-approve',
            method: 'POST',
          },
          mode: 'DOMAIN_COMMAND',
          executionMode: 'SYNC',
          atomicity: 'PER_ITEM',
          status: 'READY',
          createdAt: '2026-10-14T02:00:00Z',
          expiresAt: '2026-10-14T02:05:00Z',
          totals: {
            targetCount,
            evaluated: targetCount,
            executable: targetCount,
            unchanged: 0,
            blocked: 0,
            denied: 0,
            invalid: 0,
            conflict: 0,
            unknown: 0,
          },
          redactedIntent: reqBody?.parameters || {},
          diagnostics: [],
          evidence: [],
        }),
      });
    });

    await page.route('**/api/human-resources/eventos-folha/bulk-proposals/**/results**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 2, decision: 'EXECUTABLE', diagnostics: [] },
            { id: 3, decision: 'EXECUTABLE', diagnostics: [] },
          ],
          nextCursor: null,
        }),
      });
    });

    await page.route('**/api/human-resources/eventos-folha/actions/bulk-approve', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          executionId: 'exec-eventos-folha-e2e',
          proposalId: 'prop-eventos-folha-e2e',
          operationRef: {
            operationId: 'human-resources.eventos-folha.bulk-approve',
            path: '/api/human-resources/eventos-folha/actions/bulk-approve',
            method: 'POST',
          },
          mode: 'DOMAIN_COMMAND',
          executionMode: 'SYNC',
          atomicity: 'PER_ITEM',
          status: 'COMPLETED',
          createdAt: '2026-10-14T02:00:00Z',
          updatedAt: '2026-10-14T02:00:02Z',
          terminalAt: '2026-10-14T02:00:02Z',
          totals: {
            targetCount: 2,
            pending: 0,
            confirmed: 2,
            unchanged: 0,
            denied: 0,
            invalid: 0,
            conflict: 0,
            notProcessed: 0,
            unknown: 0,
          },
          diagnostics: [],
        }),
      });
    });

    await page.route('**/api/human-resources/eventos-folha/bulk-executions/**/results**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 2, status: 'CONFIRMED', diagnostics: [] },
            { id: 3, status: 'CONFIRMED', diagnostics: [] },
          ],
          nextCursor: null,
        }),
      });
    });

    await page.goto(`${BASE_URL}/rh/eventos-folha`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const payrollEventsCheckboxes = page.locator('tbody mat-checkbox');
    assert((await payrollEventsCheckboxes.count()) >= 2, 'Checkboxes de seleção presentes na tabela de Eventos de Folha');

    // Selecionar 2 linhas
    await payrollEventsCheckboxes.nth(0).click();
    await payrollEventsCheckboxes.nth(1).click();
    await page.waitForTimeout(600);

    // Verificar se a ação em lote "Aprovar eventos de folha em lote" está disponível via discovery canônico
    const bulkButton = page
      .locator('.praxis-floating-bulk-actions button, button')
      .filter({ hasText: /Aprovar eventos de folha em lote/i })
      .first();
    await bulkButton.waitFor({ state: 'visible', timeout: 15000 });
    assert((await bulkButton.count()) > 0, 'Botão de ação em lote "Aprovar eventos de folha em lote" disponível');

    // Acionar a ação em lote
    await bulkButton.click();
    await page.waitForTimeout(2000);

    // Validar abertura do diálogo canônico
    const bulkDialog = page.locator('praxis-bulk-operation-dialog, .praxis-bulk-dialog').first();
    assert((await bulkDialog.count()) > 0, 'Diálogo canônico PraxisBulkOperationDialogComponent aberto');

    const dialogText = await bulkDialog.innerText();
    assert(dialogText.includes('Aprovar eventos de folha em lote'), 'Título do comando de domínio renderizado no diálogo');
    assert(dialogText.includes('registros selecionados como alvo'), 'Badge de alvos selecionados presente no diálogo');

    // Passo 1: Preencher parâmetro real do /schemas/filtered (justificativa) e avaliar
    const paramInput = bulkDialog.locator('input, textarea').first();
    if ((await paramInput.count()) > 0) {
      await paramInput.fill('Homologação executiva de eventos pendentes de folha');
      await page.waitForTimeout(400);
    }
    const evaluateBtn = bulkDialog.locator('button').filter({ hasText: /Avaliar Proposta/i }).first();
    if ((await evaluateBtn.count()) > 0) {
      await evaluateBtn.click();
      await page.waitForTimeout(1500);
    }

    const previewDialogText = await bulkDialog.innerText();
    assert(previewDialogText.includes('Conformidade e Prévia de Execução') || previewDialogText.includes('REGISTROS ALVO'), 'Passo de Avaliação/Preview calculado com sucesso');

    // Confirmar execução (Fase 2)
    const confirmBtn = bulkDialog.locator('button').filter({ hasText: /Confirmar Execução/i }).first();
    assert((await confirmBtn.count()) > 0, 'Botão "Confirmar Execução" habilitado na proposta');
    await confirmBtn.click();
    await page.waitForTimeout(1500);

    const postConfirmText = await bulkDialog.innerText();
    assert(postConfirmText.includes('Operação concluída com') || postConfirmText.includes('Status: Concluído'), 'Confirmação Transacional concluída com êxito');
    assert(postConfirmText.includes('Concluir e Atualizar'), 'Botão de encerramento e atualização presente');

    // Fechar diálogo com sucesso
    const concludeBtn = bulkDialog.locator('button').filter({ hasText: /Concluir e Atualizar/i }).first();
    await concludeBtn.click();
    await page.waitForTimeout(1000);

    assert((await page.locator('praxis-bulk-operation-dialog').count()) === 0, 'Diálogo fechado e tabela pronta para novo ciclo');
  } catch (err) {
    console.error(`[E2E] Erro inesperado na execução:`, err);
    failures++;
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(60));
  if (failures === 0) {
    console.log(' [SUCESSO] Todos os testes E2E e invariantes visuais foram validados com êxito!');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  } else {
    console.error(` [FALHA] ${failures} teste(s) falharam!`);
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  }
}

runE2E();
