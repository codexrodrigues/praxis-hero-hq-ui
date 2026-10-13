import type { CrudMetadata } from '@praxisui/crud';

export const HEROES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/funcionarios',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    cards: [
      {
        id: 'total',
        label: 'Efetivo Total',
        value: '24 Cadastrados',
        caption: 'Quadro ativo e reserva',
        icon: 'group',
        tone: 'info',
        filter: {},
      },
      {
        id: 'ativos',
        label: 'Em Prontidão Ativa',
        value: '21 Ativos',
        caption: '87,5% da força operacional',
        icon: 'verified_user',
        tone: 'success',
        filter: { ativo: true },
      },
      {
        id: 'inativos',
        label: 'Em Reserva / Licença',
        value: '03 Inativos',
        caption: 'Reserva tática ou licença civil',
        icon: 'person_off',
        tone: 'warning',
        filter: { ativo: false },
      },
      {
        id: 'reputacao',
        label: 'Score Reputacional Médio',
        value: '91,2 / 100',
        caption: 'Índice combinado público-governo',
        icon: 'auto_awesome',
        tone: 'neutral',
      },
    ],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['avatarUrl', 'nomeCompleto', 'cargoNome', 'departamentoNome', 'ativo', 'dataAdmissao'],
      order: ['avatarUrl', 'nomeCompleto', 'cargoNome', 'departamentoNome', 'ativo', 'prontidaoScore', 'dataAdmissao'],
      additions: [
        {
          field: 'prontidaoScore',
          header: 'Prontidão de Campo',
          width: '180px',
          align: 'center',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: 'row.ativo ? 90 : 40',
                total: 100,
                toneExpr: "row.ativo ? 'success' : 'warning'",
                fallbackText: 'Prontidão',
              },
            },
          },
        },
      ],
      overrides: {
        avatarUrl: {
          width: '72px',
          align: 'center',
          header: 'Avatar',
          renderer: {
            type: 'avatar',
            avatar: {
              srcField: 'avatarUrl',
              altField: 'nomeCompleto',
              initialsField: 'nomeCompleto',
              shape: 'circle',
              size: 40,
            },
          },
        },
        nomeCompleto: { width: '240px', header: 'Nome Completo / Civil' },
        cargoNome: { width: '220px', header: 'Cargo' },
        departamentoNome: { width: '240px', header: 'Departamento' },
        ativo: { width: '110px', header: 'Status' },
        dataAdmissao: { width: '160px', header: 'Data de Admissão' },
      },
    },
    actions: {
      bulk: {
        enabled: true,
        position: 'both',
        actions: [
          {
            id: 'bulk-prontidao',
            action: 'bulk-prontidao',
            label: 'Mobilizar para Prontidão Ativa',
            icon: 'verified_user',
            color: 'primary',
          },
          {
            id: 'bulk-update-heroes',
            action: 'bulk-update-heroes',
            label: 'Atualização Cadastral em Massa',
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
        columnFilters: {
          enabled: true,
        },
      },
    },
  },
  filterBar: {
    inlineFields: ['nomeCompleto', 'departamentoNome', 'ativo'],
    quickFilters: [
      { id: 'all', label: 'Todos os Heróis', icon: 'group', filter: {} },
      { id: 'ativos', label: 'Em Prontidão', icon: 'verified_user', filter: 'ativo=true' },
      { id: 'inativos', label: 'Reserva / Licença', icon: 'person_off', filter: 'ativo=false' },
    ],
    showAdvanced: true,
  },
  actions: [
    {
      id: 'edit',
      label: 'Editar Dossiê',
      action: 'edit',
      openMode: 'modal',
      formId: 'funcionarios-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Novo Colaborador',
      action: 'create',
      openMode: 'modal',
      formId: 'funcionarios-create',
    },
    {
      id: 'bulk-prontidao',
      action: 'bulk-prontidao',
      label: 'Mobilização Tática para Prontidão Ativa',
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
              operationId: 'evaluate-prontidao-heroes',
              path: '/api/human-resources/funcionarios/bulk/mobilizar/evaluation',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-prontidao-proposal',
              schemaType: 'response',
              url: '/schemas/bulk-prontidao-proposal',
            },
          },
          confirmationOperation: {
            operation: {
              operationId: 'confirm-prontidao-heroes',
              path: '/api/human-resources/funcionarios/bulk/mobilizar/confirmation',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-prontidao-execution',
              schemaType: 'response',
              url: '/schemas/bulk-prontidao-execution',
            },
          },
          proposalOperation: {
            operation: {
              operationId: 'get-prontidao-proposal',
              path: '/api/human-resources/funcionarios/bulk/mobilizar/proposal/{proposalId}',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-prontidao-proposal',
              schemaType: 'response',
              url: '/schemas/bulk-prontidao-proposal',
            },
          },
          proposalResultsOperation: {
            operation: {
              operationId: 'get-prontidao-proposal-results',
              path: '/api/human-resources/funcionarios/bulk/mobilizar/proposal/{proposalId}/results',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-prontidao-proposal-results',
              schemaType: 'response',
              url: '/schemas/bulk-prontidao-proposal-results',
            },
          },
          executionOperation: {
            operation: {
              operationId: 'get-prontidao-execution',
              path: '/api/human-resources/funcionarios/bulk/mobilizar/execution/{executionId}',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-prontidao-execution',
              schemaType: 'response',
              url: '/schemas/bulk-prontidao-execution',
            },
          },
          resultsOperation: {
            operation: {
              operationId: 'get-prontidao-execution-results',
              path: '/api/human-resources/funcionarios/bulk/mobilizar/execution/{executionId}/results',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-prontidao-execution-results',
              schemaType: 'response',
              url: '/schemas/bulk-prontidao-execution-results',
            },
          },
          cancelOperation: {
            operation: {
              operationId: 'cancel-prontidao-execution',
              path: '/api/human-resources/funcionarios/bulk/mobilizar/execution/{executionId}/cancel',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-prontidao-execution',
              schemaType: 'response',
              url: '/schemas/bulk-prontidao-execution',
            },
          },
        },
      },
    },
    {
      id: 'bulk-update-heroes',
      action: 'bulk-update-heroes',
      label: 'Atualização Cadastral em Massa',
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
              operationId: 'bulk-update-heroes-fields',
              path: '/api/human-resources/funcionarios/bulk/update/evaluation',
              method: 'POST',
            },
            requestSchema: {
              schemaId: 'bulk-heroes-update-schema',
              schemaType: 'request',
              url: '/schemas/bulk-heroes-update',
            },
            writableFields: ['departamentoNome', 'cargoNome', 'ativo'],
            clearableFields: [],
          },
          evaluationOperation: {
            operation: {
              operationId: 'evaluate-update-heroes',
              path: '/api/human-resources/funcionarios/bulk/update/evaluation',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-heroes-update-proposal',
              schemaType: 'response',
              url: '/schemas/bulk-heroes-update-proposal',
            },
          },
          confirmationOperation: {
            operation: {
              operationId: 'confirm-update-heroes',
              path: '/api/human-resources/funcionarios/bulk/update/confirmation',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-heroes-update-execution',
              schemaType: 'response',
              url: '/schemas/bulk-heroes-update-execution',
            },
          },
          proposalOperation: {
            operation: {
              operationId: 'get-update-heroes-proposal',
              path: '/api/human-resources/funcionarios/bulk/update/proposal/{proposalId}',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-heroes-update-proposal',
              schemaType: 'response',
              url: '/schemas/bulk-heroes-update-proposal',
            },
          },
          proposalResultsOperation: {
            operation: {
              operationId: 'get-update-heroes-proposal-results',
              path: '/api/human-resources/funcionarios/bulk/update/proposal/{proposalId}/results',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-heroes-update-proposal-results',
              schemaType: 'response',
              url: '/schemas/bulk-heroes-update-proposal-results',
            },
          },
          executionOperation: {
            operation: {
              operationId: 'get-update-heroes-execution',
              path: '/api/human-resources/funcionarios/bulk/update/execution/{executionId}',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-heroes-update-execution',
              schemaType: 'response',
              url: '/schemas/bulk-heroes-update-execution',
            },
          },
          resultsOperation: {
            operation: {
              operationId: 'get-update-heroes-execution-results',
              path: '/api/human-resources/funcionarios/bulk/update/execution/{executionId}/results',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-heroes-update-execution-results',
              schemaType: 'response',
              url: '/schemas/bulk-heroes-update-execution-results',
            },
          },
          cancelOperation: {
            operation: {
              operationId: 'cancel-update-heroes-execution',
              path: '/api/human-resources/funcionarios/bulk/update/execution/{executionId}/cancel',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-heroes-update-execution',
              schemaType: 'response',
              url: '/schemas/bulk-heroes-update-execution',
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
