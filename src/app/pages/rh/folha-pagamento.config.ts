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
    source: 'human-resources/folhas-pagamento/filter?page=0&size=1',
    method: 'POST',
    payload: {},
    cards: [
      {
        id: 'volume',
        label: 'Volume Líquido Mensal',
        value: 'R$ 2,68M',
        caption: 'Competência 04/2026 · Bruto R$ 3,24M',
        icon: 'account_balance_wallet',
        tone: 'info',
        filter: { mes: 4, ano: 2026 },
      },
      {
        id: 'consolidados',
        label: 'Registros Consolidados',
        value: '4.520 Ciclos',
        valueExpr: "${totalElements | number | default:'4.520'} Ciclos",
        caption: 'Histórico fiscal e operacional auditado',
        icon: 'receipt_long',
        tone: 'success',
        filter: {},
      },
      {
        id: 'retencoes',
        label: 'Retenções & Encargos',
        value: 'R$ 552,1k',
        caption: 'Eficiência líquida de 82,9% na folha',
        icon: 'savings',
        tone: 'warning',
      },
      {
        id: 'liquidacao',
        label: 'Ciclos Exercício 2026',
        value: '992 Lançamentos',
        caption: 'Programados via tesouraria central',
        icon: 'calendar_month',
        tone: 'neutral',
        filter: { ano: 2026 },
      },
    ],
  },
  filterBar: {
    placement: 'scope-bar',
    inlineFields: ['anoBetween', 'mesBetween', 'funcionarioId'],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'funcionarioNome', 'mes', 'ano', 'salarioBruto', 'totalDescontos', 'salarioLiquido', 'dataPagamentoPrevista'],
      order: ['id', 'funcionarioNome', 'mes', 'ano', 'salarioBruto', 'totalDescontos', 'salarioLiquido', 'margemLiquida', 'dataPagamentoPrevista'],
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
                valueExpr: '= row.salarioBruto > 0 ? round((row.salarioLiquido / row.salarioBruto) * 100) : 0',
                total: 100,
                toneExpr: "= (row.salarioLiquido / row.salarioBruto) >= 0.8 ? 'success' : (row.salarioLiquido / row.salarioBruto) >= 0.6 ? 'info' : 'warning'",
                fallbackText: 'Margem',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '90px', align: 'center', header: 'Ciclo ID' },
        funcionarioNome: { width: '220px', header: 'Colaborador / Herói' },
        funcionarioId: { width: '140px', align: 'center', header: 'Colaborador ID' },
        mes: { width: '80px', align: 'center', header: 'Mês' },
        ano: { width: '90px', align: 'center', header: 'Ano' },
        salarioBruto: { width: '160px', align: 'right', type: 'currency', format: 'BRL', header: 'Salário Bruto' },
        totalDescontos: { width: '160px', align: 'right', type: 'currency', format: 'BRL', header: 'Retenções Táticas' },
        salarioLiquido: { width: '140px', align: 'right', type: 'currency', format: 'BRL', header: 'Líquido a Pagar' },
        dataPagamentoPrevista: { width: '150px', align: 'center', type: 'date', header: 'Data Prevista' },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todos os Ciclos', filter: {}, icon: 'receipt_long' },
          { id: 'mesAtual', label: 'Competência Vigente (04/2026)', filter: { mes: 4, ano: 2026 }, icon: 'today' },
          { id: 'anoAtual', label: 'Exercício 2026', filter: { ano: 2026 }, icon: 'calendar_month' },
          { id: 'anoAnterior', label: 'Exercício 2025', filter: { ano: 2025 }, icon: 'history' },
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
            alwaysVisibleFields: ['anoBetween', 'mesBetween', 'funcionarioId'],
          },
        },
      },
      expansion: {
        enabled: false,
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};


