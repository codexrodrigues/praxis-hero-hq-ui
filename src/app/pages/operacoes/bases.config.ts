import type { CrudMetadata } from '@praxisui/crud';

export const BASES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/bases',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    cards: [
      {
        id: 'all',
        label: 'Complexos Operacionais',
        value: '7 Instalações',
        caption: 'Quartéis-generais, torres e hangares',
        icon: 'hub',
        tone: 'info',
        filter: {},
      },
      {
        id: 'sigilo',
        label: 'Segurança Máxima',
        value: '4 Bases Sigilosas',
        caption: 'Classificação Secreta ou Ultra-Secreta',
        icon: 'security',
        tone: 'danger',
        filter: { sigilo: 'ULTRA_SECRETO' },
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
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'nome', 'tipo', 'sigilo', 'planeta'],
      order: ['id', 'nome', 'tipo', 'sigilo', 'prontidao', 'planeta'],
      additions: [
        {
          field: 'prontidao',
          header: 'Prontidão Operacional',
          width: '180px',
          align: 'center',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: "row.sigilo === 'ULTRA_SECRETA' ? 98 : row.sigilo === 'SECRETA' ? 85 : row.sigilo === 'CONFIDENCIAL' ? 72 : 55",
                total: 100,
                toneExpr: "row.sigilo === 'ULTRA_SECRETA' ? 'success' : row.sigilo === 'SECRETA' ? 'info' : 'warning'",
                fallbackText: 'Prontidão',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '80px', align: 'center', header: 'ID' },
        nome: { width: '260px', header: 'Nome da Instalação / Base' },
        tipo: { width: '180px', align: 'center', header: 'Tipo de Instalação' },
        sigilo: { width: '160px', align: 'center', header: 'Nível de Sigilo' },
        planeta: { width: '150px', align: 'center', header: 'Planeta / Teatro' },
      },
    },
    columns: [],
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

