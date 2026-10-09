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
    cards: [
      {
        id: 'vigentes',
        label: 'Contratos Vigentes',
        value: '11 Ativos',
        caption: 'Acordos ativos e assinados com a base',
        icon: 'description',
        tone: 'info',
        filter: { status: 'ACTIVE' },
      },
      {
        id: 'total',
        label: 'Total de Contratos',
        value: '17 Cadastrados',
        caption: 'Volume total de acordos catalogados',
        icon: 'verified',
        tone: 'success',
        filter: {},
      },
      {
        id: 'expirados',
        label: 'Contratos Expirados',
        value: '3 Requerem Ação',
        caption: 'Demandam aditivo ou substituição',
        icon: 'event_busy',
        tone: 'warning',
        filter: { status: 'EXPIRED' },
      },
      {
        id: 'draft',
        label: 'Em Minuta / Draft',
        value: '1 em Aprovação',
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
                valueExpr: "row.status === 'ACTIVE' || row.status === 'SIGNED' ? 95 : row.status === 'DRAFT' ? 65 : 38",
                total: 100,
                toneExpr: "row.status === 'ACTIVE' || row.status === 'SIGNED' ? 'success' : row.status === 'DRAFT' ? 'info' : 'warning'",
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
        validUntil: { width: '140px', align: 'center', type: 'date', format: 'dd/MM/yyyy', header: 'Vigência Até' },
        status: { width: '150px', align: 'center', header: 'Status Contratual' },
        disabledReason: { width: '240px', header: 'Observações / Motivo' },
      },
    },
    columns: [],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar contratos por número, fornecedor ou motivo...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Contratos', filter: '', icon: 'description' },
          { id: 'active', label: 'Vigentes & Assinados', filter: "status='ACTIVE' or status='SIGNED'", icon: 'verified' },
          { id: 'expired', label: 'Contratos Expirados', filter: "status='EXPIRED'", icon: 'event_busy' },
          { id: 'draft', label: 'Em Minuta / Draft', filter: "status='DRAFT'", icon: 'edit_note' },
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
          schemaUrl: '/schemas/filtered?path=/api/procurement/contracts/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['supplierName', 'status', 'number'],
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

