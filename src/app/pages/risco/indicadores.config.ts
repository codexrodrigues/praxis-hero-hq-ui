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
    source: 'risk-intelligence/vw-indicadores-incidentes/stats/group-by',
    method: 'POST',
    payload: {
      filter: {},
      field: 'severidade',
      metrics: [{ operation: 'COUNT', alias: 'total' }],
    },
    cards: [
      {
        id: 'passivo',
        label: 'Sinistros com Passivo',
        value: '108 Casos',
        valueExpr: '${totalCount | number | default:108} Casos',
        caption: 'Histórico de acordos regulados pelo HQ',
        icon: 'gavel',
        tone: 'danger',
        filter: {},
      },
      {
        id: 'total',
        label: 'Acordos Quitados',
        value: '41 Quitados',
        caption: 'R$ 99,5 M em indenizações homologadas',
        icon: 'payments',
        tone: 'success',
        filter: { totalPendenteBetween: [0, 0] },
      },
      {
        id: 'danos',
        label: 'Sinistros Críticos',
        value: '23 Críticos',
        valueExpr: '${byKey.CRITICA | number | default:23} Críticos',
        caption: 'R$ 154,4 M em danos civis auditados',
        captionExpr: "R$ 154,4 M em danos civis auditados (${((byKey.CRITICA / totalCount) * 100) | round:1 | default:'21,3'}%)",
        icon: 'broken_image',
        tone: 'info',
        filter: { severidade: 'CRITICA' },
      },
      {
        id: 'saldo',
        label: 'Saldo em Conciliação',
        value: 'R$ 72,8 M',
        caption: '67 casos com saldo pendente em perícia',
        icon: 'hourglass_top',
        tone: 'warning',
        filter: { totalPendenteBetween: [0.01, 999999999] },
      },
    ],
  },
  filterBar: {
    placement: 'scope-bar',
    inlineFields: ['missao', 'local', 'severidade'],
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
        severidade: {
          width: '140px',
          align: 'center',
          header: 'Severidade',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'severidade' }, 'CRITICA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Crítica', variant: 'soft', color: 'warn', icon: 'gpp_bad' },
              },
            },
            {
              condition: { '==': [{ var: 'severidade' }, 'ALTA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Alta', variant: 'soft', color: 'accent', icon: 'warning' },
              },
            },
            {
              condition: { '==': [{ var: 'severidade' }, 'MEDIA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Média', variant: 'soft', color: 'primary', icon: 'shield' },
              },
            },
            {
              condition: { '==': [{ var: 'severidade' }, 'BAIXA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Baixa', variant: 'outlined', color: 'basic', icon: 'verified_user' },
              },
            },
          ],
        },
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


