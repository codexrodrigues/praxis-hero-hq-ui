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
    cards: [
      {
        id: 'all',
        label: 'Unidades na Frota',
        value: '8 Veículos',
        caption: 'Aeronaves, hovercrafts e terrestres',
        icon: 'rocket_launch',
        tone: 'info',
        filter: {},
      },
      {
        id: 'operacional',
        label: 'Prontidão de Voo',
        value: '5 Disponíveis',
        caption: 'Abastecidos e prontos para decolagem',
        icon: 'verified',
        tone: 'success',
        filter: { status: 'OPERACIONAL' },
      },
      {
        id: 'manutencao',
        label: 'Em Revisão / Hangar',
        value: '2 em Manutenção',
        caption: 'Calibragem de propulsores iônicos',
        icon: 'build',
        tone: 'warning',
        filter: { status: 'MANUTENCAO' },
      },
      {
        id: 'eficiencia',
        label: 'Taxa Operacional',
        value: '62,5% Ativo',
        caption: 'Capacidade de transporte de squads',
        icon: 'speed',
        tone: 'neutral',
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
                valueExpr: "row.status === 'OPERACIONAL' ? 95 : row.status === 'MANUTENCAO' ? 45 : 15",
                total: 100,
                toneExpr: "row.status === 'OPERACIONAL' ? 'success' : row.status === 'MANUTENCAO' ? 'warning' : 'danger'",
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
    columns: [],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar veículos por nome, categoria ou piloto...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Toda a Frota', filter: '', icon: 'rocket_launch' },
          { id: 'operacional', label: 'Em Operação / Prontidão', filter: "status='OPERACIONAL'", icon: 'verified' },
          { id: 'manutencao', label: 'Em Manutenção / Hangar', filter: "status='MANUTENCAO'", icon: 'build' },
          { id: 'aerea', label: 'Aeronaves & Espaciais', filter: "tipo='AERONAVE' or tipo='ESPACIAL'", icon: 'flight' },
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
          schemaUrl: '/schemas/filtered?path=/api/assets/veiculos/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['nome', 'tipo', 'status', 'proprietarioNome'],
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

