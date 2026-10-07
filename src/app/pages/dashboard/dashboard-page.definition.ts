import type { WidgetPageDefinition } from '@praxisui/core';
import type { PraxisChartConfig } from '@praxisui/charts';

export const PAYROLL_TREND_CHART_CONFIG: PraxisChartConfig = {
  id: 'hero-payroll-trend-chart',
  type: 'line',
  sizing: { mode: 'fixed', height: 320 },
  dataSource: {
    kind: 'remote',
    resourcePath: 'human-resources/vw-analytics-folha-pagamento',
    query: {
      sourceKind: 'praxis.stats',
      statsOperation: 'timeseries',
      statsPath: 'human-resources/vw-analytics-folha-pagamento/stats/timeseries',
      statsRequest: {
        filter: {},
        field: 'competencia',
        granularity: 'MONTH',
        from: '2025-10-01',
        to: '2026-03-31',
        metric: {
          operation: 'SUM',
          field: 'salarioLiquido',
          alias: 'salarioLiquido',
        },
        metrics: [
          {
            operation: 'SUM',
            field: 'salarioLiquido',
            alias: 'salarioLiquido',
          },
          {
            operation: 'SUM',
            field: 'totalDescontos',
            alias: 'totalDescontos',
          },
        ],
      },
      dimensions: ['competencia'],
      metrics: [
        { field: 'salarioLiquido', aggregation: 'sum', alias: 'salarioLiquido' },
        { field: 'totalDescontos', aggregation: 'sum', alias: 'totalDescontos' },
      ],
    },
  },
  axes: {
    x: {
      field: 'competencia',
      type: 'category',
      labels: { format: 'MMM/yy' },
    },
    y: {
      type: 'value',
      label: 'Volume (R$)',
      labels: { format: 'BRL|symbol|0|compact' },
    },
  },
  series: [
    {
      id: 'salarioLiquido',
      name: 'Salário Líquido',
      type: 'line',
      metric: { field: 'salarioLiquido', aggregation: 'sum' },
      color: '#38bdf8',
      smooth: true,
    },
    {
      id: 'totalDescontos',
      name: 'Descontos & Encargos',
      type: 'line',
      metric: { field: 'totalDescontos', aggregation: 'sum' },
      color: '#a855f7',
      smooth: true,
    },
  ],
  theme: {
    tooltip: { enabled: true, trigger: 'axis' },
    palette: ['#38bdf8', '#a855f7', '#22c55e'],
  },
};

export const REPUTATION_RANKING_CHART_CONFIG: PraxisChartConfig = {
  id: 'hero-reputation-ranking-chart',
  type: 'bar',
  sizing: { mode: 'fixed', height: 320 },
  dataSource: {
    kind: 'remote',
    resourcePath: 'human-resources/vw-ranking-reputacao',
    query: {
      sourceKind: 'praxis.stats',
      statsOperation: 'group-by',
      statsPath: 'human-resources/vw-ranking-reputacao/stats/group-by',
      statsRequest: {
        filter: { equipe: '%' },
        field: 'equipe',
        metric: {
          operation: 'AVG',
          field: 'scorePublico',
          alias: 'scorePublico',
        },
        metrics: [
          {
            operation: 'AVG',
            field: 'scorePublico',
            alias: 'scorePublico',
          },
          {
            operation: 'AVG',
            field: 'scoreGovernamental',
            alias: 'scoreGovernamental',
          },
        ],
      },
      dimensions: ['equipe'],
      metrics: [
        { field: 'scorePublico', aggregation: 'avg', alias: 'scorePublico' },
        { field: 'scoreGovernamental', aggregation: 'avg', alias: 'scoreGovernamental' },
      ],
    },
  },
  axes: {
    x: {
      field: 'equipe',
      type: 'category',
      label: 'Equipe',
      labels: { rotate: 15 },
    },
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
    {
      id: 'scoreGovernamental',
      name: 'Confiança Governamental',
      type: 'bar',
      metric: { field: 'scoreGovernamental', aggregation: 'avg' },
      color: '#10b981',
    },
  ],
  theme: {
    tooltip: { enabled: true, trigger: 'axis' },
    palette: ['#06b6d4', '#10b981'],
  },
};

