import type { CrudMetadata } from '@praxisui/crud';
import type { RichContentDocument } from '@praxisui/core';
import { createBentoDetailExpansion } from '../shared/detail-expansion.helper';

export const CONTRATOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'procurement/contracts',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'number',
        header: 'Nº do Contrato',
        width: '150px',
        sortable: true,
      },
      {
        field: 'supplierName',
        header: 'Fornecedor / Fabricante',
        width: '240px',
        sortable: true,
      },
      {
        field: 'indiceSla',
        header: 'Conformidade / SLA',
        width: '180px',
        align: 'center',
        sortable: true,
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
      {
        field: 'currency',
        header: 'Moeda',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'validUntil',
        header: 'Vigência Até',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'status',
        header: 'Status Contratual',
        width: '150px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'disabledReason',
        header: 'Observações / Motivo',
        width: '240px',
        sortable: true,
      },
    ],
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
      ...createBentoDetailExpansion([
        {
          type: 'cardGrid',
          title: 'Dossiê Contratual & Gestão de Fornecedores',
          subtitle: 'Cláusulas de suprimento, indicadores de entrega e governança orçamentária S.H.I.E.L.D.',
          columns: 3,
          minCardWidth: 280,
          cards: [
            {
              id: 'card-clausulas',
              title: 'Cláusulas & Vigência',
              subtitle: 'Prazos legais e prorrogações',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'badge',
                      labelExpr: 'row.status',
                      icon: 'description',
                    },
                    {
                      type: 'metric',
                      label: 'Fornecedor Credenciado',
                      valueExpr: 'row.supplierName',
                      icon: 'store',
                    },
                    {
                      type: 'metric',
                      label: 'Renovação',
                      valueExpr: "'Cláusula de Renovação Bianual'",
                      icon: 'autorenew',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-sla',
              title: 'Performance & SLA',
              subtitle: 'Confiabilidade e penalidades',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'progress',
                      label: 'Índice de Conformidade de Entregas',
                      valueExpr: "row.status === 'ACTIVE' || row.status === 'SIGNED' ? 95 : row.status === 'DRAFT' ? 65 : 38",
                      max: 100,
                      showPercent: true,
                    },
                    {
                      type: 'metric',
                      label: 'Cláusula Penal',
                      valueExpr: "'Multa padrão de 15% por atraso de entrega de insumos'",
                      icon: 'policy',
                    },
                    {
                      type: 'metric',
                      label: 'Observações de Auditoria',
                      valueExpr: 'row.disabledReason',
                      icon: 'info',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-governanca',
              title: 'Governança & Finanças',
              subtitle: 'Moeda e gestão fiscal',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Gestor Responsável',
                      valueExpr: "'Diretoria de Suprimentos & Armaria'",
                      icon: 'supervisor_account',
                    },
                    {
                      type: 'metric',
                      label: 'Moeda de Faturamento',
                      valueExpr: 'row.currency',
                      icon: 'payments',
                    },
                    {
                      type: 'metric',
                      label: 'Protocolo Contratual',
                      valueExpr: 'row.number',
                      icon: 'pin',
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

export const CONTRATOS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'contratos-kpi-grid',
      items: [
        {
          id: 'vigentes',
          label: 'Contratos Vigentes',
          value: '11 Ativos',
          caption: 'Acordos ativos e assinados com a base',
          icon: 'description',
          tone: 'info',
        },
        {
          id: 'total',
          label: 'Total de Contratos',
          value: '17 Cadastrados',
          caption: 'Volume total de acordos catalogados',
          icon: 'verified',
          tone: 'success',
        },
        {
          id: 'expirados',
          label: 'Contratos Expirados',
          value: '3 Requerem Ação',
          caption: 'Demandam aditivo ou substituição',
          icon: 'event_busy',
          tone: 'warning',
        },
        {
          id: 'draft',
          label: 'Em Minuta / Draft',
          value: '1 em Aprovação',
          caption: 'Aguardando validação jurídica e financeira',
          icon: 'edit_note',
          tone: 'neutral',
        },
      ],
    },
  ],
};
