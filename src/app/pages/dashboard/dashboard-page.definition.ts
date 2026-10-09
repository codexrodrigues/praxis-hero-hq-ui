import type { WidgetPageDefinition } from '@praxisui/core';
import type { PraxisChartConfig } from '@praxisui/charts';
import type { PraxisListConfig } from '@praxisui/list';

export const INCIDENT_SEVERITY_DONUT_CONFIG: PraxisChartConfig = {
  id: 'hero-incident-severity-donut-chart',
  type: 'donut',
  sizing: { mode: 'fixed', height: 280 },
  interactions: {
    selection: true,
    crossFilter: true,
    eventActions: {
      crossFilter: {
        action: 'emit',
        mapping: {
          severidade: 'severidade',
        },
      },
    },
  },
  dataSource: {
    kind: 'remote',
    resourcePath: 'risk-intelligence/vw-indicadores-incidentes',
    query: {
      sourceKind: 'praxis.stats',
      statsOperation: 'group-by',
      statsPath: 'risk-intelligence/vw-indicadores-incidentes/stats/group-by',
      statsRequest: {
        filter: {},
        field: 'severidade',
        metric: {
          operation: 'COUNT',
          alias: 'total',
        },
      },
      dimensions: ['severidade'],
      metrics: [
        { field: 'total', aggregation: 'count', alias: 'total' },
      ],
    },
  },
  axes: {
    x: {
      field: 'severidade',
      type: 'category',
      label: 'Severidade',
    },
    y: {
      type: 'value',
      label: 'Total de Ocorrências',
    },
  },
  series: [
    {
      id: 'incidentesSeveridade',
      name: 'Severidade',
      type: 'pie',
      categoryField: 'severidade',
      metric: { field: 'total', aggregation: 'count' },
      labels: { visible: true },
    },
  ],
  theme: {
    tooltip: { enabled: true },
    palette: ['#ef4444', '#f97316', '#eab308', '#38bdf8'],
    legend: { visible: true },
  },
};

export const DEFCON_GAUGE_CONFIG: PraxisChartConfig = {
  id: 'hero-defcon-gauge-chart',
  type: 'gauge',
  sizing: { mode: 'fixed', height: 280 },
  gauge: {
    scale: { min: 1, max: 5 },
  },
  axes: {
    x: {
      field: 'estagio',
      type: 'category',
    },
  },
  series: [
    {
      id: 'nivelDefcon',
      name: 'DEFCON',
      categoryField: 'estagio',
      metric: { field: 'defcon', aggregation: 'avg' },
      labels: { visible: true },
    },
  ],
  dataSource: {
    kind: 'local',
    items: [
      { estagio: 'Prontidão Global', defcon: 4.2 },
    ],
  },
  theme: {
    palette: ['#06b6d4'],
    tooltip: { enabled: true },
  },
};

