import type { CrudMetadata } from '@praxisui/crud';
import type { RichContentDocument } from '@praxisui/core';
import { createBentoDetailExpansion } from '../shared/detail-expansion.helper';

export const AMEACAS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'risk-intelligence/ameacas',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'Cód.',
        width: '80px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'nome',
        header: 'Designação da Ameaça',
        width: '220px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'classe',
        header: 'Classe Tática',
        width: '130px',
        align: 'center',
        sortable: true,
        filterable: true,
      },
      {
        field: 'planeta',
        header: 'Origem Planetária',
        width: '140px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'nivel',
        header: 'Nível',
        type: 'number',
        width: '80px',
        align: 'center',
        sortable: true,
        filterable: true,
      },
      {
        field: 'indicePerigo',
        header: 'Índice de Letalidade',
        width: '180px',
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.letalidadeCalculada',
              total: 100,
              toneExpr: 'row.ameacaTone',
              fallbackText: 'Letalidade',
            },
          },
        },
      },
      {
        field: 'status',
        header: 'Status de Contenção',
        width: '150px',
        align: 'center',
        sortable: true,
        filterable: true,
      },
      {
        field: 'recompensa',
        header: 'Recompensa Fixada',
        type: 'currency',
        format: 'BRL',
        width: '160px',
        align: 'right',
        sortable: true,
        filterable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar alvos por designação, classe ou planeta...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Ameaças', filter: '', icon: 'radar' },
          { id: 'confronto', label: 'Em Confronto Ativo', filter: "status='CONFRONTO'", icon: 'crisis_alert' },
          { id: 'critico', label: 'Nível Ômega / Crítico', filter: 'nivel >= 5', icon: 'warning' },
          { id: 'contidos', label: 'Neutralizados / Raft', filter: "status='CAPTURADO' or status='CONTIDO' or status='NEUTRALIZADO'", icon: 'lock' },
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
          schemaUrl: '/schemas/filtered?path=/api/risk-intelligence/ameacas/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['nome', 'classe', 'status', 'nivel'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
      expansion: createBentoDetailExpansion([
        {
          type: 'cardGrid',
          title: 'Dossiê Forense de Inteligência & Risco Global',
          subtitle: 'Taxonomia de combate e protocolos sob governança do Conselho de Segurança',
          columns: 3,
          minCardWidth: 280,
          cards: [
            {
              id: 'card-dossie',
              title: 'Dossiê Biológico & Tático',
              subtitle: 'Classificação e teatro de origem',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'badge',
                      labelExpr: 'row.status',
                      icon: 'radar',
                    },
                    {
                      type: 'metric',
                      label: 'Classe de Ameaça',
                      valueExpr: 'row.classe',
                      icon: 'warning',
                    },
                    {
                      type: 'metric',
                      label: 'Origem Planetária',
                      valueExpr: 'row.planeta',
                      icon: 'public',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-letalidade',
              title: 'Letalidade & Gravidade',
              subtitle: 'Escala de destruição e recompensas',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Classificação de Gravidade',
                      valueExpr: 'row.riscoGravidade',
                      icon: 'emergency',
                    },
                    {
                      type: 'progress',
                      label: 'Índice Relativo de Letalidade',
                      valueExpr: 'row.letalidadeCalculada',
                      max: 100,
                      showPercent: true,
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-contencao',
              title: 'Protocolos de Contenção',
              subtitle: 'Diretrizes táticas de engajamento',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Status de Confinamento',
                      valueExpr: 'row.confinamentoStatus',
                      icon: 'lock',
                    },
                    {
                      type: 'metric',
                      label: 'Contramedida Recomendada',
                      valueExpr: 'row.contraMedidaSugerida',
                      icon: 'shield',
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

export const AMEACAS_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'ameacas-kpi-grid',
      items: [
        {
          id: 'ameacas',
          label: 'Ameaças Monitoradas',
          value: '16 Alvos',
          caption: 'Radar contínuo em frequência quântica',
          icon: 'warning',
          tone: 'danger',
        },
        {
          id: 'confronto',
          label: 'Em Confronto Ativo',
          value: '6 em Combate',
          caption: 'Esquadrões mobilizados em solo',
          icon: 'crisis_alert',
          tone: 'warning',
        },
        {
          id: 'contidos',
          label: 'Contidos / Prisão Raft',
          value: '3 Neutralizados',
          caption: 'Custodiados em estase de força',
          icon: 'lock',
          tone: 'success',
        },
        {
          id: 'recompensas',
          label: 'Fundo Total de Recompensas',
          value: 'R$ 12,1 M',
          caption: 'Garantido pelo Acordo de Sokovia',
          icon: 'payments',
          tone: 'info',
        },
      ],
    },
  ],
};
