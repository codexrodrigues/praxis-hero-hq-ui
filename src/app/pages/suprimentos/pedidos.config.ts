import type { CrudMetadata } from '@praxisui/crud';
import type { RichContentDocument } from '@praxisui/core';
import { createBentoDetailExpansion } from '../shared/detail-expansion.helper';

export const PEDIDOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'procurement/purchase-orders',
    idField: 'id',
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
                valueExpr: 'row.progressoEntrega',
                total: 100,
                toneExpr: 'row.orderTone',
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
      ...createBentoDetailExpansion([
        {
          type: 'cardGrid',
          title: 'Dossiê do Pedido & Logística de Expedição',
          subtitle: 'Acompanhamento de entrega, homologação fiscal e especificação de suprimentos',
          columns: 3,
          minCardWidth: 280,
          cards: [
            {
              id: 'card-carga',
              title: 'Especificação & Lote',
              subtitle: 'Insumos e materiais solicitados',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'badge',
                      labelExpr: 'row.status',
                      icon: 'local_shipping',
                    },
                    {
                      type: 'metric',
                      label: 'Especificação de Carga',
                      valueExpr: 'row.especificacaoCarga',
                      icon: 'inventory_2',
                    },
                    {
                      type: 'metric',
                      label: 'Volume Total / Quantidade',
                      valueExpr: 'row.quantity',
                      icon: 'tag',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-timeline',
              title: 'Status de Expedição & Entrega',
              subtitle: 'Rastreabilidade operacional',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'progress',
                      label: 'Progresso da Expedição',
                      valueExpr: 'row.progressoEntrega',
                      max: 100,
                      showPercent: true,
                    },
                    {
                      type: 'metric',
                      label: 'Previsão de Recebimento',
                      valueExpr: 'row.prazoEstimado',
                      icon: 'schedule',
                    },
                    {
                      type: 'metric',
                      label: 'Data da Ordem',
                      valueExpr: 'row.orderDate',
                      icon: 'event',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-financeiro',
              title: 'Centro de Custo & Auditoria',
              subtitle: 'Alocação contábil S.H.I.E.L.D.',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Centro de Custo',
                      valueExpr: 'row.centroCusto',
                      icon: 'account_balance',
                    },
                    {
                      type: 'metric',
                      label: 'Moeda de Liquidação',
                      valueExpr: 'row.currency',
                      icon: 'payments',
                    },
                    {
                      type: 'metric',
                      label: 'Observações de Compra',
                      valueExpr: 'row.disabledReason',
                      icon: 'info',
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

export const PEDIDOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'pedidos-kpi-grid',
      items: [
        {
          id: 'ordens',
          label: 'Ordens de Compra',
          value: '10 Pedidos',
          caption: 'Ciclo de suprimento em andamento',
          icon: 'local_shipping',
          tone: 'info',
          action: { actionId: 'scope.filter', payload: 'all' },
        },
        {
          id: 'aprovadas',
          label: 'Aprovadas / Entregues',
          value: '5 Ordens',
          caption: 'Itens em expedição ou já recebidos',
          icon: 'inventory',
          tone: 'success',
          action: { actionId: 'scope.filter', payload: 'aprovadas' },
        },
        {
          id: 'analise',
          label: 'Aguardando Aprovação',
          value: '3 em Análise',
          caption: 'Compliance de compras e finanças',
          icon: 'pending_actions',
          tone: 'warning',
          action: { actionId: 'scope.filter', payload: 'analise' },
        },
        {
          id: 'canceladas',
          label: 'Canceladas / Revogadas',
          value: '2 Pedidos',
          caption: 'Ordens reavaliadas pelo comando',
          icon: 'cancel',
          tone: 'neutral',
          action: { actionId: 'scope.filter', payload: 'canceladas' },
        },
      ],
    },
  ],
};
