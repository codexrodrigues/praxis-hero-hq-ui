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
    cards: [
      {
        id: 'ativas',
        label: 'Missões Ativas em Campo',
        value: '06 Incursões',
        caption: 'Em andamento no radar operacional',
        icon: 'flight_takeoff',
        tone: 'info',
        filter: { status: 'EM_ANDAMENTO' },
      },
      {
        id: 'concluidas',
        label: 'Taxa de Sucesso Histórica',
        value: '66,7%',
        caption: '4 missões concluídas com êxito',
        icon: 'task_alt',
        tone: 'success',
        filter: { status: 'CONCLUIDA' },
      },
      {
        id: 'planejamento',
        label: 'Em Planejamento / Briefing',
        value: '10 Missões',
        caption: 'Em preparação e briefing tático',
        icon: 'schedule',
        tone: 'warning',
        filter: { status: 'PLANEJADA' },
      },
      {
        id: 'omega',
        label: 'Prioridade Ômega / Crítica',
        value: '10 Alertas',
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
                valueExpr: "row.status === 'CONCLUIDA' ? 100 : row.status === 'EM_ANDAMENTO' ? 68 : row.status === 'PAUSADA' ? 40 : 15",
                total: 100,
                toneExpr: "row.status === 'CONCLUIDA' ? 'success' : row.prioridade === 'CRITICA' ? 'danger' : 'info'",
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
    columns: [],
    toolbar: {
      visible: true,
      filters: {
        enabled: true,
        showAdvancedButton: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Missões', icon: 'military_tech', filter: {} },
          { id: 'ativas', label: 'Em Andamento', icon: 'flight_takeoff', filter: { status: 'EM_ANDAMENTO' } },
          { id: 'omega', label: 'Prioridade Ômega', icon: 'crisis_alert', filter: { prioridade: 'CRITICA' } },
          { id: 'planejamento', label: 'Em Planejamento', icon: 'schedule', filter: { status: 'PLANEJADA' } },
        ],
      },
    },
    behavior: {
      filtering: {
        enabled: true,
        columnFilters: {
          enabled: true,
        },
        advancedFilters: {
          enabled: true,
          settings: {
            showAdvanced: true,
            alwaysVisibleFields: ['titulo', 'status', 'prioridade', 'ameacaNome', 'local'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
      expansion: {
        enabled: true,
        source: 'schema',
      },
    },
  } as unknown as CrudMetadata['table'],
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

