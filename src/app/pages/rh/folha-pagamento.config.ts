import type { CrudMetadata } from '@praxisui/crud';

export const FOLHA_PAGAMENTO_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/folhas-pagamento',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    cards: [
      {
        id: 'volume',
        label: 'Volume Folha Mensal',
        value: 'R$ 3,45M',
        caption: 'Competência ativa 03/2026',
        icon: 'account_balance_wallet',
        tone: 'info',
        filter: { mes: 3, ano: 2026 },
      },
      {
        id: 'consolidados',
        label: 'Registros Consolidados',
        value: '3.246 Ciclos',
        caption: 'Histórico fiscal e operacional',
        icon: 'receipt_long',
        tone: 'success',
        filter: {},
      },
      {
        id: 'retencoes',
        label: 'Retenções & Encargos',
        value: 'R$ 868,7k',
        caption: 'Previdência, saúde e encargos',
        icon: 'savings',
        tone: 'warning',
      },
      {
        id: 'liquidacao',
        label: 'Próxima Liquidação',
        value: '28/03/2026',
        caption: 'Programada via tesouraria',
        icon: 'calendar_month',
        tone: 'neutral',
      },
    ],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'funcionarioId', 'mes', 'ano', 'salarioBruto', 'totalDescontos', 'salarioLiquido', 'dataPagamento'],
      order: ['id', 'funcionarioId', 'mes', 'ano', 'salarioBruto', 'totalDescontos', 'salarioLiquido', 'margemLiquida', 'dataPagamento'],
      additions: [
        {
          field: 'margemLiquida',
          header: 'Eficiência Líquida (%)',
          width: '170px',
          align: 'center',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: "row.salarioBruto > 0 ? Math.round((row.salarioLiquido / row.salarioBruto) * 100) : 0",
                total: 100,
                toneExpr: "(row.salarioLiquido / row.salarioBruto) >= 0.8 ? 'success' : (row.salarioLiquido / row.salarioBruto) >= 0.6 ? 'info' : 'warning'",
                fallbackText: 'Margem',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '90px', align: 'center', header: 'Ciclo ID' },
        funcionarioId: { width: '140px', align: 'center', header: 'Colaborador ID' },
        mes: { width: '80px', align: 'center', header: 'Mês' },
        ano: { width: '90px', align: 'center', header: 'Ano' },
        salarioBruto: { width: '160px', align: 'right', type: 'currency', format: 'BRL', header: 'Salário Bruto' },
        totalDescontos: { width: '160px', align: 'right', type: 'currency', format: 'BRL', header: 'Retenções Táticas' },
        salarioLiquido: { width: '140px', align: 'right', type: 'currency', format: 'BRL', header: 'Líquido a Pagar' },
        dataPagamento: { width: '150px', align: 'center', type: 'date', header: 'Data de Pagamento' },
      },
    },
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar folha por colaborador, mês ou ano...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Ciclos', filter: '', icon: 'receipt_long' },
          { id: 'mesAtual', label: 'Competência Vigente (03/2026)', filter: 'mes=3 and ano=2026', icon: 'today' },
          { id: 'anoAtual', label: 'Exercício 2026', filter: 'ano=2026', icon: 'calendar_month' },
          { id: 'anoAnterior', label: 'Exercício 2025', filter: 'ano=2025', icon: 'history' },
        ],
        showAdvancedButton: true,
      },
    },
    actions: {
      bulk: {
        enabled: true,
        position: 'both',
        actions: [
          {
            id: 'reajustar-salarial',
            action: 'reajustar-salarial',
            label: 'Reajuste Coletivo de Vencimentos',
            icon: 'trending_up',
          },
          {
            id: 'atualizacao-cadastral',
            action: 'atualizacao-cadastral',
            label: 'Atualização de Registros em Massa',
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
        advancedFilters: {
          settings: {
            inline: true,
            alwaysVisibleFields: ['mes', 'ano', 'funcionarioId'],
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
      id: 'reajustar-salarial',
      action: 'reajustar-salarial',
      label: 'Reajuste Coletivo de Vencimentos',
      icon: 'trending_up',
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
              operationId: 'evaluate-reajuste',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/reajuste/evaluate',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-reajuste-proposal',
              schemaType: 'response',
              url: '/schemas/bulk-reajuste-proposal',
            },
          },
          confirmationOperation: {
            operation: {
              operationId: 'confirm-reajuste',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/reajuste/confirm',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-reajuste-execution',
              schemaType: 'response',
              url: '/schemas/bulk-reajuste-execution',
            },
          },
          proposalOperation: {
            operation: {
              operationId: 'get-reajuste-proposal',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/reajuste/proposal/{proposalId}',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-reajuste-proposal',
              schemaType: 'response',
              url: '/schemas/bulk-reajuste-proposal',
            },
          },
          proposalResultsOperation: {
            operation: {
              operationId: 'get-reajuste-proposal-results',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/reajuste/proposal/{proposalId}/results',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-reajuste-proposal-results',
              schemaType: 'response',
              url: '/schemas/bulk-reajuste-proposal-results',
            },
          },
          executionOperation: {
            operation: {
              operationId: 'get-reajuste-execution',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/reajuste/execution/{executionId}',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-reajuste-execution',
              schemaType: 'response',
              url: '/schemas/bulk-reajuste-execution',
            },
          },
          resultsOperation: {
            operation: {
              operationId: 'get-reajuste-execution-results',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/reajuste/execution/{executionId}/results',
              method: 'GET',
            },
            responseSchema: {
              schemaId: 'bulk-reajuste-execution-results',
              schemaType: 'response',
              url: '/schemas/bulk-reajuste-execution-results',
            },
          },
          cancelOperation: {
            operation: {
              operationId: 'cancel-reajuste-execution',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/reajuste/execution/{executionId}/cancel',
              method: 'POST',
            },
            responseSchema: {
              schemaId: 'bulk-reajuste-execution',
              schemaType: 'response',
              url: '/schemas/bulk-reajuste-execution',
            },
          },
        },
      },
    },
    {
      id: 'atualizacao-cadastral',
      action: 'atualizacao-cadastral',
      label: 'Atualização de Registros em Massa',
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
              operationId: 'bulk-update-folha-fields',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/uniform-update/evaluate',
              method: 'POST',
            },
            requestSchema: {
              schemaId: 'bulk-folha-update-schema',
              schemaType: 'request',
              url: '/schemas/bulk-folha-update',
            },
            writableFields: ['salarioBruto', 'totalDescontos', 'dataPagamento'],
            clearableFields: ['totalDescontos'],
          },
          evaluationOperation: {
            operation: {
              operationId: 'evaluate-uniform-update',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/uniform-update/evaluate',
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
              operationId: 'confirm-uniform-update',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/uniform-update/confirm',
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
              operationId: 'get-update-proposal',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/uniform-update/proposal/{proposalId}',
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
              operationId: 'get-update-proposal-results',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/uniform-update/proposal/{proposalId}/results',
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
              operationId: 'get-update-execution',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/uniform-update/execution/{executionId}',
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
              operationId: 'get-update-execution-results',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/uniform-update/execution/{executionId}/results',
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
              operationId: 'cancel-update-execution',
              path: '/api/v1/rh/folhas-pagamento/bulk-operations/uniform-update/execution/{executionId}/cancel',
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
