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
        label: 'Acordos Quitados',
        value: '12 Quitados',
        caption: 'R$ 99,5 M em indenizações homologadas',
        icon: 'payments',
        tone: 'success',
        filter: { totalPendenteBetween: [0, 0] },
      },
      {
        id: 'danos',
        label: 'Sinistros Críticos',
        value: '18 Críticos',
        caption: 'R$ 154,4 M em danos civis auditados',
        icon: 'broken_image',
        tone: 'info',
        filter: { severidade: 'CRITICA' },
      },
      {
        id: 'saldo',
        label: 'Saldo em Conciliação',
        value: 'R$ 72,8 M',
        caption: '62 casos com saldo pendente em perícia',
        icon: 'hourglass_top',
        tone: 'warning',
        filter: { totalPendenteBetween: [0.01, 999999999] },
      },
    ],
  },
  table: {
    meta: { idField: 'incidenteId' },
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
                },
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
        danosCivis: { width: '170px', align: 'right', header: 'Prejuízo Civil Estimado' },
        totalIndenizacoes: { width: '170px', align: 'right', header: 'Indenizações Totais' },
        totalPago: { width: '160px', align: 'right', header: 'Total Indenizado' },
        totalPendente: { width: '160px', align: 'right', header: 'Saldo Pendente' },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todos os Sinistros', filter: {}, icon: 'account_balance' },
          { id: 'critico', label: 'Severidade Crítica', filter: { severidade: 'CRITICA' }, icon: 'warning' },
          { id: 'pendente', label: 'Saldo Pendente', filter: { totalPendenteBetween: [0.01, 999999999] }, icon: 'pending' },
          { id: 'homologado', label: '100% Homologado', filter: { totalPendenteBetween: [0, 0] }, icon: 'verified' },
        ],
      },
    },
    behavior: {
      filtering: {
        advancedFilters: {
          settings: {
            alwaysVisibleFields: ['missao', 'local', 'severidade'],
          },
        },
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};


