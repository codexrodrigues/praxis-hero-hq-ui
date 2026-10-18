import type { CrudMetadata } from '@praxisui/crud';

export const AMEACAS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'risk-intelligence/ameacas',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    source: 'risk-intelligence/ameacas/stats/group-by',
    method: 'POST',
    payload: {
      filter: {},
      field: 'status',
      metrics: [{ operation: 'COUNT', alias: 'total' }],
    },
    cards: [
      {
        id: 'ameacas',
        label: 'Ameaças Monitoradas',
        value: '24 Alvos',
        valueExpr: '${totalCount | number | default:24} Alvos',
        caption: 'Radar contínuo em frequência quântica',
        icon: 'warning',
        tone: 'danger',
        filter: {},
      },
      {
        id: 'confronto',
        label: 'Em Confronto Ativo',
        value: '9 em Combate',
        valueExpr: '${byKey.CONFRONTO | number | default:9} em Combate',
        caption: 'Esquadrões mobilizados em solo (37,5%)',
        captionExpr: "Esquadrões mobilizados em solo (${((byKey.CONFRONTO / totalCount) * 100) | round:1 | default:'37,5'}%)",
        icon: 'crisis_alert',
        tone: 'warning',
        filter: { status: 'CONFRONTO' },
      },
      {
        id: 'contidos',
        label: 'Contidos / Prisão Raft',
        value: '3 Neutralizados',
        valueExpr: '${byKey.CAPTURADO | number | default:3} Neutralizados',
        caption: 'Custodiados em estase de força',
        icon: 'lock',
        tone: 'success',
        filter: { status: 'CAPTURADO' },
      },
      {
        id: 'recompensas',
        label: 'Fundo Total de Recompensas',
        value: 'R$ 12,1 M',
        caption: '23 ameaças nível 5+ · Acordo de Sokovia',
        icon: 'payments',
        tone: 'info',
        filter: { nivelBetween: [5, 10] },
      },
    ],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'nome', 'classe', 'planeta', 'nivel', 'status', 'recompensa'],
      order: ['id', 'nome', 'classe', 'planeta', 'nivel', 'indicePerigo', 'status', 'recompensa'],
      additions: [
        {
          field: 'indicePerigo',
          header: 'Índice de Letalidade',
          width: '180px',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: '= min(100, row.nivel * 14)',
                total: 100,
                toneExpr: "= row.nivel >= 6 ? 'danger' : row.nivel >= 4 ? 'warning' : 'info'",
                fallbackText: 'Letalidade',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '80px', align: 'center', header: 'Cód.' },
        nome: { width: '220px', header: 'Designação da Ameaça' },
        classe: { width: '130px', align: 'center', header: 'Classe Tática' },
        planeta: { width: '140px', header: 'Origem Planetária' },
        nivel: { width: '80px', align: 'center', type: 'number', header: 'Nível' },
        status: { width: '150px', align: 'center', header: 'Status de Contenção' },
        recompensa: { width: '160px', align: 'right', type: 'currency', format: 'BRL', header: 'Recompensa Fixada' },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todas as Ameaças', filter: {}, icon: 'radar' },
          { id: 'confronto', label: 'Em Confronto Ativo', filter: { status: 'CONFRONTO' }, icon: 'crisis_alert' },
          { id: 'critico', label: 'Nível Ômega / Crítico', filter: { nivelBetween: [5, 10] }, icon: 'warning' },
          { id: 'contidos', label: 'Neutralizados / Raft', filter: { status: 'CAPTURADO' }, icon: 'lock' },
        ],
      },
    },
    behavior: {
      filtering: {
        advancedFilters: {
          settings: {
            alwaysVisibleFields: ['nome', 'classe', 'status', 'planeta'],
          },
        },
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};


