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
    actions: {
      bulk: {
        enabled: true,
        position: 'both',
        actions: [
          {
            id: 'bulk-dispatch',
            action: 'bulk-dispatch',
            label: 'Autorizar Despacho em Lote',
            icon: 'flight_takeoff',
            color: 'primary',
          },
          {
            id: 'bulk-update-missoes',
            action: 'bulk-update-missoes',
            label: 'Atualização de Missões em Massa',
            icon: 'edit_note',
          },
        ],
      },
    },
    behavior: {
      selection: {
        enabled: true,
        type: 'multiple',
        mode: 'checkbox',
        allowSelectAll: true,
        checkboxPosition: 'start',
        persistSelection: true,
        persistOnDataUpdate: false,
        visual: {
          highlightSelected: true,
          showSelectionCount: true,
        },
      },
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
    {
      id: 'bulk-dispatch',
      action: 'bulk-dispatch',
      label: 'Autorização e Despacho de Missões em Lote',
      icon: 'flight_takeoff',
      execution: {
        bulk: {
          mode: 'DOMAIN_COMMAND',
          atomicity: 'PER_ITEM',
          selectionModes: ['EXPLICIT'],
          executionModes: ['SYNC'],
          limits: {
            maxTargets: 100,
            maxRequestBytes: 1048576,
            proposalLifetimeMillis: 300000,
            unitDeadlineMillis: 15000,
          },
          evaluationOperation: {
            operation: {
              operationId: 'evaluate-dispatch-missoes',
              path: '/api/operations/missoes/bulk/dispatch/evaluation',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-dispatch-proposal',
              schemaType: 'response',
              url: '/schemas/bulk-dispatch-proposal',
            },
          },
          confirmationOperation: {
            operation: {
              operationId: 'confirm-dispatch-missoes',
              path: '/api/operations/missoes/bulk/dispatch/confirmation',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-dispatch-execution',
              schemaType: 'response',
              url: '/schemas/bulk-dispatch-execution',
            },
          },
          proposalOperation: {
            operation: {
              operationId: 'get-dispatch-proposal',
              path: '/api/operations/missoes/bulk/dispatch/proposal/{proposalId}',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-dispatch-proposal',
              schemaType: 'response',
              url: '/schemas/bulk-dispatch-proposal',
            },
          },
          proposalResultsOperation: {
            operation: {
              operationId: 'get-dispatch-proposal-results',
              path: '/api/operations/missoes/bulk/dispatch/proposal/{proposalId}/results',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-dispatch-proposal-results',
              schemaType: 'response',
              url: '/schemas/bulk-dispatch-proposal-results',
            },
          },
          executionOperation: {
            operation: {
              operationId: 'get-dispatch-execution',
              path: '/api/operations/missoes/bulk/dispatch/execution/{executionId}',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-dispatch-execution',
              schemaType: 'response',
              url: '/schemas/bulk-dispatch-execution',
            },
          },
          resultsOperation: {
            operation: {
              operationId: 'get-dispatch-execution-results',
              path: '/api/operations/missoes/bulk/dispatch/execution/{executionId}/results',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-dispatch-execution-results',
              schemaType: 'response',
              url: '/schemas/bulk-dispatch-execution-results',
            },
          },
          cancelOperation: {
            operation: {
              operationId: 'cancel-dispatch-execution',
              path: '/api/operations/missoes/bulk/dispatch/execution/{executionId}/cancel',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-dispatch-execution',
              schemaType: 'response',
              url: '/schemas/bulk-dispatch-execution',
            },
          },
        },
      },
    },
    {
      id: 'bulk-update-missoes',
      action: 'bulk-update-missoes',
      label: 'Atualização de Missões em Massa',
      icon: 'edit_note',
      execution: {
        bulk: {
          mode: 'UNIFORM_UPDATE',
          atomicity: 'PER_ITEM',
          selectionModes: ['EXPLICIT'],
          executionModes: ['SYNC'],
          limits: {
            maxTargets: 100,
            maxRequestBytes: 1048576,
            proposalLifetimeMillis: 300000,
            unitDeadlineMillis: 15000,
          },
          editableFields: {
            sourceOperation: {
              operationId: 'bulk-update-missoes-fields',
              path: '/api/operations/missoes/bulk/update/evaluation',
              method: 'POST',
            },
            requestSchema: {
              schemaId: 'bulk-missoes-update-schema',
              schemaType: 'request',
              url: '/schemas/bulk-missoes-update',
            },
            writableFields: ['prioridade', 'status', 'local'],
            clearableFields: ['local'],
          },
          evaluationOperation: {
            operation: {
              operationId: 'evaluate-update-missoes',
              path: '/api/operations/missoes/bulk/update/evaluation',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-missoes-update-proposal',
              schemaType: 'response',
              url: '/schemas/bulk-missoes-update-proposal',
            },
          },
          confirmationOperation: {
            operation: {
              operationId: 'confirm-update-missoes',
              path: '/api/operations/missoes/bulk/update/confirmation',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-missoes-update-execution',
              schemaType: 'response',
              url: '/schemas/bulk-missoes-update-execution',
            },
          },
          proposalOperation: {
            operation: {
              operationId: 'get-update-missoes-proposal',
              path: '/api/operations/missoes/bulk/update/proposal/{proposalId}',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-missoes-update-proposal',
              schemaType: 'response',
              url: '/schemas/bulk-missoes-update-proposal',
            },
          },
          proposalResultsOperation: {
            operation: {
              operationId: 'get-update-missoes-proposal-results',
              path: '/api/operations/missoes/bulk/update/proposal/{proposalId}/results',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-missoes-update-proposal-results',
              schemaType: 'response',
              url: '/schemas/bulk-missoes-update-proposal-results',
            },
          },
          executionOperation: {
            operation: {
              operationId: 'get-update-missoes-execution',
              path: '/api/operations/missoes/bulk/update/execution/{executionId}',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-missoes-update-execution',
              schemaType: 'response',
              url: '/schemas/bulk-missoes-update-execution',
            },
          },
          resultsOperation: {
            operation: {
              operationId: 'get-update-missoes-execution-results',
              path: '/api/operations/missoes/bulk/update/execution/{executionId}/results',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-missoes-update-execution-results',
              schemaType: 'response',
              url: '/schemas/bulk-missoes-update-execution-results',
            },
          },
          cancelOperation: {
            operation: {
              operationId: 'cancel-update-missoes-execution',
              path: '/api/operations/missoes/bulk/update/execution/{executionId}/cancel',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-missoes-update-execution',
              schemaType: 'response',
              url: '/schemas/bulk-missoes-update-execution',
            },
          },
        },
      },
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '920px', maxWidth: '95vw' },
  },
};
