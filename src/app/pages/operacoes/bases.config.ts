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
    source: 'operations/bases/filter?page=0&size=1',
    method: 'POST',
    payload: {},
    cards: [
      {
        id: 'all',
        label: 'Complexos Operacionais',
        value: '15 Instalações',
        valueExpr: '${totalElements | number | default:15} Instalações',
        caption: 'Quartéis-generais, torres e hangares',
        icon: 'hub',
        tone: 'info',
        filter: {},
      },
      {
        id: 'sigilo',
        label: 'Segurança Máxima',
        value: '3 Bases Sigilosas',
        caption: 'Classificação Ultra-Secreta',
        icon: 'security',
        tone: 'danger',
        filter: { sigilo: 'ULTRA_SECRETA' },
      },
      {
        id: 'mundos',
        label: 'Bases Terrestres',
        value: '14 na Terra',
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
  filterBar: {
    placement: 'scope-bar',
    inlineFields: ['nome', 'tipo', 'sigilo', 'planeta'],
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
                valueExpr: "= row.sigilo === 'ULTRA_SECRETA' ? 98 : row.sigilo === 'SECRETA' ? 85 : row.sigilo === 'CONFIDENCIAL' ? 72 : 55",
                total: 100,
                toneExpr: "= row.sigilo === 'ULTRA_SECRETA' ? 'success' : row.sigilo === 'SECRETA' ? 'info' : 'warning'",
                fallbackText: 'Prontidão',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '80px', align: 'center', header: 'ID' },
        nome: { width: '260px', header: 'Nome da Instalação / Base' },
        tipo: {
          width: '180px',
          align: 'center',
          header: 'Tipo de Instalação',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'tipo' }, 'ORBITAL'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Estação Orbital', variant: 'soft', color: 'primary', icon: 'satellite_alt' },
              },
            },
            {
              condition: { '==': [{ var: 'tipo' }, 'TERRESTRE'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Base Terrestre', variant: 'soft', color: 'accent', icon: 'hub' },
              },
            },
            {
              condition: { '==': [{ var: 'tipo' }, 'SUBTERRANEA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Bunker Subterrâneo', variant: 'soft', color: 'primary', icon: 'shield' },
              },
            },
            {
              condition: { '==': [{ var: 'tipo' }, 'SUBAQUATICA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Subaquática', variant: 'soft', color: 'primary', icon: 'water' },
              },
            },
            {
              condition: { '==': [{ var: 'tipo' }, 'MOVEL'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Plataforma Móvel', variant: 'soft', color: 'accent', icon: 'flight_takeoff' },
              },
            },
            {
              condition: { '==': [{ var: 'tipo' }, 'OTHER'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Especial / Outra', variant: 'outlined', color: 'basic', icon: 'domain' },
              },
            },
          ],
        },
        sigilo: {
          width: '170px',
          align: 'center',
          header: 'Nível de Sigilo',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'sigilo' }, 'ULTRA_SECRETA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Ultra-Secreta', variant: 'soft', color: 'warn', icon: 'security' },
              },
            },
            {
              condition: { '==': [{ var: 'sigilo' }, 'SECRETA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Secreta', variant: 'soft', color: 'accent', icon: 'lock' },
              },
            },
            {
              condition: { '==': [{ var: 'sigilo' }, 'CONFIDENCIAL'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Confidencial', variant: 'soft', color: 'primary', icon: 'verified_user' },
              },
            },
            {
              condition: { '==': [{ var: 'sigilo' }, 'PUBLICA'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Pública', variant: 'outlined', color: 'basic', icon: 'public' },
              },
            },
          ],
        },
        planeta: { width: '150px', align: 'center', header: 'Planeta / Teatro' },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todas as Bases', filter: {}, icon: 'hub' },
          { id: 'sigilo', label: 'Segurança Máxima', filter: { sigilo: 'ULTRA_SECRETA' }, icon: 'security' },
          { id: 'terra', label: 'Bases Terrestres', filter: { planeta: 'Terra' }, icon: 'public' },
          { id: 'espaco', label: 'Órbita / Espaço', filter: { tipo: 'ORBITAL' }, icon: 'satellite_alt' },
        ],
      },
    },
    behavior: {
      filtering: {
        advancedFilters: {
          settings: {
            alwaysVisibleFields: ['nome', 'tipo', 'sigilo', 'planeta'],
          },
        },
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};


