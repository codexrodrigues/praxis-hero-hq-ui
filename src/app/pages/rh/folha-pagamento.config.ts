import type { CrudMetadata } from '@praxisui/crud';
import { createBentoDetailExpansion } from '../shared/detail-expansion.helper';

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
      expansion: createBentoDetailExpansion([
        {
          type: 'cardGrid',
          title: 'Dossiê do Ciclo de Compensação & Liquidação',
          subtitle: 'Discriminação de proventos, encargos operacionais e liquidação bancária',
          columns: 3,
          minCardWidth: 280,
          cards: [
            {
              id: 'card-demonstrativo',
              title: 'Demonstrativo Salarial',
              subtitle: 'Valores brutos e créditos',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'badge',
                      labelExpr: "'Liquidado via Banco Central S.H.I.E.L.D.'",
                      icon: 'account_balance',
                    },
                    {
                      type: 'metric',
                      label: 'Salário Bruto Tático',
                      valueExpr: 'row.salarioBruto',
                      format: 'currency:BRL',
                      icon: 'payments',
                    },
                    {
                      type: 'metric',
                      label: 'Líquido Disponível',
                      valueExpr: 'row.salarioLiquido',
                      format: 'currency:BRL',
                      icon: 'account_balance_wallet',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-descontos',
              title: 'Retenções & Encargos',
              subtitle: 'Previdência e fundo de danos',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'progress',
                      label: 'Eficiência de Repasse Líquido',
                      valueExpr: "row.salarioBruto > 0 ? Math.round((row.salarioLiquido / row.salarioBruto) * 100) : 0",
                      max: 100,
                      showPercent: true,
                    },
                    {
                      type: 'metric',
                      label: 'Total de Retenções',
                      valueExpr: 'row.totalDescontos',
                      format: 'currency:BRL',
                      icon: 'price_check',
                    },
                    {
                      type: 'metric',
                      label: 'Competência',
                      valueExpr: 'row.mes + "/" + row.ano',
                      icon: 'calendar_month',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-liquidacao',
              title: 'Liquidação & Identificação',
              subtitle: 'Protocolo de tesouraria',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Data de Pagamento',
                      valueExpr: 'row.dataPagamento',
                      format: 'date:dd/MM/yyyy',
                      icon: 'event_available',
                    },
                    {
                      type: 'metric',
                      label: 'Colaborador Credenciado (ID)',
                      valueExpr: 'row.funcionarioId',
                      icon: 'badge',
                    },
                    {
                      type: 'metric',
                      label: 'Ciclo Contábil (ID)',
                      valueExpr: 'row.id',
                      icon: 'receipt',
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
  defaults: {
    openMode: 'drawer',
  },
};

