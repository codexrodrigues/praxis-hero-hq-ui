import type { CrudMetadata } from '@praxisui/crud';

export const CONTRATOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'procurement/contracts',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    source: 'procurement/contracts/stats/group-by',
    method: 'POST',
    payload: {
      filter: {},
      field: 'status',
      metrics: [{ operation: 'COUNT', alias: 'total' }],
    },
    cards: [
      {
        id: 'vigentes',
        label: 'Contratos Vigentes',
        value: '5 Ativos',
        valueExpr: '${byKey.ACTIVE | number | default:5} Ativos',
        caption: '5 ativos + 6 assinados com a base (11 vigentes)',
        captionExpr: '${byKey.ACTIVE | number | default:5} ativos + ${byKey.SIGNED | number | default:6} assinados com a base',
        icon: 'description',
        tone: 'info',
        filter: { status: 'ACTIVE' },
      },
      {
        id: 'total',
        label: 'Total de Contratos',
        value: '17 Cadastrados',
        valueExpr: '${totalCount | number | default:17} Cadastrados',
        caption: 'Volume total de acordos catalogados',
        icon: 'verified',
        tone: 'success',
        filter: {},
      },
      {
        id: 'expirados',
        label: 'Contratos Expirados',
        value: '3 Requerem Ação',
        valueExpr: '${byKey.EXPIRED | number | default:3} Requerem Ação',
        caption: 'Demandam aditivo ou substituição',
        icon: 'event_busy',
        tone: 'warning',
        filter: { status: 'EXPIRED' },
      },
      {
        id: 'draft',
        label: 'Em Minuta / Draft',
        value: '1 em Aprovação',
        valueExpr: '${byKey.DRAFT | number | default:1} em Aprovação',
        caption: 'Aguardando validação jurídica e financeira',
        icon: 'edit_note',
        tone: 'neutral',
        filter: { status: 'DRAFT' },
      },
    ],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['number', 'supplierName', 'currency', 'validUntil', 'status', 'disabledReason'],
      order: ['number', 'supplierName', 'indiceSla', 'currency', 'validUntil', 'status', 'disabledReason'],
      additions: [
        {
          field: 'indiceSla',
          header: 'Conformidade / SLA',
          width: '180px',
          align: 'center',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: "= row.status === 'ACTIVE' ? 95 : row.status === 'SIGNED' ? 95 : row.status === 'DRAFT' ? 65 : 38",
                total: 100,
                toneExpr: "= row.status === 'ACTIVE' ? 'success' : row.status === 'SIGNED' ? 'success' : row.status === 'DRAFT' ? 'info' : 'warning'",
                fallbackText: 'SLA',
              },
            },
          },
        },
      ],
      overrides: {
        number: { width: '150px', header: 'Nº do Contrato' },
        supplierName: { width: '240px', header: 'Fornecedor / Fabricante' },
        currency: { width: '90px', align: 'center', header: 'Moeda' },
        validUntil: { width: '140px', align: 'center', header: 'Vigência Até' },
        status: { width: '150px', align: 'center', header: 'Status Contratual' },
        disabledReason: { width: '240px', header: 'Observações / Motivo' },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todos os Contratos', filter: {}, icon: 'description' },
          { id: 'active', label: 'Vigentes & Assinados', filter: { status: 'ACTIVE' }, icon: 'verified' },
          { id: 'expired', label: 'Contratos Expirados', filter: { status: 'EXPIRED' }, icon: 'event_busy' },
          { id: 'draft', label: 'Em Minuta / Draft', filter: { status: 'DRAFT' }, icon: 'edit_note' },
        ],
      },
    },
    behavior: {
      filtering: {
        advancedFilters: {
          settings: {
            alwaysVisibleFields: ['companyId', 'supplierId', 'number', 'status'],
          },
        },
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};


