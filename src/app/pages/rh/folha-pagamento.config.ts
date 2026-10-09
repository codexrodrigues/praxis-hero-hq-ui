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
    columns: [],
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
    behavior: {
      filtering: {
        columnFilters: {
          enabled: true,
        },
        advancedFilters: {
          schemaUrl: '/schemas/filtered?path=/api/human-resources/folhas-pagamento/filter&operation=post&schemaType=request',
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
  } as unknown as CrudMetadata['table'],
  defaults: {
    openMode: 'drawer',
  },
};

