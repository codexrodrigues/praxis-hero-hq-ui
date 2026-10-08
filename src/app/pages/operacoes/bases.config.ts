import type { CrudMetadata } from '@praxisui/crud';
import type { RichContentDocument } from '@praxisui/core';
import { createBentoDetailExpansion } from '../shared/detail-expansion.helper';

export const BASES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/bases',
    idField: 'id',
  },
  table: {
    columns: [
      {
        field: 'id',
        header: 'ID',
        width: '80px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'nome',
        header: 'Nome da Instalação / Base',
        width: '260px',
        sortable: true,
      },
      {
        field: 'tipo',
        header: 'Tipo de Instalação',
        width: '180px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'sigilo',
        header: 'Nível de Sigilo',
        width: '160px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'prontidao',
        header: 'Prontidão Operacional',
        width: '180px',
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.defesaCalculada',
              total: 100,
              toneExpr: 'row.baseTone',
              fallbackText: 'Prontidão',
            },
          },
        },
      },
      {
        field: 'planeta',
        header: 'Planeta / Teatro',
        width: '150px',
        align: 'center',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar bases por nome, setor ou teatro...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Bases', filter: '', icon: 'hub' },
          { id: 'sigilo', label: 'Segurança Máxima', filter: "sigilo='SECRETO' or sigilo='ULTRA_SECRETO' or sigilo='SECRETA' or sigilo='ULTRA_SECRETA'", icon: 'security' },
          { id: 'terra', label: 'Bases Terrestres', filter: "planeta='Terra' or planeta='TERRA'", icon: 'public' },
          { id: 'espaco', label: 'Órbita / Espaço', filter: "tipo='ORBITAL' or planeta='ESPACO'", icon: 'satellite_alt' },
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
          schemaUrl: '/schemas/filtered?path=/api/operations/bases/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['nome', 'tipo', 'sigilo', 'planeta'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
      expansion: createBentoDetailExpansion([
        {
          type: 'cardGrid',
          title: 'Ficha Cadastral da Instalação Tática',
          subtitle: 'Telemetria de posicionamento geodésico, defesa de perímetro e capacidade de hangar',
          columns: 3,
          minCardWidth: 280,
          cards: [
            {
              id: 'card-instalacao',
              title: 'Status & Classificação',
              subtitle: 'Tipologia e diretrizes de sigilo',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'badge',
                      labelExpr: 'row.sigilo',
                      icon: 'security',
                    },
                    {
                      type: 'metric',
                      label: 'Tipologia de Fortificação',
                      valueExpr: 'row.tipo',
                      icon: 'fort',
                    },
                    {
                      type: 'metric',
                      label: 'Teatro Planetário',
                      valueExpr: 'row.planeta',
                      icon: 'public',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-defesa',
              title: 'Defesa & Escudos Ativos',
              subtitle: 'Integridade energética e esquadrões',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Contingente Tático Alocado',
                      valueExpr: 'row.contingenteDesc',
                      icon: 'groups',
                    },
                    {
                      type: 'progress',
                      label: 'Integridade dos Escudos Energéticos',
                      valueExpr: 'row.defesaCalculada',
                      max: 100,
                      showPercent: true,
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-logistica',
              title: 'Logística & Suporte Avançado',
              subtitle: 'Hangar e reatores de energia',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Reator Primário de Fusão',
                      valueExpr: 'row.statusEnergia',
                      icon: 'bolt',
                    },
                    {
                      type: 'metric',
                      label: 'Hangar Tático Hero HQ',
                      valueExpr: 'row.capacidadeHangar',
                      icon: 'flight',
                    },
                    {
                      type: 'metric',
                      label: 'Protocolo de Emergência',
                      valueExpr: 'row.protocoloSeguranca',
                      icon: 'gavel',
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

export const BASES_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'bases-kpi-grid',
      items: [
        {
          id: 'bases',
          label: 'Complexos Operacionais',
          value: '7 Instalações',
          caption: 'Quartéis-generais, torres e hangares',
          icon: 'hub',
          tone: 'info',
        },
        {
          id: 'sigilo',
          label: 'Segurança Máxima',
          value: '4 Bases Sigilosas',
          caption: 'Classificação Secreta ou Ultra-Secreta',
          icon: 'security',
          tone: 'danger',
        },
        {
          id: 'mundos',
          label: 'Teatros Planetários',
          value: '2 Mundos',
          caption: 'Operações terrestres e no espaço profundo',
          icon: 'public',
          tone: 'neutral',
        },
        {
          id: 'prontidao',
          label: 'Prontidão Logística',
          value: '100% Operacional',
          caption: 'Suporte imediato a todas as equipes',
          icon: 'verified_user',
          tone: 'success',
        },
      ],
    },
  ],
};
