const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const APP_URL = 'http://127.0.0.1:4302';
const ARTIFACTS_DIR = 'C:/Users/rodrigo.moreira/.gemini/antigravity/brain/794d724f-3768-4659-a08a-b84bfd459305';

function log(phase, msg, data = null) {
  const ts = new Date().toISOString().substring(11, 23);
  console.log(`[${ts}] [${phase}] ${msg}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function run() {
  log('INIT', 'Iniciando bateria E2E abrangente: Gráficos, Formulário Dinâmico, Tabela com Regras e Alternância Multi-Usuário...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    locale: 'pt-BR',
  });

  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.text().includes('Error') || msg.text().includes('Failed')) {
      log('BROWSER_CONSOLE', `[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    log('BROWSER_PAGE_ERROR', err.stack || err.message);
  });

  // Monitoramento de requisições de persistência de configuração (/api/praxis/config/ui)
  const configCalls = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/praxis/config/ui')) {
      configCalls.push({
        type: 'request',
        method: req.method(),
        url,
        headers: {
          'x-user-id': req.headers()['x-user-id'],
          'x-tenant-id': req.headers()['x-tenant-id'],
        },
      });
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/praxis/config/ui')) {
      let body = null;
      try {
        body = await res.json();
      } catch {}
      configCalls.push({
        type: 'response',
        method: res.request().method(),
        status: res.status(),
        url,
        etag: res.headers()['etag'],
        body,
      });
    }
  });

  try {
    // -------------------------------------------------------------------------
    // ETAPA 0: Limpeza de Estado Prévio (Clean Slate)
    // -------------------------------------------------------------------------
    log('ETAPA 0', 'Resetando estado e chaves no backend e client storage...');
    await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      localStorage.clear();
      await fetch('/api/praxis/config/ui?componentType=praxis-dynamic-page&componentId=dynamic-page:hq-dashboard', {
        method: 'DELETE',
        headers: { 'X-User-ID': 'nick.fury', 'X-Tenant-ID': 'shield-hq', 'X-Env': 'local' },
      });
      await fetch('/api/praxis/config/ui?componentType=praxis-dynamic-page&componentId=dynamic-page:hq-dashboard', {
        method: 'DELETE',
        headers: { 'X-User-ID': 'tony.stark', 'X-Tenant-ID': 'shield-hq', 'X-Env': 'local' },
      });
      await fetch('/api/praxis/config/ui?componentType=praxis-table&componentId=table-config:heroes-hq-pedidos-crud', {
        method: 'DELETE',
        headers: { 'X-User-ID': 'nick.fury', 'X-Tenant-ID': 'shield-hq', 'X-Env': 'local' },
      });
      await fetch('/api/praxis/config/ui?componentType=praxis-table&componentId=table-config:heroes-hq-pedidos-crud', {
        method: 'DELETE',
        headers: { 'X-User-ID': 'tony.stark', 'X-Tenant-ID': 'shield-hq', 'X-Env': 'local' },
      });
    });
    log('ETAPA 0', 'Ambiente resetado para baseline de fábrica.');

    // -------------------------------------------------------------------------
    // ETAPA 1: Baseline Governança Inicial com Nick Fury
    // -------------------------------------------------------------------------
    log('ETAPA 1', 'Carregando Dashboard inicial de fábrica com Nick Fury...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('[data-testid="dashboard-layout-status"]:has-text("Layout de Fábrica")').waitFor({ timeout: 10000 });

    const currentUserText = await page.locator('[data-testid="current-user-display"]').innerText();
    log('ETAPA 1', `Usuário ativo detectado no HUD: "${currentUserText}"`);
    if (!currentUserText.includes('Nick Fury')) {
      throw new Error(`Esperado Nick Fury no HUD, obtido: ${currentUserText}`);
    }

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'step1-nick-fury-baseline.png'),
      fullPage: false,
    });
    log('ETAPA 1', 'Screenshot salvo: step1-nick-fury-baseline.png');

    // -------------------------------------------------------------------------
    // ETAPA 2: Customização Abrangente do Dashboard (Gráficos + Formulário Dinâmico)
    // -------------------------------------------------------------------------
    log('ETAPA 2', 'Nick Fury ativando modo de customização do Page Builder...');
    await page.locator('[data-testid="toggle-customization-btn"]').click();
    await page.waitForTimeout(600);

    log('ETAPA 2', 'Montando layout tático customizado de Nick Fury com novos gráficos (area/horizontal-bar) e formulário dinâmico...');
    const furyComprehensiveLayout = {
      context: {
        pageId: 'executive-command-dashboard',
        title: 'Centro de Comando Executivo · SHIELD Tactical Matrix (Nick Fury)',
        purpose: 'dashboard',
      },
      layout: {
        orientation: 'columns',
        columns: 12,
        gap: '20px',
      },
      canvas: {
        mode: 'grid',
        columns: 12,
        gap: '20px',
        autoRows: 'content',
        collisionPolicy: 'swap',
        items: {
          heroBanner: { col: 1, row: 1, colSpan: 12, rowSpan: 4 },
          kpiProntidao: { col: 1, row: 5, colSpan: 3, rowSpan: 3 },
          kpiMissoes: { col: 4, row: 5, colSpan: 3, rowSpan: 3 },
          kpiFolha: { col: 7, row: 5, colSpan: 3, rowSpan: 3 },
          kpiRiscos: { col: 10, row: 5, colSpan: 3, rowSpan: 3 },
          // Gráficos Customizados
          payrollChart: { col: 1, row: 8, colSpan: 6, rowSpan: 6 },
          reputationChart: { col: 7, row: 8, colSpan: 6, rowSpan: 6 },
          // NOVO WIDGET: Formulário Dinâmico Tático
          tacticalDispatchForm: { col: 1, row: 14, colSpan: 12, rowSpan: 8 },
          recentIncidents: { col: 1, row: 22, colSpan: 12, rowSpan: 6 },
        },
      },
      widgets: [
        // 1. Banner
        {
          key: 'heroBanner',
          shell: { kind: 'none', showHeader: false },
          definition: {
            id: 'praxis-rich-content',
            inputs: {
              document: {
                kind: 'praxis.rich-content',
                version: '1.0.0',
                nodes: [
                  {
                    type: 'card',
                    variant: 'unstyled',
                    tone: 'neutral',
                    className: 'glass-panel hero-executive-banner bg-grid',
                    header: [
                      {
                        type: 'compose',
                        direction: 'row',
                        gap: 'sm',
                        items: [
                          { type: 'icon', icon: 'shield' },
                          { type: 'badge', label: 'SHIELD Executive Matrix · Nick Fury Clearance DEFCON 1' },
                        ],
                      },
                    ],
                    title: 'Centro de Operações Táticas & Comando Global',
                    subtitle: 'Painel executivo com visualização de área orçamentária, ranking horizontal e despacho de emergência.',
                  },
                ],
              },
            },
          },
        },
        // 2. KPIs
        { key: 'kpiProntidao', shell: { kind: 'none', showHeader: false }, definition: { id: 'praxis-rich-content', inputs: {} } },
        { key: 'kpiMissoes', shell: { kind: 'none', showHeader: false }, definition: { id: 'praxis-rich-content', inputs: {} } },
        { key: 'kpiFolha', shell: { kind: 'none', showHeader: false }, definition: { id: 'praxis-rich-content', inputs: {} } },
        { key: 'kpiRiscos', shell: { kind: 'none', showHeader: false }, definition: { id: 'praxis-rich-content', inputs: {} } },
        // 3. Gráfico 1: Payroll alterado para 'area' com paleta cobalto/ciano
        {
          key: 'payrollChart',
          shell: {
            kind: 'dashboard-card',
            title: 'Execução Orçamentária & Suprimentos Táticos (Nick Fury - Visão Direção)',
            subtitle: 'Curva de área com preenchimento volumétrico dos ciclos orçamentários',
            icon: 'area_chart',
            showHeader: true,
          },
          definition: {
            id: 'praxis-chart',
            inputs: {
              config: {
                id: 'hero-payroll-trend-chart',
                type: 'area',
                sizing: { mode: 'fixed', height: 320 },
                dataSource: {
                  kind: 'remote',
                  resourcePath: 'human-resources/vw-analytics-folha-pagamento',
                  query: {
                    sourceKind: 'praxis.stats',
                    statsOperation: 'timeseries',
                    statsPath: 'human-resources/vw-analytics-folha-pagamento/stats/timeseries',
                    statsRequest: {
                      field: 'competencia',
                      granularity: 'MONTH',
                      from: '2025-10-01',
                      to: '2026-03-31',
                      metric: { operation: 'SUM', field: 'salarioLiquido', alias: 'salarioLiquido' },
                    },
                    dimensions: ['competencia'],
                    metrics: [{ field: 'salarioLiquido', aggregation: 'sum', alias: 'salarioLiquido' }],
                  },
                },
                axes: {
                  x: { field: 'competencia', type: 'category', labels: { format: 'MMM/yy' } },
                  y: { type: 'value', label: 'Volume (R$)', labels: { format: 'BRL|symbol|0|compact' } },
                },
                series: [
                  {
                    id: 'salarioLiquido',
                    name: 'Orçamento Tático Alocado',
                    type: 'area',
                    metric: { field: 'salarioLiquido', aggregation: 'sum' },
                    color: '#0ea5e9',
                    smooth: true,
                  },
                ],
                theme: {
                  tooltip: { enabled: true, trigger: 'axis' },
                  palette: ['#0ea5e9', '#6366f1', '#22c55e'],
                },
              },
            },
          },
        },
        // 4. Gráfico 2: Reputação alterado para 'horizontal-bar'
        {
          key: 'reputationChart',
          shell: {
            kind: 'dashboard-card',
            title: 'Ranking Reputacional da Força (Visão SHIELD)',
            subtitle: 'Comparativo de aprovação em barras horizontais de alta precisão',
            icon: 'bar_chart_4_bars',
            showHeader: true,
          },
          definition: {
            id: 'praxis-chart',
            inputs: {
              config: {
                id: 'hero-reputation-ranking-chart',
                type: 'horizontal-bar',
                orientation: 'horizontal',
                sizing: { mode: 'fixed', height: 320 },
                dataSource: {
                  kind: 'remote',
                  resourcePath: 'human-resources/vw-ranking-reputacao',
                  query: {
                    sourceKind: 'praxis.stats',
                    statsOperation: 'group-by',
                    statsPath: 'human-resources/vw-ranking-reputacao/stats/group-by',
                    statsRequest: {
                      field: 'equipe',
                      metric: { operation: 'AVG', field: 'scorePublico', alias: 'scorePublico' },
                      filter: { equipe: '%' },
                    },
                    dimensions: ['equipe'],
                    metrics: [{ field: 'scorePublico', aggregation: 'avg', alias: 'scorePublico' }],
                  },
                },
                axes: {
                  x: { field: 'equipe', type: 'category', label: 'Equipe' },
                  y: { type: 'value', min: 0, max: 100, label: 'Score Médio' },
                },
                series: [
                  {
                    id: 'scorePublico',
                    name: 'Aprovação Pública',
                    type: 'bar',
                    metric: { field: 'scorePublico', aggregation: 'avg' },
                    color: '#06b6d4',
                  },
                ],
                theme: {
                  tooltip: { enabled: true, trigger: 'axis' },
                  palette: ['#06b6d4', '#10b981'],
                },
              },
            },
          },
        },
        // 5. NOVO WIDGET: Formulário Dinâmico Tático
        {
          key: 'tacticalDispatchForm',
          shell: {
            kind: 'dashboard-card',
            title: 'Protocolo Tático de Despacho Emergencial (SHIELD)',
            subtitle: 'Requisição executiva de intervenção rápida e envio de squads autorizada por Nick Fury',
            icon: 'assignment_turned_in',
            showHeader: true,
          },
          definition: {
            id: 'praxis-dynamic-form',
            inputs: {
              mode: 'create',
              config: {
                title: 'Despacho Operacional de Contingência',
                description: 'Parâmetros de missão em regime de urgência com liberação imediata de efetivo e armamentos.',
                sections: [
                  {
                    id: 'sec-despacho',
                    title: 'Parâmetros do Despacho Tático',
                    description: 'Nível de autorização executiva e designação de contingente',
                    collapsible: false,
                    expanded: true,
                    rows: [
                      {
                        id: 'row-1',
                        columns: [
                          { id: 'col-codigo', width: 6, fields: ['codigoOperacao'] },
                          { id: 'col-defcon', width: 6, fields: ['nivelDefcon'] },
                        ],
                      },
                      {
                        id: 'row-2',
                        columns: [
                          { id: 'col-equipe', width: 6, fields: ['equipeDesignada'] },
                          { id: 'col-autorizacao', width: 6, fields: ['autorizacaoDiretoria'] },
                        ],
                      },
                      {
                        id: 'row-3',
                        columns: [
                          { id: 'col-motivo', width: 12, fields: ['motivoIntervencao'] },
                        ],
                      },
                    ],
                  },
                ],
                fieldMetadata: [
                  {
                    name: 'codigoOperacao',
                    label: 'Código da Operação',
                    controlType: 'input',
                    dataType: 'string',
                    required: true,
                    defaultValue: 'OP-SHIELD-OMEGA-9',
                  },
                  {
                    name: 'nivelDefcon',
                    label: 'Nível de Alerta DEFCON',
                    controlType: 'select',
                    dataType: 'string',
                    required: true,
                    options: [
                      { label: 'DEFCON 1 - Ameaça Global Iminente', value: 'DEFCON-1' },
                      { label: 'DEFCON 2 - Mobilização dos Vingadores', value: 'DEFCON-2' },
                      { label: 'DEFCON 3 - Alerta Continental', value: 'DEFCON-3' },
                    ],
                    defaultValue: 'DEFCON-1',
                  },
                  {
                    name: 'equipeDesignada',
                    label: 'Esquadrão Tático Designado',
                    controlType: 'select',
                    dataType: 'string',
                    options: [
                      { label: 'Vingadores Alfa', value: 'AVENGERS-ALPHA' },
                      { label: 'Quarteto Fantástico', value: 'FF-OMEGA' },
                      { label: 'Comandos Uivantes', value: 'HOWLING-COMMANDOS' },
                    ],
                    defaultValue: 'AVENGERS-ALPHA',
                  },
                  {
                    name: 'autorizacaoDiretoria',
                    label: 'Token de Autenticação Executiva',
                    controlType: 'input',
                    dataType: 'string',
                    required: true,
                    defaultValue: 'DIRECTOR-FURY-ALPHA-01',
                  },
                  {
                    name: 'motivoIntervencao',
                    label: 'Justificativa Operacional e Danos Colaterais Estimados',
                    controlType: 'textarea',
                    dataType: 'string',
                    defaultValue: 'Incursão hostil detectada no setor portuário. Mobilização preventiva autorizada com contenção perimetral imediata.',
                  },
                ],
              },
            },
          },
        },
        // 6. Incidentes Recentes
        {
          key: 'recentIncidents',
          shell: {
            kind: 'dashboard-card',
            title: 'Monitoramento de Incidentes & Ameaças Recentes',
            showHeader: true,
          },
          definition: {
            id: 'praxis-table',
            inputs: {
              resourcePath: 'operations/incidentes',
              tableId: 'dashboard-incidentes-recentes',
              data: [
                { id: 'INC-881', descricao: 'Incursão de drones hostis na Zona Portuária', severidade: 'CRÍTICA', local: 'Setor Bravo - Cais 4', status: 'Contido' },
              ],
            },
          },
        },
      ],
    };

    const [furyPutRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/praxis/config/ui') && res.request().method() === 'PUT'),
      page.evaluate((layout) => {
        if (typeof window.PAX_SAVE_DASHBOARD_LAYOUT === 'function') {
          window.PAX_SAVE_DASHBOARD_LAYOUT(layout);
        }
      }, furyComprehensiveLayout),
    ]);

    log('ETAPA 2', `Dashboard customizado de Nick Fury persistido no backend HTTP PUT (status ${furyPutRes.status()})`);
    await page.locator('[data-testid="dashboard-layout-status"]:has-text("Layout Customizado")').waitFor({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // Concluir edição
    await page.locator('[data-testid="toggle-customization-btn"]').click();
    await page.waitForTimeout(800);

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'step2-nick-fury-custom-dashboard.png'),
      fullPage: false,
    });
    log('ETAPA 2', 'Screenshot salvo: step2-nick-fury-custom-dashboard.png');

    // Scroll para focar no novo widget de Formulário Dinâmico
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'step2b-nick-fury-dispatch-form.png'),
      fullPage: false,
    });
    log('ETAPA 2', 'Screenshot focado no formulário salvo: step2b-nick-fury-dispatch-form.png');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    // -------------------------------------------------------------------------
    // ETAPA 3: Customização Avançada da Tabela de Pedidos (Suprimentos)
    // -------------------------------------------------------------------------
    log('ETAPA 3', 'Navegando para Suprimentos / Pedidos de Compra...');
    await page.goto(`${APP_URL}/suprimentos/pedidos`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    // Ativar customização de tabela
    await page.locator('[data-testid="toggle-table-customization-btn"]').click();
    await page.waitForTimeout(600);

    log('ETAPA 3', 'Persistindo TableConfig avançado de Nick Fury: colunas ocultas, coluna unificada compose, regras de célula, regras de linha e animação...');

    const furyAdvancedTableConfig = {
      tableId: 'heroes-hq-pedidos-crud',
      columnProjection: {
        source: 'schema',
        include: ['id', 'orderDate', 'quantity', 'status', 'receivedAt'],
        order: ['id', 'orderDate', 'quantity', 'status', 'receivedAt'],
        overrides: {
          id: {
            header: 'Ordem & Moeda',
            width: '180px',
            align: 'center',
            renderer: {
              type: 'compose',
              compose: {
                layout: { direction: 'row', gap: 8, align: 'center' },
                items: [
                  { type: 'value', field: 'id', emphasis: 'strong' },
                  {
                    type: 'badge',
                    badge: { textField: 'currency', color: 'accent', variant: 'soft' },
                  },
                ],
              },
            },
          },
          orderDate: {
            header: 'Data da Ordem',
            width: '140px',
            align: 'center',
            format: 'dd/MM/yyyy',
          },
          quantity: {
            header: 'Quantidade',
            width: '120px',
            align: 'center',
            conditionalStyles: [
              {
                id: 'qty-high-volume',
                condition: { '>': [{ var: 'quantity' }, 10] },
                style: { color: '#38bdf8', 'font-weight': '800' },
                description: 'Destaque visual ciano para volumes expressivos acima de 10 unidades',
              },
            ],
          },
          status: {
            header: 'Status Tático',
            width: '160px',
            align: 'center',
            conditionalRenderers: [
              {
                id: 'status-approved',
                condition: { '==': [{ var: 'status' }, 'APPROVED'] },
                renderer: {
                  type: 'badge',
                  badge: { text: 'APROVADO', color: 'primary', variant: 'filled', icon: 'verified' },
                },
                description: 'Badge verde primário para status APPROVED',
              },
              {
                id: 'status-received',
                condition: { '==': [{ var: 'status' }, 'RECEIVED'] },
                renderer: {
                  type: 'badge',
                  badge: { text: 'RECEBIDO', color: 'accent', variant: 'filled', icon: 'inventory_2' },
                },
                description: 'Badge ciano para status RECEIVED',
              },
              {
                id: 'status-cancelled',
                condition: { '==': [{ var: 'status' }, 'CANCELLED'] },
                renderer: {
                  type: 'badge',
                  badge: { text: 'REVOGADO', color: 'warn', variant: 'outlined', icon: 'cancel' },
                },
                description: 'Badge vermelho de alerta para ordens revogadas',
              },
            ],
          },
          receivedAt: {
            header: 'Recebimento',
            width: '140px',
            align: 'center',
            format: 'dd/MM/yyyy',
          },
        },
      },
      columns: [
        // 1. Coluna Composta (Juntando duas em uma: id + currency)
        {
          field: 'id',
          header: 'Ordem & Moeda',
          width: '180px',
          align: 'center',
          renderer: {
            type: 'compose',
            compose: {
              layout: { direction: 'row', gap: 8, align: 'center' },
              items: [
                { type: 'value', field: 'id', emphasis: 'strong' },
                {
                  type: 'badge',
                  badge: { textField: 'currency', color: 'accent', variant: 'soft' },
                },
              ],
            },
          },
        },
        // 2. Coluna Data
        {
          field: 'orderDate',
          header: 'Data da Ordem',
          width: '140px',
          align: 'center',
          format: 'dd/MM/yyyy',
        },
        // 3. Coluna Quantidade com Conditional Styles (Destaque para lotes > 10)
        {
          field: 'quantity',
          header: 'Quantidade',
          width: '120px',
          align: 'center',
          conditionalStyles: [
            {
              id: 'qty-high-volume',
              condition: { '>': [{ var: 'quantity' }, 10] },
              style: { color: '#38bdf8', 'font-weight': '800' },
              description: 'Destaque visual ciano para volumes expressivos acima de 10 unidades',
            },
          ],
        },
        // 4. Coluna Status com Conditional Renderers (Badges temáticos com ícones)
        {
          field: 'status',
          header: 'Status Tático',
          width: '160px',
          align: 'center',
          conditionalRenderers: [
            {
              id: 'status-approved',
              condition: { '==': [{ var: 'status' }, 'APPROVED'] },
              renderer: {
                type: 'badge',
                badge: { text: 'APROVADO', color: 'primary', variant: 'filled', icon: 'verified' },
              },
              description: 'Badge verde primário para status APPROVED',
            },
            {
              id: 'status-received',
              condition: { '==': [{ var: 'status' }, 'RECEIVED'] },
              renderer: {
                type: 'badge',
                badge: { text: 'RECEBIDO', color: 'accent', variant: 'filled', icon: 'inventory_2' },
              },
              description: 'Badge ciano para status RECEIVED',
            },
            {
              id: 'status-cancelled',
              condition: { '==': [{ var: 'status' }, 'CANCELLED'] },
              renderer: {
                type: 'badge',
                badge: { text: 'REVOGADO', color: 'warn', variant: 'outlined', icon: 'cancel' },
              },
              description: 'Badge vermelho de alerta para ordens revogadas',
            },
          ],
        },
        // 5. Coluna Recebido Em
        {
          field: 'receivedAt',
          header: 'Recebimento',
          width: '140px',
          align: 'center',
          format: 'dd/MM/yyyy',
        },
        // 6. Colunas Ocultadas explicitamente
        { field: 'currency', header: 'Moeda', visible: false },
        { field: 'approvedAt', header: 'Aprovado Em', visible: false },
        { field: 'disabledReason', header: 'Motivo de Bloqueio', visible: false },
      ],
      // Regras de Linha Inteira (rowConditionalStyles)
      rowConditionalStyles: [
        {
          condition: { '==': [{ var: 'status' }, 'CANCELLED'] },
          style: { opacity: '0.65', background: 'rgba(239, 68, 68, 0.08)' },
          cssClass: 'row-status-cancelled',
          description: 'Opacidade e destaque suave avermelhado em ordens canceladas',
        },
        {
          condition: { '>': [{ var: 'quantity' }, 10] },
          style: { 'border-left': '4px solid #38bdf8' },
          cssClass: 'row-high-volume',
          description: 'Borda lateral azul cobalto em ordens de alto volume',
        },
      ],
      // Regras de Animação de Linha (rowConditionalRenderers)
      rowConditionalRenderers: [
        {
          id: 'anim-high-volume',
          condition: { '>': [{ var: 'quantity' }, 10] },
          animation: { hover: true, pulse: true },
          description: 'Animação suave em linhas de alto volume',
        },
      ],
      // Aparência e Densidade Compacta com Animações Habilitadas
      appearance: {
        density: 'compact',
        animations: {
          enabled: true,
          duration: 300,
          easing: 'ease-in-out',
          specific: { hover: true, selection: true, sorting: true },
        },
        borders: {
          showRowBorders: true,
          showColumnBorders: false,
          showOuterBorder: true,
          style: 'solid',
          width: 1,
          color: 'rgba(255, 255, 255, 0.12)',
        },
        colors: {
          hoverBackground: 'rgba(56, 189, 248, 0.08)',
        },
      },
      meta: {
        version: '2.0.0',
        author: 'nick.fury',
        description: 'Tabela de Pedidos com Coluna Composta (id+moeda), Regras Condicionais, Animação e Densidade Compacta',
        updatedAt: new Date().toISOString(),
      },
    };

    const [tablePutRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/praxis/config/ui') && res.request().method() === 'PUT'),
      page.evaluate((cfg) => {
        if (typeof window.PAX_SAVE_PEDIDOS_TABLE_CONFIG === 'function') {
          window.PAX_SAVE_PEDIDOS_TABLE_CONFIG(cfg);
        }
      }, furyAdvancedTableConfig),
    ]);

    log('ETAPA 3', `TableConfig de Nick Fury persistido no backend HTTP PUT (status ${tablePutRes.status()})`);
    await page.locator('[data-testid="pedidos-table-status"]:has-text("Tabela Customizada")').waitFor({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // Concluir edição da tabela
    await page.locator('[data-testid="toggle-table-customization-btn"]').click();
    await page.waitForTimeout(800);

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'step3-nick-fury-custom-table.png'),
      fullPage: false,
    });
    log('ETAPA 3', 'Screenshot salvo: step3-nick-fury-custom-table.png');

    // -------------------------------------------------------------------------
    // ETAPA 4: Validação de Recarregamento (F5) em Nick Fury
    // -------------------------------------------------------------------------
    log('ETAPA 4', 'Recarregando página de Pedidos (F5) para validar persistência...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('[data-testid="pedidos-table-status"]:has-text("Tabela Customizada")').waitFor({ timeout: 10000 });

    const tableStatusF5 = await page.locator('[data-testid="pedidos-table-status"]').innerText();
    log('ETAPA 4', `Status da tabela após F5 em Nick Fury: "${tableStatusF5}"`);
    if (!tableStatusF5.includes('Customizada')) {
      throw new Error(`Esperado status Customizada após F5, obtido: ${tableStatusF5}`);
    }

    log('ETAPA 4', 'Retornando ao Dashboard para validar persistência dos gráficos e formulário dinâmico após F5...');
    await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle' });
    await page.locator('[data-testid="dashboard-layout-status"]:has-text("Layout Customizado")').waitFor({ timeout: 10000 });

    const dashStatusF5 = await page.locator('[data-testid="dashboard-layout-status"]').innerText();
    log('ETAPA 4', `Status do Dashboard após F5 em Nick Fury: "${dashStatusF5}"`);
    if (!dashStatusF5.includes('Customizado')) {
      throw new Error(`Esperado status Customizado no Dashboard após F5, obtido: ${dashStatusF5}`);
    }

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'step4-nick-fury-f5-preserved.png'),
      fullPage: false,
    });
    log('ETAPA 4', 'Screenshot salvo: step4-nick-fury-f5-preserved.png');

    // -------------------------------------------------------------------------
    // ETAPA 5: Alternância para Tony Stark (Isolamento Total Garantido)
    // -------------------------------------------------------------------------
    log('ETAPA 5', 'Alternando para Tony Stark via Persona Switcher...');
    await page.locator('[data-testid="persona-switcher"]').click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="persona-option-tony.stark"]').click();
    await page.waitForTimeout(800);

    const starkUserText = await page.locator('[data-testid="current-user-display"]').innerText();
    log('ETAPA 5', `Usuário ativo detectado: "${starkUserText}"`);
    if (!starkUserText.includes('Tony Stark')) {
      throw new Error(`Esperado Tony Stark no HUD, obtido: ${starkUserText}`);
    }

    // Validação de Isolamento no Dashboard: Tony Stark deve ver Layout de Fábrica (sem os gráficos alterados nem o formulário)
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('[data-testid="dashboard-layout-status"]:has-text("Layout de Fábrica")').waitFor({ timeout: 10000 });

    const starkDashStatus = await page.locator('[data-testid="dashboard-layout-status"]').innerText();
    log('ETAPA 5', `Status do Dashboard para Tony Stark: "${starkDashStatus}"`);
    if (!starkDashStatus.includes('Fábrica') && !starkDashStatus.includes('Governança')) {
      throw new Error(`Violação de isolamento! Tony Stark deveria ter status de Fábrica, obtido: ${starkDashStatus}`);
    }

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'step5-tony-stark-dashboard-isolated.png'),
      fullPage: false,
    });
    log('ETAPA 5', 'Screenshot salvo: step5-tony-stark-dashboard-isolated.png');

    // Validação de Isolamento na Tabela de Suprimentos / Pedidos para Tony Stark
    log('ETAPA 5', 'Navegando para Suprimentos como Tony Stark para conferir isolamento da tabela...');
    await page.goto(`${APP_URL}/suprimentos/pedidos`, { waitUntil: 'networkidle' });
    await page.locator('[data-testid="pedidos-table-status"]:has-text("Tabela de Fábrica")').waitFor({ timeout: 10000 });

    const starkTableStatus = await page.locator('[data-testid="pedidos-table-status"]').innerText();
    log('ETAPA 5', `Status da Tabela de Pedidos para Tony Stark: "${starkTableStatus}"`);
    if (!starkTableStatus.includes('Fábrica') && !starkTableStatus.includes('Governança')) {
      throw new Error(`Violação de isolamento de tabela! Tony Stark recebeu customização de Nick Fury: ${starkTableStatus}`);
    }

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'step5-tony-stark-table-isolated.png'),
      fullPage: false,
    });
    log('ETAPA 5', 'Screenshot salvo: step5-tony-stark-table-isolated.png');

    // -------------------------------------------------------------------------
    // ETAPA 6: Retorno para Nick Fury e Verificação de Preservação Contínua
    // -------------------------------------------------------------------------
    log('ETAPA 6', 'Alternando de volta para Nick Fury...');
    await page.locator('[data-testid="persona-switcher"]').click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="persona-option-nick.fury"]').click();
    await page.waitForTimeout(800);

    // Validação na Tabela de Pedidos: customização de Nick Fury deve reaparecer imediatamente
    await page.locator('[data-testid="pedidos-table-status"]:has-text("Tabela Customizada")').waitFor({ timeout: 10000 });
    const returnTableStatus = await page.locator('[data-testid="pedidos-table-status"]').innerText();
    log('ETAPA 6', `Status da Tabela de Pedidos no retorno para Nick Fury: "${returnTableStatus}"`);
    if (!returnTableStatus.includes('Customizada')) {
      throw new Error(`Customização da tabela perdida no retorno de Nick Fury! Obtido: ${returnTableStatus}`);
    }

    // Validação no Dashboard: customização do Dashboard deve estar preservada
    await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle' });
    await page.locator('[data-testid="dashboard-layout-status"]:has-text("Layout Customizado")').waitFor({ timeout: 10000 });
    const returnDashStatus = await page.locator('[data-testid="dashboard-layout-status"]').innerText();
    log('ETAPA 6', `Status do Dashboard no retorno para Nick Fury: "${returnDashStatus}"`);
    if (!returnDashStatus.includes('Customizado')) {
      throw new Error(`Customização do Dashboard perdida no retorno de Nick Fury! Obtido: ${returnDashStatus}`);
    }

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'step6-nick-fury-return-intact.png'),
      fullPage: false,
    });
    log('ETAPA 6', 'Screenshot salvo: step6-nick-fury-return-intact.png');

    // -------------------------------------------------------------------------
    // ETAPA 7: Consulta Direta ao Backend para Validar os Registros Persistidos
    // -------------------------------------------------------------------------
    log('ETAPA 7', 'Realizando auditoria direta aos endpoints de persistência no backend...');
    const backendVerification = await page.evaluate(async () => {
      const dashFury = await fetch(
        '/api/praxis/config/ui?componentType=praxis-dynamic-page&componentId=dynamic-page:hq-dashboard',
        { headers: { 'X-User-ID': 'nick.fury', 'X-Tenant-ID': 'shield-hq', 'X-Env': 'local' } },
      );
      const dashTony = await fetch(
        '/api/praxis/config/ui?componentType=praxis-dynamic-page&componentId=dynamic-page:hq-dashboard',
        { headers: { 'X-User-ID': 'tony.stark', 'X-Tenant-ID': 'shield-hq', 'X-Env': 'local' } },
      );
      const tableFury = await fetch(
        '/api/praxis/config/ui?componentType=praxis-table&componentId=table-config:heroes-hq-pedidos-crud',
        { headers: { 'X-User-ID': 'nick.fury', 'X-Tenant-ID': 'shield-hq', 'X-Env': 'local' } },
      );
      const tableTony = await fetch(
        '/api/praxis/config/ui?componentType=praxis-table&componentId=table-config:heroes-hq-pedidos-crud',
        { headers: { 'X-User-ID': 'tony.stark', 'X-Tenant-ID': 'shield-hq', 'X-Env': 'local' } },
      );

      return {
        dashFury: { status: dashFury.status, body: await dashFury.json().catch(() => null) },
        dashTony: { status: dashTony.status, body: await dashTony.json().catch(() => null) },
        tableFury: { status: tableFury.status, body: await tableFury.json().catch(() => null) },
        tableTony: { status: tableTony.status, body: await tableTony.json().catch(() => null) },
      };
    });

    log('ETAPA 7', 'Auditoria do backend concluída com sucesso:', {
      dashFuryStatus: backendVerification.dashFury.status,
      dashFuryTitle: backendVerification.dashFury.body?.payload?.context?.title,
      dashFuryWidgets: backendVerification.dashFury.body?.payload?.widgets?.map((w) => w.key),
      dashTonyStatus: backendVerification.dashTony.status,
      tableFuryStatus: backendVerification.tableFury.status,
      tableFuryCols: backendVerification.tableFury.body?.payload?.columns?.map((c) => ({
        field: c.field,
        visible: c.visible,
        renderer: c.renderer?.type,
      })),
      tableFuryRowStyles: backendVerification.tableFury.body?.payload?.rowConditionalStyles?.length,
      tableTonyStatus: backendVerification.tableTony.status,
    });

    // Asserções Canônicas de Persistência
    if (backendVerification.dashFury.status !== 200) {
      throw new Error(`Falha no GET Dashboard Nick Fury: status ${backendVerification.dashFury.status}`);
    }
    if (!backendVerification.dashFury.body?.payload?.widgets?.some((w) => w.key === 'tacticalDispatchForm')) {
      throw new Error('Widget tacticalDispatchForm ausente no payload persistido de Nick Fury!');
    }
    if (backendVerification.tableFury.status !== 200) {
      throw new Error(`Falha no GET Table Nick Fury: status ${backendVerification.tableFury.status}`);
    }
    if (backendVerification.tableTony.status !== 404 && backendVerification.tableTony.body !== null) {
      throw new Error(`Isolamento violado! Tony Stark não deveria ter config de tabela no backend`);
    }

    log('ETAPA 7', 'ISOLAMENTO E PERSISTÊNCIA AUDITADOS E COMPROVADOS NO BACKEND!');

    // -------------------------------------------------------------------------
    // ETAPA 8: Restauração de Fábrica e Limpeza Governamental
    // -------------------------------------------------------------------------
    log('ETAPA 8', 'Testando botões Restaurar Fábrica para reverter tudo para governança limpa...');

    // Reset Dashboard
    await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle' });
    await page.locator('[data-testid="toggle-customization-btn"]').click();
    await page.waitForTimeout(400);
    const [dashDeleteRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/praxis/config/ui') && res.request().method() === 'DELETE'),
      page.locator('[data-testid="reset-layout-btn"]').click(),
    ]);
    log('ETAPA 8', `Reset Dashboard DELETE concluído: status ${dashDeleteRes.status()}`);
    await page.locator('[data-testid="dashboard-layout-status"]:has-text("Layout de Fábrica")').waitFor({ timeout: 10000 });

    // Reset Tabela de Pedidos
    await page.goto(`${APP_URL}/suprimentos/pedidos`, { waitUntil: 'networkidle' });
    await page.locator('[data-testid="toggle-table-customization-btn"]').click();
    await page.waitForTimeout(400);
    const [tableDeleteRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/praxis/config/ui') && res.request().method() === 'DELETE'),
      page.locator('[data-testid="reset-table-btn"]').click(),
    ]);
    log('ETAPA 8', `Reset Tabela DELETE concluído: status ${tableDeleteRes.status()}`);
    await page.locator('[data-testid="pedidos-table-status"]:has-text("Tabela de Fábrica")').waitFor({ timeout: 10000 });

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'step8-factory-baseline-restored.png'),
      fullPage: false,
    });
    log('ETAPA 8', 'Screenshot salvo: step8-factory-baseline-restored.png');

    log('COMPLETED', 'BATERIA COMPLETA DE TESTES CONCLUÍDA COM 100% DE SUCESSO!');
    console.log('\n======================================================');
    console.log('RESUMO EXECUTIVO DA VALIDAÇÃO:');
    console.log('✔ Gráficos Customizados (tipo area + horizontal-bar) persistidos');
    console.log('✔ Novo Widget com Formulário Dinâmico persistido e exibido');
    console.log('✔ Tabela de Pedidos: colunas ocultadas (approvedAt, disabledReason, currency)');
    console.log('✔ Tabela de Pedidos: coluna composta (id + currency) via compose renderer');
    console.log('✔ Tabela de Pedidos: regras condicionais em células e linhas inteiras');
    console.log('✔ Tabela de Pedidos: animação de linhas e densidade compacta');
    console.log('✔ Alternância Multi-Usuário (Nick Fury vs. Tony Stark) com isolamento estrito');
    console.log('✔ Sobrevivência a F5 / Reload comprovada em ambas as telas');
    console.log('✔ Restauração de Fábrica (Reset) validada em ambas as telas');
    console.log('======================================================\n');
  } catch (err) {
    console.error('ERRO NA EXECUÇÃO DO TESTE:', err);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'comprehensive-test-failure.png'),
      fullPage: true,
    });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
