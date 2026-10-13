import type { CrudMetadata } from '@praxisui/crud';

export const INCIDENTES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/incidentes',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    cards: [
      {
        id: 'all',
        label: 'Total de Ocorrências',
        value: '74 Registros',
        caption: 'Sinistros pós-combate catalogados',
        icon: 'report',
        tone: 'neutral',
        filter: {},
      },
      {
        id: 'criticos',
        label: 'Severidade Crítica',
        value: '18 Casos Críticos',
        caption: 'Alto impacto civil e estrutural',
        icon: 'warning',
        tone: 'danger',
        filter: { severidade: 'CRITICA' },
      },
      {
        id: 'danos',
        label: 'Danos Materiais Totais',
        value: 'R$ 154,4 M',
        caption: 'Cobertura via Fundo Tático de Indenizações',
        icon: 'account_balance',
        tone: 'warning',
      },
      {
        id: 'mitigacao',
        label: 'Taxa de Mitigação',
        value: '96,2% Contido',
        caption: 'Evacuação prévia e blindagem energética',
        icon: 'shield_with_heart',
        tone: 'success',
      },
    ],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'descricao', 'local', 'severidade', 'danosCivis', 'feridos', 'ocorridoEm'],
      order: ['id', 'descricao', 'local', 'severidade', 'indiceSinistro', 'danosCivis', 'feridos', 'ocorridoEm'],
      additions: [
        {
          field: 'indiceSinistro',
          header: 'Índice de Danos',
          width: '180px',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: '= round(min(100, (danosCivis / 4000000) * 100))',
                total: 100,
                toneExpr: {
                  if: [
                    { '==': [{ var: 'severidade' }, 'CRITICA'] },
                    'danger',
                    { '==': [{ var: 'severidade' }, 'ALTA'] },
                    'warning',
                    'info',
                  ],
                },
                fallbackText: 'Índice de Danos',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '90px', align: 'center', header: 'Registro' },
        descricao: { width: '320px', header: 'Descrição do Sinistro / Impacto' },
        local: { width: '200px', header: 'Teatro do Dano' },
        severidade: { width: '130px', align: 'center', header: 'Severidade' },
        danosCivis: { width: '170px', align: 'right', type: 'currency', format: 'BRL', header: 'Prejuízo Civil (R$)' },
        feridos: { width: '90px', align: 'center', header: 'Feridos' },
        ocorridoEm: { width: '150px', align: 'center', type: 'date', header: 'Data do Ocorrido' },
      },
    },
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar incidentes por local, descrição ou severidade...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Ocorrências', filter: '', icon: 'report' },
          { id: 'critico', label: 'Severidade Crítica', filter: "severidade='CRITICA'", icon: 'warning' },
          { id: 'alta', label: 'Alta Severidade', filter: "severidade='ALTA'", icon: 'crisis_alert' },
          { id: 'media', label: 'Severidade Moderada', filter: "severidade='MEDIA'", icon: 'info' },
        ],
        showAdvancedButton: true,
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
        columnFilters: {
          enabled: true,
        },
        advancedFilters: {
          settings: {
            inline: true,
            alwaysVisibleFields: ['local', 'severidade', 'descricao'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
      expansion: {
        enabled: true,
        source: 'schema',
      },
    },
    actions: {
      bulk: {
        enabled: true,
        position: 'both',
        actions: [
          {
            id: 'bulk-conter',
            action: 'bulk-conter',
            label: 'Conter Ocorrências',
            icon: 'verified_user',
            color: 'primary',
          },
          {
            id: 'bulk-edit-severidade',
            action: 'bulk-edit-severidade',
            label: 'Ajustar Severidade em Lote',
            icon: 'tune',
          },
        ],
      },
    },
  },
  actions: [
    {
      id: 'bulk-conter',
      action: 'bulk-conter',
      label: 'Conter Ocorrências Selecionadas',
      icon: 'verified_user',
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
              operationId: 'contain-incidentes',
              path: '/api/operations/incidentes/bulk/contain/evaluation',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-contain-proposal',
              schemaType: 'response',
              url: '/schemas/bulk-contain-proposal',
            },
          },
          confirmationOperation: {
            operation: {
              operationId: 'confirm-contain-incidentes',
              path: '/api/operations/incidentes/bulk/contain/confirmation',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-contain-execution',
              schemaType: 'response',
              url: '/schemas/bulk-contain-execution',
            },
          },
          proposalOperation: {
            operation: {
              operationId: 'get-proposal-contain-incidentes',
              path: '/api/operations/incidentes/bulk/contain/proposal/{proposalId}',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-contain-proposal',
              schemaType: 'response',
              url: '/schemas/bulk-contain-proposal',
            },
          },
          proposalResultsOperation: {
            operation: {
              operationId: 'get-proposal-results-contain-incidentes',
              path: '/api/operations/incidentes/bulk/contain/proposal/{proposalId}/results',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-contain-proposal-results',
              schemaType: 'response',
              url: '/schemas/bulk-contain-proposal-results',
            },
          },
          executionOperation: {
            operation: {
              operationId: 'get-execution-contain-incidentes',
              path: '/api/operations/incidentes/bulk/contain/execution/{executionId}',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-contain-execution',
              schemaType: 'response',
              url: '/schemas/bulk-contain-execution',
            },
          },
          resultsOperation: {
            operation: {
              operationId: 'get-execution-results-contain-incidentes',
              path: '/api/operations/incidentes/bulk/contain/execution/{executionId}/results',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-contain-execution-results',
              schemaType: 'response',
              url: '/schemas/bulk-contain-execution-results',
            },
          },
          cancelOperation: {
            operation: {
              operationId: 'cancel-contain-incidentes',
              path: '/api/operations/incidentes/bulk/contain/execution/{executionId}/cancel',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-contain-execution',
              schemaType: 'response',
              url: '/schemas/bulk-contain-execution',
            },
          },
        },
      },
    },
    {
      id: 'bulk-edit-severidade',
      action: 'bulk-edit-severidade',
      label: 'Ajustar Severidade em Lote',
      icon: 'tune',
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
              operationId: 'bulk-update-incidentes-fields',
              path: '/api/operations/incidentes/bulk/update/evaluation',
              method: 'POST',
            },
            requestSchema: {
              schemaId: 'bulk-incidentes-update-schema',
              schemaType: 'request',
              url: '/schemas/bulk-incidentes-update',
            },
            writableFields: ['severidade', 'local'],
            clearableFields: [],
          },
          evaluationOperation: {
            operation: {
              operationId: 'evaluate-update-incidentes',
              path: '/api/operations/incidentes/bulk/update/evaluation',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-update-proposal',
              schemaType: 'response',
              url: '/schemas/bulk-update-proposal',
            },
          },
          confirmationOperation: {
            operation: {
              operationId: 'confirm-update-incidentes',
              path: '/api/operations/incidentes/bulk/update/confirmation',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-update-execution',
              schemaType: 'response',
              url: '/schemas/bulk-update-execution',
            },
          },
          proposalOperation: {
            operation: {
              operationId: 'get-proposal-update-incidentes',
              path: '/api/operations/incidentes/bulk/update/proposal/{proposalId}',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-update-proposal',
              schemaType: 'response',
              url: '/schemas/bulk-update-proposal',
            },
          },
          proposalResultsOperation: {
            operation: {
              operationId: 'get-proposal-results-update-incidentes',
              path: '/api/operations/incidentes/bulk/update/proposal/{proposalId}/results',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-update-proposal-results',
              schemaType: 'response',
              url: '/schemas/bulk-update-proposal-results',
            },
          },
          executionOperation: {
            operation: {
              operationId: 'get-execution-update-incidentes',
              path: '/api/operations/incidentes/bulk/update/execution/{executionId}',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-update-execution',
              schemaType: 'response',
              url: '/schemas/bulk-update-execution',
            },
          },
          resultsOperation: {
            operation: {
              operationId: 'get-execution-results-update-incidentes',
              path: '/api/operations/incidentes/bulk/update/execution/{executionId}/results',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-update-execution-results',
              schemaType: 'response',
              url: '/schemas/bulk-update-execution-results',
            },
          },
          cancelOperation: {
            operation: {
              operationId: 'cancel-update-incidentes',
              path: '/api/operations/incidentes/bulk/update/execution/{executionId}/cancel',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-update-execution',
              schemaType: 'response',
              url: '/schemas/bulk-update-execution',
            },
          },
        },
      },
    },
  ],
  defaults: {
    openMode: 'drawer',
  },
};
