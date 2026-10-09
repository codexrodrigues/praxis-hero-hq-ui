import type { CrudMetadata } from '@praxisui/crud';

export const INDICADORES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'risk-intelligence/vw-indicadores-incidentes',
    idField: 'incidenteId',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    cards: [
      {
        id: 'passivo',
        label: 'Sinistros com Passivo',
        value: '74 Casos',
        caption: 'Histórico de acordos regulados pelo HQ',
        icon: 'gavel',
        tone: 'danger',
        filter: {},
      },
      {
        id: 'total',
        label: 'Volume de Indenizações',
        value: 'R$ 99,5 M',
        caption: 'Compensações acordadas com o judiciário',
        icon: 'payments',
        tone: 'warning',
      },
      {
        id: 'danos',
        label: 'Danos Civis Apurados',
        value: 'R$ 154,4 M',
        caption: 'Prejuízo material total auditado',
        icon: 'broken_image',
        tone: 'info',
      },
      {
        id: 'saldo',
        label: 'Saldo em Conciliação',
        value: 'R$ 72,8 M',
        caption: 'Em análise de perícia e fundos de seguro',
        icon: 'hourglass_top',
        tone: 'neutral',
      },
    ],
  },
  table: {
    meta: { idField: 'incidenteId' },
    idField: 'incidenteId',
    columnProjection: {
      source: 'schema',
      include: ['incidenteId', 'missao', 'local', 'severidade', 'danosCivis', 'totalIndenizacoes', 'totalPago', 'totalPendente'],
      order: ['incidenteId', 'missao', 'local', 'severidade', 'statusLiquidacao', 'danosCivis', 'totalIndenizacoes', 'totalPago', 'totalPendente'],
      additions: [
        {
          field: 'statusLiquidacao',
          header: 'Taxa de Liquidação',
          width: '180px',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: '= round(min(100, (totalPago / max(1, totalIndenizacoes)) * 100))',
                total: 100,
                toneExpr: {
                  if: [
                    { '==': [{ var: 'totalPendente' }, 0] },
                    'success',
                    { '==': [{ var: 'severidade' }, 'CRITICA'] },
                    'danger',
                    { '==': [{ var: 'severidade' }, 'ALTA'] },
                    'warning',
                    'info',
                  ],
                } as any,
                fallbackText: 'Taxa de Liquidação',
              },
            },
          },
        },
      ],
      overrides: {
        incidenteId: { width: '90px', align: 'center', header: 'Registro' },
        missao: { width: '200px', header: 'Missão de Origem' },
        local: { width: '150px', header: 'Local do Dano' },
        severidade: { width: '120px', align: 'center', header: 'Severidade' },
        danosCivis: { width: '170px', align: 'right', type: 'currency', format: 'BRL', header: 'Prejuízo Civil Estimado' },
        totalIndenizacoes: { width: '170px', align: 'right', type: 'currency', format: 'BRL', header: 'Indenizações Totais' },
        totalPago: { width: '160px', align: 'right', type: 'currency', format: 'BRL', header: 'Total Indenizado' },
        totalPendente: { width: '160px', align: 'right', type: 'currency', format: 'BRL', header: 'Saldo Pendente' },
      },
    },
    columns: [],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar sinistros por local, missão ou descrição...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Sinistros', filter: '', icon: 'account_balance' },
          { id: 'critico', label: 'Severidade Crítica', filter: "severidade='CRITICA'", icon: 'warning' },
          { id: 'pendente', label: 'Saldo Pendente', filter: 'totalPendente > 0', icon: 'pending' },
          { id: 'homologado', label: '100% Homologado', filter: 'totalPendente = 0', icon: 'verified' },
        ],
        showAdvancedButton: true,
      },
    },
    behavior: {
      filtering: {
        columnFilters: {
          enabled: true,
        },
      },
      expansion: {
        enabled: true,
        source: 'schema',
      },
    },
  } as unknown as CrudMetadata['table'],
  defaults: {
    openMode: 'drawer',
  },
};

