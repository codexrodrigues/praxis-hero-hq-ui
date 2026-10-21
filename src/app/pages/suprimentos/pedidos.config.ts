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
    source: 'procurement/purchase-orders/stats/group-by',
    method: 'POST',
    payload: {
      filter: {},
      field: 'status',
      metrics: [{ operation: 'COUNT', alias: 'total' }],
    },
    cards: [
      {
        id: 'ordens',
        label: 'Ordens de Compra',
        value: '10 Pedidos',
        valueExpr: '${totalCount | number | default:10} Pedidos',
        caption: 'Ciclo de suprimento em andamento',
        icon: 'local_shipping',
        tone: 'info',
        filter: {},
      },
      {
        id: 'aprovadas',
        label: 'Aprovadas / Em Expedição',
        value: '3 Ordens',
        valueExpr: '${byKey.APPROVED | number | default:3} Ordens',
        caption: '3 aprovadas + 2 recebidas no arsenal',
        captionExpr: '${byKey.APPROVED | number | default:3} aprovadas + ${byKey.RECEIVED | number | default:2} recebidas no arsenal',
        icon: 'inventory',
        tone: 'success',
        filter: { status: 'APPROVED' },
      },
      {
        id: 'analise',
        label: 'Aguardando Aprovação',
        value: '3 em Análise',
        valueExpr: '${byKey.DRAFT | number | default:3} em Análise',
        caption: 'Compliance de compras e finanças',
        icon: 'pending_actions',
        tone: 'warning',
        filter: { status: 'DRAFT' },
      },
      {
        id: 'canceladas',
        label: 'Canceladas / Revogadas',
        value: '2 Pedidos',
        valueExpr: '${byKey.CANCELLED | number | default:2} Pedidos',
        caption: 'Ordens reavaliadas pelo comando',
        icon: 'cancel',
        tone: 'neutral',
        filter: { status: 'CANCELLED' },
      },
    ],
  },
  filterBar: {
    placement: 'scope-bar',
    inlineFields: ['companyId', 'supplierId', 'status'],
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
                valueExpr: "= row.status === 'RECEIVED' ? 100 : row.status === 'APPROVED' ? 75 : row.status === 'DRAFT' ? 35 : 10",
                total: 100,
                toneExpr: "= row.status === 'RECEIVED' ? 'success' : row.status === 'APPROVED' ? 'info' : 'warning'",
                fallbackText: 'Progresso',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '80px', align: 'center', header: 'Cód.' },
        orderDate: { width: '130px', align: 'center', header: 'Data do Pedido' },
        quantity: { width: '120px', align: 'center', header: 'Qtd. Lote' },
        currency: { width: '90px', align: 'center', header: 'Moeda' },
        status: {
          width: '150px',
          align: 'center',
          header: 'Status',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'status' }, 'RECEIVED'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Recebido', variant: 'soft', color: 'primary', icon: 'inventory' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'APPROVED'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Aprovado', variant: 'soft', color: 'primary', icon: 'verified' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'DRAFT'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Em Análise', variant: 'soft', color: 'accent', icon: 'pending_actions' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'CANCELLED'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Cancelado', variant: 'outlined', color: 'basic', icon: 'cancel' },
              },
            },
          ],
        },
        approvedAt: { width: '130px', align: 'center', header: 'Aprovado Em' },
        receivedAt: { width: '130px', align: 'center', header: 'Recebido Em' },
        disabledReason: { width: '220px', header: 'Observações' },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todas as Ordens', filter: {}, icon: 'local_shipping' },
          { id: 'aprovadas', label: 'Aprovadas / Entregues', filter: { status: 'APPROVED' }, icon: 'inventory' },
          { id: 'analise', label: 'Aguardando Aprovação', filter: { status: 'DRAFT' }, icon: 'pending_actions' },
          { id: 'canceladas', label: 'Canceladas / Revogadas', filter: { status: 'CANCELLED' }, icon: 'cancel' },
        ],
      },
    },
    behavior: {
      filtering: {
        advancedFilters: {
          settings: {
            alwaysVisibleFields: ['companyId', 'supplierId', 'status'],
          },
        },
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};