export const DISTRESS_SIGNALS_LIST_CONFIG: PraxisListConfig = {
  id: 'hero-distress-signals-list',
  dataSource: {
    resourcePath: 'operations/sinais-socorro',
    query: {
      sort: ['abertoEm,desc'],
    },
  },
  layout: {
    variant: 'list',
    itemSpacing: 'default',
    density: 'compact',
    pageSize: 6,
    lines: 2,
    dividers: 'none',
  },
  skin: {
    type: 'glass',
    radius: '12px',
  },
  selection: {
    mode: 'single',
    return: 'item',
  },
  templating: {
    leading: {
      type: 'icon',
      expr: 'emergency',
      color: 'warn',
    },
    primary: {
      type: 'text',
      expr: '${item.origem} · ${item.local}',
    },
    secondary: {
      type: 'text',
      expr: 'Ameaça Nível ${item.nivelAmeaca}',
    },
    meta: {
      type: 'date',
      expr: "${item.abertoEm} | pt-BR:short",
    },
    trailing: {
      type: 'chip',
      expr: '${item.status}',
      variant: 'outlined',
      color: 'accent',
    },
    chipColorMap: {
      ABERTO: 'warn',
      EM_ATENDIMENTO: 'accent',
      RESOLVIDO: 'primary',
      FALSO: 'neutral',
    },
  },
};

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
    collisionPolicy: 'swap',
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
      incidentsSeverityDonut: {
        col: 1,
        row: 14,
        colSpan: 4,
        rowSpan: 6,
        constraints: { minColSpan: 3, maxColSpan: 6 },
      },
      defconGaugeChart: {
        col: 5,
        row: 14,
        colSpan: 3,
        rowSpan: 6,
        constraints: { minColSpan: 3, maxColSpan: 6 },
      },
      distressSignalsList: {
        col: 8,
        row: 14,
        colSpan: 5,
        rowSpan: 6,
        constraints: { minColSpan: 4, maxColSpan: 12 },
      },
      recentIncidents: {
        col: 1,
        row: 20,
        colSpan: 12,
        rowSpan: 7,
        constraints: { minColSpan: 6, maxColSpan: 12 },
      },
      missionsTimeline: {
        col: 1,
        row: 27,
        colSpan: 6,
        rowSpan: 7,
        constraints: { minColSpan: 4, maxColSpan: 12 },
      },
      domainHub: {
        col: 7,
        row: 27,
        colSpan: 6,
        rowSpan: 7,
        constraints: { minColSpan: 4, maxColSpan: 12 },
      },
    },
  },
  composition: {
    version: '1.0.0',
    links: [
      {
        id: 'link-donut-severity-to-incidents',
        intent: 'event-propagation',
        from: {
          kind: 'component-port',
          ref: {
            widget: 'incidentsSeverityDonut',
            port: 'crossFilter',
            direction: 'output',
          },
        },
        to: {
          kind: 'component-port',
          ref: {
            widget: 'recentIncidents',
            port: 'queryContext',
            direction: 'input',
          },
        },
      },
    ],
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
                orientation: 'horizontal',
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
            progressValue: '${kpis.readinessRate}',
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
                        label: '${kpis.readinessRate}% Força',
                        className: 'tag-status ready-tag',
                      },
                    ],
                  },
                ],
                title: '${kpis.activeHeroes} Ativos',
                subtitle: 'Prontidão Operacional',
                content: [
                  {
                    type: 'progress',
                    valueExpr: 'progressValue',
                    showPercent: false,
                    className: 'fill-ready',
                  },
                  {
                    type: 'text',
                    text: '${kpis.activeHeroes} de ${kpis.totalHeroes} heróis prontos para ação',
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
            progressValue: '${kpis.missoesPercent}',
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
                        label: '${kpis.inProgressMissionsBadge} Em Curso',
                        className: 'tag-status operations-tag',
                      },
                    ],
                  },
                ],
                title: '${kpis.plannedMissions} Planejadas',
                subtitle: 'Missões Operacionais',
                content: [
                  {
                    type: 'progress',
                    valueExpr: 'progressValue',
                    showPercent: false,
                    className: 'fill-operations',
                  },
                  {
                    type: 'text',
                    text: '${kpis.totalMissions} missões catalogadas no radar tático',
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
            progressValue: '${kpis.folhaPercent}',
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
                        label: '${kpis.latestPayrollMonth}',
                        className: 'tag-status rh-tag',
                      },
                    ],
                  },
                ],
                title: 'R$ ${kpis.latestPayrollNetMillion} M',
                subtitle: 'Execução da Folha',
                content: [
                  {
                    type: 'progress',
                    valueExpr: 'progressValue',
                    showPercent: false,
                    className: 'fill-rh',
                  },
                  {
                    type: 'text',
                    text: 'Folha de ${kpis.latestPayrollEmployees} colaboradores auditados',
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
            progressValue: '${kpis.riscosPercent}',
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
                        label: '${kpis.totalIncidents} Incidentes',
                        className: 'tag-status risk-tag',
                      },
                    ],
                  },
                ],
                title: '${kpis.criticalIncidentsBadge} Críticos',
                subtitle: 'Ameaças & Incidentes',
                content: [
                  {
                    type: 'progress',
                    valueExpr: 'progressValue',
                    showPercent: false,
                    className: 'fill-risk',
                  },
                  {
                    type: 'text',
                    text: '${kpis.highIncidents} ocorrências de severidade alta em contenção',
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

    // 8. Donut Chart: Severidade de Incidentes
    {
      key: 'incidentsSeverityDonut',
      shell: {
        kind: 'dashboard-card',
        title: 'Distribuição de Severidade',
        subtitle: 'Classificação de risco dos incidentes registrados',
        icon: 'pie_chart',
        showHeader: true,
      },
      definition: {
        id: 'praxis-chart',
        inputs: {
          config: INCIDENT_SEVERITY_DONUT_CONFIG,
        },
      },
    },

    // 9. Gauge Chart: Alerta DEFCON
    {
      key: 'defconGaugeChart',
      shell: {
        kind: 'dashboard-card',
        title: 'Nível de Defesa Tática (DEFCON)',
        subtitle: 'Escala DEFCON: 5 (Estável) a 1 (Alerta Máximo) · Status: 4.2',
        icon: 'speed',
        showHeader: true,
      },
      definition: {
        id: 'praxis-chart',
        inputs: {
          config: DEFCON_GAUGE_CONFIG,
        },
      },
    },

    // 10. List Component: Sinais de Socorro Ativos
    {
      key: 'distressSignalsList',
      shell: {
        kind: 'dashboard-card',
        title: 'Sinais de Socorro Ativos',
        subtitle: 'Chamados de emergência tática recebidos pelo QG',
        icon: 'podcasts',
        showHeader: true,
      },
      definition: {
        id: 'praxis-list',
        inputs: {
          config: DISTRESS_SIGNALS_LIST_CONFIG,
        },
      },
    },

    // 11. Incidentes & Ameaças Recentes via praxis-table (com Microchart Bullet e Row Expansion)
    {
      key: 'recentIncidents',
      shell: {
        kind: 'dashboard-card',
        title: 'Monitoramento de Incidentes & Ameaças Recentes',
        subtitle: 'Feed operacional com telemetria tática, contenção e auditoria detalhada',
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
              { field: 'descricao', header: 'Ocorrência / Sinistro', width: '300px', sortable: true },
              { field: 'severidade', header: 'Severidade', width: '120px', align: 'center', sortable: true },
              {
                field: 'contencao',
                header: 'Contenção Tática',
                width: '180px',
                renderer: {
                  type: 'microVisualization',
                  microVisualization: {
                    visualization: {
                      kind: 'radial',
                      surface: 'table-cell',
                      valueExpr: '= max(15, 100 - round(min(85, (danosCivis / 4000000) * 100)))',
                      total: 100,
                      toneExpr: "= (100 - round(min(85, (danosCivis / 4000000) * 100))) >= 70 ? 'success' : ((100 - round(min(85, (danosCivis / 4000000) * 100))) >= 40 ? 'warning' : 'danger')",
                      fallbackText: 'Contenção Tática',
                    },
                  },
                },
              },
              { field: 'local', header: 'Teatro Operacional', width: '180px', sortable: true },
              { field: 'ocorridoEm', header: 'Data / Hora', width: '140px', sortable: true },
              { field: 'danosCivis', header: 'Danos Civis (R$)', width: '150px', align: 'right', sortable: true },
              { field: 'feridos', header: 'Feridos', width: '90px', align: 'center', sortable: true },
              { field: 'mortos', header: 'Baixas', width: '90px', align: 'center', sortable: true },
            ],
            toolbar: {
              visible: true,
              title: 'Incidentes em Campo',
            },
            appearance: {
              density: 'compact',
            },
            behavior: {
              expansion: {
                enabled: true,
                contractVersion: '1.0.0',
                identity: { rowKeySource: 'table.idField', requireStableIdField: true },
                state: { mode: 'uncontrolled' },
                interaction: {
                  trigger: 'icon',
                  toggleOnRowClick: false,
                },
                limits: { allowMultiple: false, maxExpandedRows: 1, onOverflow: 'collapseOldest' },
              },
              detail: {
                schemaContract: {
                  kind: 'praxis.detail.schema',
                  version: '1.0.0',
                  compat: 'semver',
                  allowedNodes: [
                    'card',
                    'value',
                    'stack',
                    'text',
                    'icon',
                    'badge',
                    'timeline',
                    'list',
                    'tabs',
                    'tab',
                    'mediaBlock',
                    'cardGrid',
                  ],
                  sanitization: 'strict',
                },
                rendering: {
                  strategy: 'registry',
                  registryId: 'praxis.detail.default',
                  rendererVersion: '1.0.0',
                  fallbackNodePolicy: 'failClosed',
                },
                source: {
                  mode: 'inline',
                  inlineSchema: {
                    layout: 'stack',
                    items: [
                      {
                        type: 'card',
                        title: 'Relatório Tático de Campo & Análise Forense',
                        subtitle: 'Protocolo de resposta rápida sob governança do Centro de Comando Tático',
                        content: [
                          {
                            type: 'stack',
                            items: [
                              {
                                type: 'value',
                                label: 'Teatro Operacional',
                                valueField: 'local',
                              },
                              {
                                type: 'value',
                                label: 'Severidade Tática',
                                valueField: 'severidade',
                              },
                              {
                                type: 'value',
                                label: 'Danos Civis Estimados (R$)',
                                valueField: 'danosCivis',
                              },
                              {
                                type: 'value',
                                label: 'Vítimas & Feridos',
                                valueField: 'feridos',
                              },
                              {
                                type: 'value',
                                label: 'Baixas Fatais',
                                valueField: 'mortos',
                              },
                              {
                                type: 'value',
                                label: 'Missão de Origem (ID)',
                                valueField: 'missaoId',
                              },
                              {
                                type: 'value',
                                label: 'Diretiva de Operação',
                                value:
                                  'Perímetro isolado com sucesso pela força tática. Esquadrões de perícia coordenando blindagem quântica e monitoramento contínuo.',
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },

    // 12. Diário Operacional de Missões via praxis-rich-content Timeline
    {
      key: 'missionsTimeline',
      shell: {
        kind: 'dashboard-card',
        title: 'Diário Operacional de Missões',
        subtitle: 'Cronologia tática e despacho de forças especiais em tempo real',
        icon: 'timeline',
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
                type: 'timeline',
                title: 'Atividades Recentes de Campo',
                position: 'right',
                orientation: 'vertical',
                markerVariant: 'dot',
                markerStyle: 'filled',
                items: [
                  {
                    title: 'Interceptação Orbital Completa',
                    description: 'Esquadrão Vanguarda neutralizou satélite espião em órbita LEO-2.',
                    opposite: '15:20',
                    badge: 'Concluído',
                    markerColor: 'success',
                    markerStyle: 'filled',
                    connectorColor: 'success',
                    connectorVariant: 'solid',
                  },
                  {
                    title: 'Contenção no Reator Arc',
                    description: 'Equipe Stark isolou vazamento térmico e restabeleceu campo magnético.',
                    opposite: '13:45',
                    badge: 'Em Curso',
                    markerColor: 'accent',
                    markerStyle: 'filled',
                    connectorColor: 'accent',
                    connectorVariant: 'solid',
                  },
                  {
                    title: 'Alerta DEFCON 4 Elevado',
                    description: 'Detecção de anomalia quântica não catalogada no Ártico.',
                    opposite: '11:10',
                    badge: 'Alerta',
                    markerColor: 'warn',
                    markerStyle: 'outlined',
                    connectorColor: 'warn',
                    connectorVariant: 'dashed',
                  },
                  {
                    title: 'Início de Turno & Calibração',
                    description: 'Checklist tático de prontidão executado por 21 heróis da base.',
                    opposite: '08:00',
                    badge: 'Rotina',
                    markerColor: 'neutral',
                    markerStyle: 'filled',
                    connectorColor: 'neutral',
                    connectorVariant: 'solid',
                  },
                ],
              },
            ],
          },
        },
      },
    },

    // 13. Centros de Comando & Especialidades via praxis-rich-content
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
                minColumnWidth: '240px',
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
