import type { CrudMetadata } from '@praxisui/crud';
import { createBentoDetailExpansion } from '../shared/detail-expansion.helper';

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
    columns: [
      {
        field: 'id',
        header: 'Cód.',
        width: '80px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'titulo',
        header: 'Título da Missão',
        width: '250px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'ameacaNome',
        header: 'Ameaça / Alvo Tático',
        width: '160px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'prioridade',
        header: 'Prioridade',
        width: '120px',
        align: 'center',
        sortable: true,
        filterable: true,
      },
      {
        field: 'status',
        header: 'Status Operacional',
        width: '150px',
        align: 'center',
        sortable: true,
        filterable: true,
      },
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
      {
        field: 'local',
        header: 'Teatro de Operações',
        width: '170px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'inicioPrev',
        header: 'Início Previsto',
        type: 'date',
        format: 'dd/MM/yyyy HH:mm',
        width: '160px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'fimPrev',
        header: 'Fim Previsto',
        type: 'date',
        format: 'dd/MM/yyyy HH:mm',
        width: '160px',
        sortable: true,
        filterable: true,
      },
    ],
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
      expansion: createBentoDetailExpansion([
        {
          type: 'cardGrid',
          title: 'Briefing Tático Integrado & Parâmetros de Missão',
          subtitle: 'Visão operacional expandida do teatro de operações e alvos prioritários',
          columns: 3,
          minCardWidth: 280,
          cards: [
            {
              id: 'card-briefing',
              title: 'Briefing & Diretrizes Táticas',
              subtitle: 'Objetivos e classificação de risco',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'badge',
                      labelExpr: 'row.prioridade',
                      icon: 'crisis_alert',
                    },
                    {
                      type: 'metric',
                      label: 'Objetivo Estratégico',
                      valueExpr: 'row.objetivo',
                      icon: 'flag',
                    },
                    {
                      type: 'metric',
                      label: 'Teatro de Operações',
                      valueExpr: 'row.local',
                      captionExpr: "row.status === 'CONCLUIDA' ? 'Operação concluída com êxito' : 'Janela operacional ativa'",
                      icon: 'location_on',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-esquadrao',
              title: 'Alvos & Liderança Operacional',
              subtitle: 'Comando e engajamento inimigo',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Ameaça / Hostil Associado',
                      valueExpr: 'row.ameacaNome',
                      icon: 'warning',
                    },
                    {
                      type: 'metric',
                      label: 'Liderança Tática',
                      valueExpr: "'Comando Central Hero HQ'",
                      icon: 'military_tech',
                    },
                    {
                      type: 'progress',
                      label: 'Prontidão Operacional do Esquadrão',
                      valueExpr: "row.status === 'CONCLUIDA' ? 100 : row.status === 'EM_ANDAMENTO' ? 68 : row.status === 'PAUSADA' ? 40 : 15",
                      max: 100,
                      showPercent: true,
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-cronograma',
              title: 'Cronograma & Janela de Ação',
              subtitle: 'Janelas temporais de execução',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Início Previsto',
                      valueExpr: 'row.inicioPrev',
                      format: 'date:dd/MM/yyyy HH:mm',
                      icon: 'calendar_today',
                    },
                    {
                      type: 'metric',
                      label: 'Prazo Limite',
                      valueExpr: 'row.fimPrev',
                      format: 'date:dd/MM/yyyy HH:mm',
                      icon: 'event_available',
                    },
                    {
                      type: 'metric',
                      label: 'Orçamento Tático Alocado',
                      valueExpr: "'Alocação Tática S.H.I.E.L.D.'",
                      icon: 'payments',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]),
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

