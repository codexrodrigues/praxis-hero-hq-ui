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
        value: '16 Instalações',
        caption: 'Quartéis-generais, torres e hangares',
        icon: 'hub',
        tone: 'info',
        filter: {},
      },
      {
        id: 'sigilo',
        label: 'Segurança Máxima',
        value: '4 Bases Sigilosas',
        caption: 'Classificação Ultra-Secreta',
        icon: 'security',
        tone: 'danger',
        filter: { sigilo: 'ULTRA_SECRETA' },
      },
      {
        id: 'mundos',
        label: 'Bases Terrestres',
        value: '11 na Terra',
        caption: 'Instalações no teatro terrestre',
        icon: 'public',
        tone: 'neutral',
        filter: { planeta: 'Terra' },
      },
      {
        id: 'prontidao',
        label: 'Estações em Órbita',
        value: '3 Orbitais',
        caption: 'Vigilância e suporte aeroespacial',
        icon: 'satellite_alt',
        tone: 'success',
        filter: { tipo: 'ORBITAL' },
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
    toolbar: {
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Bases', filter: {}, icon: 'hub' },
          { id: 'sigilo', label: 'Segurança Máxima', filter: { sigilo: 'ULTRA_SECRETA' }, icon: 'security' },
          { id: 'terra', label: 'Bases Terrestres', filter: { planeta: 'Terra' }, icon: 'public' },
          { id: 'espaco', label: 'Órbita / Espaço', filter: { tipo: 'ORBITAL' }, icon: 'satellite_alt' },
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
  },
  defaults: {
    openMode: 'drawer',
  },
};

