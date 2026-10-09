import type { CrudMetadata } from '@praxisui/crud';

export const PEDIDOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'procurement/purchase-orders',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    cards: [
      {
        id: 'ordens',
        label: 'Ordens de Compra',
        value: '10 Pedidos',
        caption: 'Ciclo de suprimento em andamento',
        icon: 'local_shipping',
        tone: 'info',
        filter: {},
      },
      {
        id: 'aprovadas',
        label: 'Aprovadas / Entregues',
        value: '5 Ordens',
        caption: 'Itens em expedição ou já recebidos',
        icon: 'inventory',
        tone: 'success',
        filter: { status: 'APPROVED' },
      },
      {
        id: 'analise',
        label: 'Aguardando Aprovação',
        value: '3 em Análise',
        caption: 'Compliance de compras e finanças',
        icon: 'pending_actions',
        tone: 'warning',
        filter: { status: 'DRAFT' },
      },
      {
        id: 'canceladas',
        label: 'Canceladas / Revogadas',
        value: '2 Pedidos',
        caption: 'Ordens reavaliadas pelo comando',
        icon: 'cancel',
        tone: 'neutral',
        filter: { status: 'CANCELLED' },
      },
    ],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'orderDate', 'quantity', 'currency', 'status', 'approvedAt', 'receivedAt', 'disabledReason'],
      order: ['id', 'orderDate', 'progressoEntrega', 'quantity', 'currency', 'status', 'approvedAt', 'receivedAt', 'disabledReason'],
      additions: [
        {
          field: 'progressoEntrega',
          header: 'Progresso da Ordem',
          width: '180px',
          align: 'center',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: "row.status === 'RECEIVED' ? 100 : row.status === 'APPROVED' ? 75 : row.status === 'PENDING' ? 35 : 10",
                total: 100,
                toneExpr: "row.status === 'RECEIVED' ? 'success' : row.status === 'APPROVED' ? 'info' : 'warning'",
                fallbackText: 'Progresso',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '80px', align: 'center', header: 'Cód.' },
        orderDate: { width: '130px', align: 'center', format: 'dd/MM/yyyy', header: 'Data do Pedido' },
        quantity: { width: '120px', align: 'center', header: 'Qtd. Lote' },
        currency: { width: '90px', align: 'center', header: 'Moeda' },
        status: { width: '140px', align: 'center', header: 'Status' },
        approvedAt: { width: '130px', align: 'center', format: 'dd/MM/yyyy', header: 'Aprovado Em' },
        receivedAt: { width: '130px', align: 'center', format: 'dd/MM/yyyy', header: 'Recebido Em' },
        disabledReason: { width: '220px', header: 'Observações' },
      },
    },
    columns: [],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar pedidos de compra por status ou observações...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Ordens', filter: '', icon: 'local_shipping' },
          { id: 'aprovadas', label: 'Aprovadas / Entregues', filter: "status='APPROVED' or status='RECEIVED'", icon: 'inventory' },
          { id: 'analise', label: 'Aguardando Aprovação', filter: "status='PENDING' or status='DRAFT'", icon: 'pending_actions' },
          { id: 'canceladas', label: 'Canceladas / Revogadas', filter: "status='CANCELLED'", icon: 'cancel' },
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
          schemaUrl: '/schemas/filtered?path=/api/procurement/purchase-orders/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['status', 'orderDate', 'quantity'],
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

