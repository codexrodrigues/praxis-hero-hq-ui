import type { CrudMetadata } from '@praxisui/crud';

export const REPUTACAO_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/vw-ranking-reputacao',
    idField: 'funcionarioId',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    source: 'human-resources/vw-ranking-reputacao/filter?page=0&size=1',
    method: 'POST',
    payload: {},
    cards: [
      {
        id: 'topHero',
        label: 'Herói #1 no Ranking',
        value: 'Captain Marvel',
        valueExpr: "firstItem.codinome | default:'Captain Marvel'",
        caption: '91,5 de média consolidada (Carol Danvers)',
        captionExpr: "${firstItem.media | round:1 | default:'91,5'} de média consolidada (${firstItem.nomeCompleto | default:'Carol Danvers'})",
        icon: 'trophy',
        tone: 'success',
      },
      {
        id: 'aprovacao',
        label: 'Aprovação Civil Média',
        value: '84,3%',
        caption: 'Índice de sentimento público',
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
        valueExpr: '${totalElements | number | default:101} Heróis',
        caption: 'Cobertura integral de todas as equipes',
        icon: 'groups',
        tone: 'warning',
        filter: {},
      },
    ],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['posicao', 'codinome', 'media', 'nomeCompleto', 'equipe', 'scorePublico', 'scoreGovernamental'],
      order: ['posicao', 'codinome', 'media', 'nomeCompleto', 'equipe', 'scorePublico', 'scoreGovernamental'],
      overrides: {
        posicao: { width: '70px', align: 'center', header: 'Pos.' },
        codinome: { width: '180px', header: 'Codinome / Identidade Heroica' },
        media: {
          width: '170px',
          align: 'center',
          header: 'Score Médio Global',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: '= row.media',
                total: 100,
                toneExpr: "= row.media >= 90 ? 'success' : row.media >= 80 ? 'info' : 'warning'",
                fallbackText: 'Score',
              },
            },
          },
        },
        nomeCompleto: { width: '180px', header: 'Nome Civil' },
        equipe: { width: '160px', header: 'Equipe Vinculada' },
        scorePublico: { width: '140px', align: 'center', type: 'number', header: 'Aprovação Civil (%)' },
        scoreGovernamental: { width: '150px', align: 'center', type: 'number', header: 'Confiança Governo (%)' },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todos os Heróis', filter: {}, icon: 'groups' },
          { id: 'top90', label: 'Score 90%+', filter: { mediaBetween: [90, 100] }, icon: 'military_tech' },
          { id: 'top80', label: 'Score 80%+', filter: { mediaBetween: [80, 100] }, icon: 'trending_up' },
        ],
      },
    },
    behavior: {
      filtering: {
        advancedFilters: {
          settings: {
            alwaysVisibleFields: ['codinome', 'nomeCompleto', 'equipe'],
          },
        },
      },
      expansion: {
        enabled: false,
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};

