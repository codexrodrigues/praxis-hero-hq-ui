import type { CrudMetadata } from '@praxisui/crud';

export const VEICULOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'assets/veiculos',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    source: 'assets/veiculos/stats/group-by',
    method: 'POST',
    payload: {
      filter: {},
      field: 'status',
      metrics: [{ operation: 'COUNT', alias: 'total' }],
    },
    cards: [
      {
        id: 'all',
        label: 'Unidades na Frota',
        value: '24 Veículos',
        valueExpr: '${totalCount | number | default:24} Veículos',
        caption: 'Aeronaves, hovercrafts e terrestres',
        icon: 'rocket_launch',
        tone: 'info',
        filter: {},
      },
      {
        id: 'operacional',
        label: 'Prontidão de Voo',
        value: '17 Disponíveis',
        valueExpr: '${byKey.OPERACIONAL | number | default:17} Disponíveis',
        caption: 'Abastecidos e prontos para decolagem',
        captionExpr: "Abastecidos e prontos para decolagem (${((byKey.OPERACIONAL / totalCount) * 100) | round:1 | default:'70,8'}%)",
        icon: 'verified',
        tone: 'success',
        filter: { status: 'OPERACIONAL' },
      },
      {
        id: 'manutencao',
        label: 'Em Revisão / Hangar',
        value: '5 em Manutenção',
        valueExpr: '${byKey.MANUTENCAO | number | default:5} em Manutenção',
        caption: 'Calibragem de propulsores iônicos',
        icon: 'build',
        tone: 'warning',
        filter: { status: 'MANUTENCAO' },
      },
      {
        id: 'eficiencia',
        label: 'Frota Aérea & Orbital',
        value: '14 Unidades',
        caption: 'Capacidade de projeção aeroespacial',
        icon: 'speed',
        tone: 'neutral',
        filter: { tiposIn: ['AEREO', 'ESPACIAL'] },
      },
    ],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'nome', 'tipo', 'capacidade', 'proprietarioNome', 'status'],
      order: ['id', 'nome', 'tipo', 'prontidao', 'capacidade', 'proprietarioNome', 'status'],
      additions: [
        {
          field: 'prontidao',
          header: 'Prontidão de Voo',
          width: '180px',
          align: 'center',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: "= row.status === 'OPERACIONAL' ? 95 : row.status === 'MANUTENCAO' ? 45 : 15",
                total: 100,
                toneExpr: "= row.status === 'OPERACIONAL' ? 'success' : row.status === 'MANUTENCAO' ? 'warning' : 'danger'",
                fallbackText: 'Prontidão',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '80px', align: 'center', header: 'Cód.' },
        nome: { width: '240px', header: 'Identificação da Unidade' },
        tipo: { width: '140px', align: 'center', header: 'Plataforma' },
        capacidade: { width: '140px', align: 'center', header: 'Tripulação / Carga' },
        proprietarioNome: { width: '220px', header: 'Custodiante / Piloto' },
        status: { width: '150px', align: 'center', header: 'Disponibilidade' },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Toda a Frota', filter: {}, icon: 'rocket_launch' },
          { id: 'operacional', label: 'Em Operação / Prontidão', filter: { status: 'OPERACIONAL' }, icon: 'verified' },
          { id: 'manutencao', label: 'Em Manutenção / Hangar', filter: { status: 'MANUTENCAO' }, icon: 'build' },
          { id: 'aerea', label: 'Aeronaves & Espaciais', filter: { tiposIn: ['AEREO', 'ESPACIAL'] }, icon: 'flight' },
        ],
      },
    },
    behavior: {
      filtering: {
        advancedFilters: {
          settings: {
            alwaysVisibleFields: ['nome', 'tipo', 'status', 'proprietarioId'],
          },
        },
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};


