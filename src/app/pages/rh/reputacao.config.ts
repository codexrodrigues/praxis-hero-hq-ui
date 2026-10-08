import type { CrudMetadata } from '@praxisui/crud';
import type { RichContentDocument } from '@praxisui/core';
import type { PraxisChartConfig } from '@praxisui/charts';
import { createBentoDetailExpansion } from '../shared/detail-expansion.helper';

export const REPUTACAO_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/vw-ranking-reputacao',
    idField: 'funcionarioId',
  },
  table: {
    columns: [
      {
        field: 'posicao',
        header: 'Pos.',
        width: '70px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'codinome',
        header: 'Codinome / Identidade Heroica',
        width: '180px',
        sortable: true,
      },
      {
        field: 'media',
        header: 'Score Médio Global',
        width: '170px',
        align: 'center',
        sortable: true,
        renderer: {
          type: 'microVisualization',
          microVisualization: {
            visualization: {
              kind: 'radial',
              surface: 'table-cell',
              valueExpr: 'row.mediaScore',
              total: 100,
              toneExpr: 'row.mediaTone',
              fallbackText: 'Score',
            },
          },
        },
      },
      {
        field: 'nomeCompleto',
        header: 'Nome Civil',
        width: '180px',
        sortable: true,
      },
      {
        field: 'equipe',
        header: 'Equipe Vinculada',
        width: '160px',
        sortable: true,
      },
      {
        field: 'scorePublico',
        header: 'Aprovação Civil (%)',
        type: 'number',
        width: '140px',
        align: 'center',
        sortable: true,
      },
      {
        field: 'scoreGovernamental',
        header: 'Confiança Governo (%)',
        type: 'number',
        width: '150px',
        align: 'center',
        sortable: true,
      },
    ],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar heróis por codinome, nome civil ou equipe...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Heróis', filter: '', icon: 'groups' },
          { id: 'top90', label: 'Score 90%+', filter: 'media >= 90', icon: 'military_tech' },
          { id: 'top80', label: 'Score 80%+', filter: 'media >= 80', icon: 'trending_up' },
        ],
        showAdvancedButton: true,
      },
    },
    behavior: {
      filtering: {
        columnFilters: {
          enabled: true,
        },
      },
      expansion: createBentoDetailExpansion([
        {
          type: 'cardGrid',
          title: 'Dossiê de Reputação & Relações Públicas',
          subtitle: 'Auditoria de imagem governamental, opinião pública e impacto da atuação heroica',
          columns: 3,
          minCardWidth: 280,
          cards: [
            {
              id: 'card-indices',
              title: 'Opinião Pública & Governo',
              subtitle: 'Chancelas civis e estatais',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'badge',
                      labelExpr: 'row.statusImagem',
                      icon: 'military_tech',
                    },
                    {
                      type: 'metric',
                      label: 'Aprovação Civil Popular',
                      valueExpr: 'row.scorePublicoPercentual',
                      icon: 'public',
                    },
                    {
                      type: 'metric',
                      label: 'Confiança Governamental',
                      valueExpr: 'row.scoreGovernamentalPercentual',
                      icon: 'account_balance',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-auditoria',
              title: 'Mídia & Opinião Global',
              subtitle: 'Impacto midiático e redes',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'progress',
                      label: 'Score Médio Consolidado',
                      valueExpr: 'row.mediaScore',
                      max: 100,
                      showPercent: true,
                    },
                    {
                      type: 'metric',
                      label: 'Tendência de Mídia',
                      valueExpr: 'row.tendenciaMidia',
                      icon: 'trending_up',
                    },
                    {
                      type: 'metric',
                      label: 'Posição no Ranking',
                      valueExpr: 'row.posicao',
                      icon: 'workspace_premium',
                    },
                  ],
                },
              ],
            },
            {
              id: 'card-enquadramento',
              title: 'Alocação & Protocolo',
              subtitle: 'Equipe e diretrizes',
              content: [
                {
                  type: 'compose',
                  direction: 'column',
                  gap: 'sm',
                  items: [
                    {
                      type: 'metric',
                      label: 'Equipe Vinculada',
                      valueExpr: 'row.equipe',
                      icon: 'groups',
                    },
                    {
                      type: 'metric',
                      label: 'Identidade Heroica',
                      valueExpr: 'row.codinome',
                      icon: 'shield',
                    },
                    {
                      type: 'metric',
                      label: 'Nome de Registro Civil',
                      valueExpr: 'row.nomeCompleto',
                      icon: 'badge',
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

export const REPUTACAO_KPI_DOCUMENT: RichContentDocument = {
  kind: 'praxis.rich-content',
  version: '1.0.0',
  nodes: [
    {
      type: 'statGroup',
      layout: 'grid',
      tileLayout: 'tile',
      headerSpacing: 'normal',
      className: 'reputacao-kpi-grid',
      items: [
        {
          id: 'topHero',
          label: 'Herói #1 no Ranking',
          value: 'Carol Danvers',
          caption: '91,5% de média global consolidada',
          icon: 'trophy',
          tone: 'success',
        },
        {
          id: 'aprovacao',
          label: 'Aprovação Civil Média',
          value: '86,8%',
          caption: 'Amostragem em tempo real',
          icon: 'trending_up',
          tone: 'info',
        },
        {
          id: 'confianca',
          label: 'Confiança Institucional',
          value: '91,2%',
          caption: 'Chancela de reguladores civis',
          icon: 'verified',
          tone: 'neutral',
        },
        {
          id: 'monitorados',
          label: 'Quadro Monitorado',
          value: '101 Heróis',
          caption: 'Cobertura integral de todas as equipes',
          icon: 'groups',
          tone: 'warning',
        },
      ],
    },
  ],
};

export function buildReputacaoChartConfig(
  items: Array<{ heroi: string; civil: number; governo: number }>,
): PraxisChartConfig {
  return {
    id: 'reputacao-top7-chart',
    type: 'bar',
    title: 'Top Heróis - Avaliação Reputacional Comparativa',
    subtitle: 'Aprovação civil e confiança institucional consolidadas',
    sizing: { mode: 'fixed', height: 320 },
    dataSource: {
      kind: 'local',
      items,
    },
    axes: {
      x: { field: 'heroi', type: 'category', label: 'Herói' },
      y: {
        type: 'value',
        label: 'Score (%)',
        min: 60,
        max: 100,
      },
    },
    series: [
      {
        id: 'civil',
        name: 'Aprovação Civil',
        type: 'bar',
        metric: { field: 'civil', aggregation: 'sum' },
        color: '#06b6d4',
      },
      {
        id: 'governo',
        name: 'Confiança Governo',
        type: 'bar',
        metric: { field: 'governo', aggregation: 'sum' },
        color: '#10b981',
      },
    ],
  };
}
