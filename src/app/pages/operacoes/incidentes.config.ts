import type { CrudMetadata } from '@praxisui/crud';
import type { RichContentDocument } from '@praxisui/core';
import { createBentoDetailExpansion } from '../shared/detail-expansion.helper';

export const INCIDENTES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/incidentes',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'Registro',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'descricao',
        header: 'Descrição do Sinistro / Impacto',
        width: '320px',
        sortable: true,
      },
      {
        field: 'local',
        header: 'Teatro do Dano',
        width: '200px',
        sortable: true,
      },
      {
        field: 'severidade',
        header: 'Severidade',
        width: '130px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'indiceSinistro',
        header: 'Índice de Danos',
        width: '180px',
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: '= round(min(100, (danosCivis / 4000000) * 100))',
              total: 100,
              toneExpr: {
                if: [
                  { '==': [{ var: 'severidade' }, 'CRITICA'] },
                  'danger',
                  { '==': [{ var: 'severidade' }, 'ALTA'] },
                  'warning',
                  'info',
                ],
              } as any,
              fallbackText: 'Índice de Danos',
            },
          },
        },
      },
      {
        field: 'danosCivis',
        header: 'Prejuízo Civil (R$)',
        type: 'currency',
        format: 'BRL',
        width: '170px',
        align: 'right',
        sortable: true,
      },
      {
        field: 'feridos',
        header: 'Feridos',
        width: '90px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'ocorridoEm',
        header: 'Data do Ocorrido',
        type: 'date',
        width: '150px',
        align: 'center',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar incidentes por local, descrição ou severidade...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Ocorrências', filter: '', icon: 'report' },
          { id: 'critico', label: 'Severidade Crítica', filter: "severidade='CRITICA'", icon: 'warning' },
          { id: 'alta', label: 'Alta Severidade', filter: "severidade='ALTA'", icon: 'crisis_alert' },
          { id: 'media', label: 'Severidade Moderada', filter: "severidade='MEDIA'", icon: 'info' },
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
          schemaUrl: '/schemas/filtered?path=/api/operations/incidentes/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['local', 'severidade', 'descricao'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
      expansion: createBentoDetailExpansion([
        {
          type: 'cardGrid',
          title: 'Laudo Pericial Tático & Circunstâncias de Campo',
          subtitle: 'Dossiê preliminar de resposta emergencial, contenção civil e indenizações',
          columns: 3,
          minCardWidth: 280,
          cards: [
            {
              id: 'card-pericia',
              title: 'Perícia & Teatro de Confronto',
              subtitle: 'Circunstâncias e narrativa do sinistro',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'badge',
                      labelExpr: 'row.severidade',
                      icon: 'emergency',
                    },
                    {
                      type: 'metric',
                      label: 'Teatro do Dano',
                      valueExpr: 'row.local',
                      caption: 'Perímetro operacional catalogado',
                      icon: 'location_on',
                    },
                    {
                      type: 'metric',
                      label: 'Descrição Tática Forense',
                      valueExpr: 'row.descricao',
                      icon: 'description',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-financeiro',
              title: 'Impacto Financeiro & Indenizações',
              subtitle: 'Prejuízo civil apurado e cobertura',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Prejuízo Civil Estimado',
                      valueExpr: 'row.danosCivis',
                      caption: 'Fundo Tático de Compensação Civil',
                      icon: 'payments',
                    },
                    {
                      type: 'progress',
                      label: 'Índice de Gravidade Relativa',
                      valueExpr: '= round(min(100, (danosCivis / 4000000) * 100))',
                      max: 100,
                      showPercent: true,
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-socorro',
              title: 'Socorro Civil & Mobilização',
              subtitle: 'Vítimas e protocolo médico',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Vítimas Feridas Catalogadas',
                      valueExpr: 'row.feridos',
                      caption: 'Atendimento de emergência prestado no local',
                      icon: 'medical_services',
                    },
                    {
                      type: 'metric',
                      label: 'Fatalidades Confirmadas',
                      valueExpr: 'row.mortos',
                      caption: 'Registro pericial S.H.I.E.L.D.',
                      icon: 'heart_broken',
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

export const INCIDENTES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'incidentes-kpi-grid',
      items: [
        {
          id: 'incidentes',
          label: 'Total de Ocorrências',
          value: '74 Registros',
          caption: 'Sinistros pós-combate catalogados',
          icon: 'report',
          tone: 'neutral',
        },
        {
          id: 'criticos',
          label: 'Severidade Crítica',
          value: '18 Casos Críticos',
          caption: 'Alto impacto civil e estrutural',
          icon: 'warning',
          tone: 'danger',
        },
        {
          id: 'danos',
          label: 'Danos Materiais Totais',
          value: 'R$ 154,4 M',
          caption: 'Cobertura via Fundo Tático de Indenizações',
          icon: 'account_balance',
          tone: 'warning',
        },
        {
          id: 'mitigacao',
          label: 'Taxa de Mitigação',
          value: '96,2% Contido',
          caption: 'Evacuação prévia e blindagem energética',
          icon: 'shield_with_heart',
          tone: 'success',
        },
      ],
    },
  ],
};
