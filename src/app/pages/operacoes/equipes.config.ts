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
    cards: [
      {
        id: 'all',
        label: 'Esquadrões Registrados',
        value: '5 Equipes',
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
        value: '1 em Treinamento',
        caption: 'Squad em ciclo de integração',
        icon: 'shield',
        tone: 'neutral',
        filter: { status: 'STANDBY' },
      },
      {
        id: 'bases',
        label: 'Bases Interligadas',
        value: '5 Complexos',
        caption: 'Presença e ancoragem tática',
        icon: 'hub',
        tone: 'info',
      },
    ],
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
                valueExpr: "row.status === 'ATIVA' ? 95 : row.status === 'RESERVA' ? 70 : 40",
                total: 100,
                toneExpr: "row.status === 'ATIVA' ? 'success' : row.status === 'RESERVA' ? 'info' : 'warning'",
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
        status: { width: '140px', align: 'center', header: 'Status Tático' },
      },
    },
    columns: [],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar equipes por nome, sigla ou base...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Esquadrões', filter: '', icon: 'diversity_3' },
          { id: 'ativa', label: 'Prontidão Ativa', filter: "status='ATIVA'", icon: 'verified_user' },
          { id: 'reserva', label: 'Reserva Tática', filter: "status='RESERVA'", icon: 'shield' },
          { id: 'missoes', label: 'Em Missão', filter: "status='EM_MISSAO'", icon: 'flight_takeoff' },
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
          schemaUrl: '/schemas/filtered?path=/api/operations/equipes/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['nome', 'status', 'sigla'],
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