export const DASHBOARD_PAGE_DEFINITION: WidgetPageDefinition = {
  context: {
    pageId: 'executive-command-dashboard',
    title: 'Centro de Comando Executivo',
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
    collisionPolicy: 'block',
    items: {
      heroBanner: {
        col: 1,
        row: 1,
        colSpan: 12,
        rowSpan: 4,
        constraints: { minColSpan: 6, maxColSpan: 12 },
      },
      kpiProntidao: {
        col: 1,
        row: 5,
        colSpan: 3,
        rowSpan: 3,
        constraints: { minColSpan: 2, maxColSpan: 6 },
      },
      kpiMissoes: {
        col: 4,
        row: 5,
        colSpan: 3,
        rowSpan: 3,
        constraints: { minColSpan: 2, maxColSpan: 6 },
      },
      kpiFolha: {
        col: 7,
        row: 5,
        colSpan: 3,
        rowSpan: 3,
        constraints: { minColSpan: 2, maxColSpan: 6 },
      },
      kpiRiscos: {
        col: 10,
        row: 5,
        colSpan: 3,
        rowSpan: 3,
        constraints: { minColSpan: 2, maxColSpan: 6 },
      },
      payrollChart: {
        col: 1,
        row: 8,
        colSpan: 6,
        rowSpan: 6,
        constraints: { minColSpan: 4, maxColSpan: 12 },
      },
      reputationChart: {
        col: 7,
        row: 8,
        colSpan: 6,
        rowSpan: 6,
        constraints: { minColSpan: 4, maxColSpan: 12 },
      },
      recentIncidents: {
        col: 1,
        row: 14,
        colSpan: 12,
        rowSpan: 6,
        constraints: { minColSpan: 6, maxColSpan: 12 },
      },
      domainHub: {
        col: 1,
        row: 20,
        colSpan: 12,
        rowSpan: 6,
        constraints: { minColSpan: 6, maxColSpan: 12 },
      },
    },
  },
  widgets: [
    // 1. Executive Banner Widget via praxis-rich-content
    {
      key: 'heroBanner',
      shell: {
        kind: 'none',
        showHeader: false,
      },
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
                      {
                        type: 'compose',
                        direction: 'row',
                        gap: 'xs',
                        className: 'status-pill ready-pill',
                        items: [
                          { type: 'icon', icon: 'verified_user' },
                          { type: 'badge', label: 'Sistemas Táticos Ativos' },
                        ],
                      },
                      {
                        type: 'compose',
                        direction: 'row',
                        gap: 'xs',
                        className: 'status-pill cobalt-pill',
                        items: [
                          { type: 'icon', icon: 'shield' },
                          { type: 'badge', label: 'Praxis Platform 9.0 · Metadata-Driven' },
                        ],
                      },
                    ],
                  },
                ],
                title: 'Centro de Comando & Prontidão',
                subtitle:
                  'Visão unificada das operações de heróis, distribuição de equipes, folha salarial e monitoramento contínuo de ameaças globais governada por metadados.',
                content: [],
                actions: [
                  {
                    type: 'actionButton',
                    label: 'Gerenciar Heróis & RH',
                    icon: 'group',
                    variant: 'raised',
                    color: 'primary',
                    action: {
                      actionId: 'navigation.openRoute',
                      payload: { path: '/rh/funcionarios' },
                    },
                  },
                  {
                    type: 'actionButton',
                    label: 'Centro de Missões',
                    icon: 'military_tech',
                    variant: 'stroked',
                    action: {
                      actionId: 'navigation.openRoute',
                      payload: { path: '/operacoes/missoes' },
                    },
                  },
                ],
                media: {
                  kind: 'icon',
                  icon: 'radar',
                  placement: 'trailing',
                },
              },
            ],
          },
        },
      },
    },

    // 2. Bento KPI 1: Prontidão
    {
      key: 'kpiProntidao',
      shell: {
        kind: 'none',
        showHeader: false,
      },
      definition: {
        id: 'praxis-rich-content',
        inputs: {
          context: {
            progressValue: 98.4,
          },
          document: {
            kind: 'praxis.rich-content',
            version: '1.0.0',
            nodes: [
              {
                type: 'card',
                variant: 'unstyled',
                tone: 'neutral',
                className: 'glass-panel bento-kpi-card',
                header: [
                  {
                    type: 'compose',
                    direction: 'row',
                    gap: 'sm',
                    items: [
                      {
                        type: 'icon',
                        icon: 'verified_user',
                        className: 'card-icon tone-ready',
                      },
                      {
                        type: 'badge',
                        label: 'Operacional',
                        className: 'tag-status ready-tag',
                      },
                    ],
                  },
                ],
                title: '98,4%',
                subtitle: 'Prontidão da Força',
                content: [
                  {
                    type: 'progress',
                    value: 98.4,
                    valueExpr: 'progressValue',
                    showPercent: false,
                    className: 'fill-ready',
                  },
                  {
                    type: 'text',
                    text: '21 heróis em escala ativa imediata',
                    className: 'card-footnote',
                  },
                ],
              },
            ],
          },
        },
      },
    },

    // 3. Bento KPI 2: Missões
    {
      key: 'kpiMissoes',
      shell: {
        kind: 'none',
        showHeader: false,
      },
      definition: {
        id: 'praxis-rich-content',
        inputs: {
          context: {
            progressValue: 70,
          },
          document: {
            kind: 'praxis.rich-content',
            version: '1.0.0',
            nodes: [
              {
                type: 'card',
                variant: 'unstyled',
                tone: 'neutral',
                className: 'glass-panel bento-kpi-card',
                header: [
                  {
                    type: 'compose',
                    direction: 'row',
                    gap: 'sm',
                    items: [
                      {
                        type: 'icon',
                        icon: 'military_tech',
                        className: 'card-icon tone-operations',
                      },
                      {
                        type: 'badge',
                        label: '07 Em Curso',
                        className: 'tag-status operations-tag',
                      },
                    ],
                  },
                ],
                title: '14 Agendadas',
                subtitle: 'Missões Ativas em Campo',
                content: [
                  {
                    type: 'progress',
                    value: 96.2,
                    valueExpr: 'progressValue',
                    showPercent: false,
                    className: 'fill-operations',
                  },
                  {
                    type: 'text',
                    text: 'Taxa de sucesso operacional de 96,2%',
                    className: 'card-footnote',
                  },
                ],
              },
            ],
          },
        },
      },
    },

    // 4. Bento KPI 3: Folha & Orçamento
    {
      key: 'kpiFolha',
      shell: {
        kind: 'none',
        showHeader: false,
      },
      definition: {
        id: 'praxis-rich-content',
        inputs: {
          context: {
            progressValue: 84.5,
          },
          document: {
            kind: 'praxis.rich-content',
            version: '1.0.0',
            nodes: [
              {
                type: 'card',
                variant: 'unstyled',
                tone: 'neutral',
                className: 'glass-panel bento-kpi-card',
                header: [
                  {
                    type: 'compose',
                    direction: 'row',
                    gap: 'sm',
                    items: [
                      {
                        type: 'icon',
                        icon: 'payments',
                        className: 'card-icon tone-rh',
                      },
                      {
                        type: 'badge',
                        label: 'Outubro / 2026',
                        className: 'tag-status rh-tag',
                      },
                    ],
                  },
                ],
                title: 'R$ 4,85 M',
                subtitle: 'Execução Orçamentária',
                content: [
                  {
                    type: 'progress',
                    value: 78.5,
                    valueExpr: 'progressValue',
                    showPercent: false,
                    className: 'fill-rh',
                  },
                  {
                    type: 'text',
                    text: 'Folha programada e benefícios especiais',
                    className: 'card-footnote',
                  },
                ],
              },
            ],
          },
        },
      },
    },

    // 5. Bento KPI 4: Riscos & Alertas
    {
      key: 'kpiRiscos',
      shell: {
        kind: 'none',
        showHeader: false,
      },
      definition: {
        id: 'praxis-rich-content',
        inputs: {
          context: {
            progressValue: 25,
          },
          document: {
            kind: 'praxis.rich-content',
            version: '1.0.0',
            nodes: [
              {
                type: 'card',
                variant: 'unstyled',
                tone: 'neutral',
                className: 'glass-panel bento-kpi-card',
                header: [
                  {
                    type: 'compose',
                    direction: 'row',
                    gap: 'sm',
                    items: [
                      {
                        type: 'icon',
                        icon: 'emergency',
                        className: 'card-icon tone-risk',
                      },
                      {
                        type: 'badge',
                        label: 'Defcon 5',
                        className: 'tag-status risk-tag',
                      },
                    ],
                  },
                ],
                title: '02 Em Análise',
                subtitle: 'Incidentes Críticos',
                content: [
                  {
                    type: 'progress',
                    value: 15.0,
                    valueExpr: 'progressValue',
                    showPercent: false,
                    className: 'fill-risk',
                  },
                  {
                    type: 'text',
                    text: 'Danos colaterais e contenção em andamento',
                    className: 'card-footnote',
                  },
                ],
              },
            ],
          },
        },
      },
    },

    // 6. Tactical Analytics Chart: Folha Salarial
    {
      key: 'payrollChart',
      shell: {
        kind: 'dashboard-card',
        title: 'Evolução da Folha Salarial & Benefícios',
        subtitle: 'Execução orçamentária dos últimos ciclos de pagamento tático',
        icon: 'payments',
        showHeader: true,
      },
      definition: {
        id: 'praxis-chart',
        inputs: {
          config: PAYROLL_TREND_CHART_CONFIG,
        },
      },
    },

    // 7. Tactical Analytics Chart: Ranking Reputacional
    {
      key: 'reputationChart',
      shell: {
        kind: 'dashboard-card',
        title: 'Ranking Reputacional da Força',
        subtitle: 'Aprovação pública vs. respaldo regulatório por herói',
        icon: 'military_tech',
        showHeader: true,
      },
      definition: {
        id: 'praxis-chart',
        inputs: {
          config: REPUTATION_RANKING_CHART_CONFIG,
        },
      },
    },

    // 8. Incidentes & Ameaças Recentes via praxis-table
    {
      key: 'recentIncidents',
      shell: {
        kind: 'dashboard-card',
        title: 'Monitoramento de Incidentes & Ameaças Recentes',
        subtitle: 'Feed operacional em tempo real governado por schemas Praxis',
        icon: 'emergency',
        showHeader: true,
      },
      definition: {
        id: 'praxis-table',
        inputs: {
          resourcePath: 'operations/incidentes',
          tableId: 'dashboard-incidentes-recentes',
          config: {
            columns: [
              { field: 'id', header: 'Código', width: '100px', align: 'center', sortable: true },
              { field: 'descricao', header: 'Ocorrência / Sinistro', width: '320px', sortable: true },
              { field: 'severidade', header: 'Severidade', width: '130px', align: 'center', sortable: true },
              { field: 'local', header: 'Teatro Operacional', width: '180px', sortable: true },
              { field: 'ocorridoEm', header: 'Data / Hora', width: '150px', sortable: true },
              { field: 'danosCivis', header: 'Danos Civis (R$)', width: '160px', align: 'right', sortable: true },
              { field: 'status', header: 'Status Tático', width: '130px', align: 'center', sortable: true },
            ],
            toolbar: {
              visible: true,
              title: 'Incidentes em Campo',
            },
            appearance: {
              density: 'compact',
            },
          },
          data: [
            { id: 'INC-881', descricao: 'Incursão de drones hostis na Zona Portuária', severidade: 'CRÍTICA', local: 'Setor Bravo - Cais 4', ocorridoEm: '15/10 14:22', danosCivis: 'R$ 1.450.000', status: 'Contido' },
            { id: 'INC-880', descricao: 'Falha de contenção no Reator Arc Subterrâneo', severidade: 'ALTA', local: 'Complexo Stark Sul', ocorridoEm: '15/10 11:05', danosCivis: 'R$ 380.000', status: 'Em Análise' },
            { id: 'INC-879', descricao: 'Perturbação gravitacional não catalogada', severidade: 'MÉDIA', local: 'Quadrante Ártico', ocorridoEm: '14/10 22:40', danosCivis: 'R$ 0', status: 'Investigando' },
            { id: 'INC-878', descricao: 'Tentativa de violação ao cofre de vibranium', severidade: 'CRÍTICA', local: 'Embaixada de Wakanda', ocorridoEm: '14/10 19:15', danosCivis: 'R$ 820.000', status: 'Mitigado' },
            { id: 'INC-877', descricao: 'Interceptação de comboio com tecnologia Chitauri', severidade: 'ALTA', local: 'Rodovia Interestadual 9', ocorridoEm: '14/10 08:30', danosCivis: 'R$ 2.100.000', status: 'Concluído' },
          ],
        },
      },
    },

    // 9. Centros de Comando & Especialidades via praxis-rich-content
    {
      key: 'domainHub',
      shell: {
        kind: 'dashboard-card',
        title: 'Centros de Comando & Especialidades',
        subtitle: 'Atalhos táticos de governança departamental e inteligência operacional',
        icon: 'hub',
        showHeader: true,
      },
      definition: {
        id: 'praxis-rich-content',
        inputs: {
          document: {
            kind: 'praxis.rich-content',
            version: '1.0.0',
            nodes: [
              {
                type: 'compose',
                layout: 'grid',
                columns: 'auto-fit',
                minColumnWidth: '320px',
                gap: 'md',
                className: 'hub-action-cards-grid',
                items: [
                  {
                    type: 'actionCard',
                    variant: 'unstyled',
                    title: 'Heróis & Colaboradores',
                    subtitle: 'Cadastros completos, identidades civis, remunerações e histórico funcional.',
                    icon: 'group',
                    ctaLabel: 'Acessar RH',
                    ctaIcon: 'arrow_forward',
                    action: {
                      actionId: 'navigation.openRoute',
                      payload: { path: '/rh/funcionarios' },
                    },
                    className: 'glass-panel hub-card-action tone-rh',
                  },
                  {
                    type: 'actionCard',
                    variant: 'unstyled',
                    title: 'Centro de Missões',
                    subtitle: 'Despacho tático, formação de squads, diário de bordo e desfechos operacionais.',
                    icon: 'military_tech',
                    ctaLabel: 'Operações',
                    ctaIcon: 'arrow_forward',
                    action: {
                      actionId: 'navigation.openRoute',
                      payload: { path: '/operacoes/missoes' },
                    },
                    className: 'glass-panel hub-card-action tone-operations',
                  },
                  {
                    type: 'actionCard',
                    variant: 'unstyled',
                    title: 'Ativos & Armaduras',
                    subtitle: 'Controle de custódia, manutenção preventiva de trajes e frota aérea/terrestre.',
                    icon: 'inventory_2',
                    ctaLabel: 'Ver Ativos',
                    ctaIcon: 'arrow_forward',
                    action: {
                      actionId: 'navigation.openRoute',
                      payload: { path: '/ativos/equipamentos' },
                    },
                    className: 'glass-panel hub-card-action tone-assets',
                  },
                  {
                    type: 'actionCard',
                    variant: 'unstyled',
                    title: 'Suprimentos & Contratos',
                    subtitle: 'Fornecedores homologados, requisições de compra e tecnologia bélica avançada.',
                    icon: 'contract',
                    ctaLabel: 'Contratos',
                    ctaIcon: 'arrow_forward',
                    action: {
                      actionId: 'navigation.openRoute',
                      payload: { path: '/suprimentos/contratos' },
                    },
                    className: 'glass-panel hub-card-action tone-supplies',
                  },
                  {
                    type: 'actionCard',
                    variant: 'unstyled',
                    title: 'Inteligência & Ameaças',
                    subtitle: 'Monitoramento geoespacial de vilões, acordos regulatórios e indenizações públicas.',
                    icon: 'radar',
                    ctaLabel: 'Monitorar',
                    ctaIcon: 'arrow_forward',
                    action: {
                      actionId: 'navigation.openRoute',
                      payload: { path: '/risco/ameacas' },
                    },
                    className: 'glass-panel hub-card-action tone-risk',
                  },
                  {
                    type: 'actionCard',
                    variant: 'unstyled',
                    title: 'Ranking Reputacional',
                    subtitle: 'Índices consolidados de aprovação popular, respaldo governamental e governança.',
                    icon: 'monitoring',
                    ctaLabel: 'Métricas',
                    ctaIcon: 'arrow_forward',
                    action: {
                      actionId: 'navigation.openRoute',
                      payload: { path: '/rh/reputacao' },
                    },
                    className: 'glass-panel hub-card-action tone-operations',
                  },
                ],
              },
            ],
          },
        },
      },
    },
  ],
};
