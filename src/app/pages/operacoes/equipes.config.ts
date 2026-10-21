import type { CrudMetadata } from '@praxisui/crud';

export const EQUIPES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/equipes',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    source: 'operations/equipes/filter?page=0&size=1',
    method: 'POST',
    payload: {},
    cards: [
      {
        id: 'all',
        label: 'Esquadrões Registrados',
        value: '5 Equipes',
        valueExpr: '${totalElements | number | default:5} Equipes',
        caption: 'Compostas por heróis de ponta',
        icon: 'diversity_3',
        tone: 'info',
        filter: {},
      },
      {
        id: 'ativas',
        label: 'Prontidão Máxima',
        value: '4 Ativas',
        caption: 'Mobilizáveis para resposta imediata',
        icon: 'verified_user',
        tone: 'success',
        filter: { status: 'ATIVA' },
      },
      {
        id: 'reserva',
        label: 'Reserva & Suporte',
        value: '1 em Reserva',
        caption: 'Squads em prontidão secundária',
        icon: 'shield',
        tone: 'neutral',
        filter: { status: 'RESERVA' },
      },
      {
        id: 'bases',
        label: 'Bases Interligadas',
        value: '15 Complexos',
        caption: 'Presença e ancoragem tática',
        icon: 'hub',
        tone: 'info',
      },
    ],
  },
  filterBar: {
    placement: 'scope-bar',
    inlineFields: ['nome', 'status', 'sigla'],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'nome', 'sigla', 'basePrincipalNome', 'status'],
      order: ['id', 'nome', 'sigla', 'basePrincipalNome', 'prontidaoScore', 'status'],
      additions: [
        {
          field: 'prontidaoScore',
          header: 'Prontidão Operacional',
          width: '180px',
          align: 'center',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: "= row.status === 'ATIVA' ? 95 : row.status === 'RESERVA' ? 70 : 40",
                total: 100,
                toneExpr: "= row.status === 'ATIVA' ? 'success' : row.status === 'RESERVA' ? 'info' : 'warning'",
                fallbackText: 'Prontidão',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '80px', align: 'center', header: 'ID' },
        nome: { width: '260px', header: 'Nome da Equipe / Esquadrão' },
        sigla: { width: '120px', align: 'center', header: 'Sigla' },
        basePrincipalNome: { width: '240px', header: 'Base Principal Designada' },
        status: {
          width: '160px',
          align: 'center',
          header: 'Status Tático',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'status' }, 'ATIVA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Prontidão Ativa', variant: 'soft', color: 'primary', icon: 'verified_user' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'RESERVA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Reserva Tática', variant: 'soft', color: 'accent', icon: 'shield' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'DISSOLVIDA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Dissolvida', variant: 'outlined', color: 'basic', icon: 'block' },
              },
            },
          ],
        },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todos os Esquadrões', filter: {}, icon: 'diversity_3' },
          { id: 'ativa', label: 'Prontidão Ativa', filter: { status: 'ATIVA' }, icon: 'verified_user' },
          { id: 'reserva', label: 'Reserva Tática', filter: { status: 'RESERVA' }, icon: 'shield' },
          { id: 'dissolvida', label: 'Dissolvidas', filter: { status: 'DISSOLVIDA' }, icon: 'block' },
        ],
      },
    },
    behavior: {
      filtering: {
        advancedFilters: {
          settings: {
            alwaysVisibleFields: ['nome', 'status', 'sigla'],
          },
        },
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};


