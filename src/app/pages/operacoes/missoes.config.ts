import type { CrudMetadata } from '@praxisui/crud';

export const MISSOES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/missoes',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    source: 'operations/vw-resumo-missoes/stats/group-by',
    method: 'POST',
    payload: {
      filter: {},
      field: 'status',
      metrics: [{ operation: 'COUNT', alias: 'total' }],
    },
    cards: [
      {
        id: 'ativas',
        label: 'Missões Ativas em Campo',
        value: '9 Incursões',
        valueExpr: '${byKey.EM_ANDAMENTO | number | default:9} Incursões',
        caption: 'Em andamento no teatro operacional',
        captionExpr: 'De ${totalCount | number | default:46} missões catalogadas no comando',
        icon: 'flight_takeoff',
        tone: 'info',
        filter: { status: 'EM_ANDAMENTO' },
      },
      {
        id: 'concluidas',
        label: 'Missões Concluídas',
        value: '22 Concluídas',
        valueExpr: '${byKey.CONCLUIDA | number | default:22} Concluídas',
        caption: 'Operações finalizadas com êxito',
        captionExpr: "Operações finalizadas com êxito (${((byKey.CONCLUIDA / totalCount) * 100) | round:1 | default:'47,8'}%)",
        icon: 'task_alt',
        tone: 'success',
        filter: { status: 'CONCLUIDA' },
      },
      {
        id: 'planejamento',
        label: 'Em Planejamento / Briefing',
        value: '15 Missões',
        valueExpr: '${byKey.PLANEJADA | number | default:15} Missões',
        caption: 'Em preparação e briefing tático',
        captionExpr: "Em preparação e briefing tático (${((byKey.PLANEJADA / totalCount) * 100) | round:1 | default:'32,6'}%)",
        icon: 'schedule',
        tone: 'warning',
        filter: { status: 'PLANEJADA' },
      },
      {
        id: 'omega',
        label: 'Prioridade Ômega / Crítica',
        value: '15 Alertas',
        caption: 'Engajamento de prioridade crítica',
        icon: 'crisis_alert',
        tone: 'danger',
        filter: { prioridade: 'CRITICA' },
      },
    ],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'titulo', 'ameacaNome', 'prioridade', 'status', 'local', 'inicioPrev', 'fimPrev'],
      order: ['id', 'titulo', 'ameacaNome', 'prioridade', 'status', 'progresso', 'local', 'inicioPrev', 'fimPrev'],
      additions: [
        {
          field: 'progresso',
          header: 'Prontidão Operacional',
          width: '180px',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: "= row.status === 'CONCLUIDA' ? 100 : row.status === 'EM_ANDAMENTO' ? 68 : row.status === 'PAUSADA' ? 40 : 15",
                total: 100,
                toneExpr: "= row.status === 'CONCLUIDA' ? 'success' : row.prioridade === 'CRITICA' ? 'danger' : 'info'",
                fallbackText: 'Prontidão',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '80px', align: 'center', header: 'Cód.' },
        titulo: { width: '250px', header: 'Título da Missão' },
        ameacaNome: { width: '160px', header: 'Ameaça / Alvo Tático' },
        prioridade: { width: '120px', align: 'center', header: 'Prioridade' },
        status: { width: '150px', align: 'center', header: 'Status Operacional' },
        local: { width: '170px', header: 'Teatro de Operações' },
        inicioPrev: { width: '160px', type: 'date', format: 'dd/MM/yyyy HH:mm', header: 'Início Previsto' },
        fimPrev: { width: '160px', type: 'date', format: 'dd/MM/yyyy HH:mm', header: 'Fim Previsto' },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todas as Missões', icon: 'military_tech', filter: {} },
          { id: 'ativas', label: 'Em Andamento', icon: 'flight_takeoff', filter: { status: 'EM_ANDAMENTO' } },
          { id: 'omega', label: 'Prioridade Ômega', icon: 'crisis_alert', filter: { prioridade: 'CRITICA' } },
          { id: 'planejamento', label: 'Em Planejamento', icon: 'schedule', filter: { status: 'PLANEJADA' } },
        ],
      },
    },
    behavior: {
      selection: {
        enabled: true,
      },
      filtering: {
        advancedFilters: {
          settings: {
            alwaysVisibleFields: ['titulo', 'status', 'prioridade', 'ameacaId', 'local'],
          },
        },
      },
    },
  },
  actions: [
    {
      id: 'edit',
      label: 'Despacho Tático',
      action: 'edit',
      openMode: 'modal',
      formId: 'missoes-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Nova Missão',
      action: 'create',
      openMode: 'modal',
      formId: 'missoes-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '920px', maxWidth: '95vw' },
  },
};


