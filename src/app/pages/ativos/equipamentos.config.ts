import type { CrudMetadata } from '@praxisui/crud';

export const EQUIPAMENTOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'assets/equipamentos',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    cards: [
      {
        id: 'all',
        label: 'Total de Itens Táticos',
        value: '62 Ativos',
        caption: 'Trajes, armas e exoesqueletos',
        icon: 'shield',
        tone: 'info',
        filter: {},
      },
      {
        id: 'custodia',
        label: 'Em Custódia / Uso Ativo',
        value: '56 Itens',
        caption: 'Alocados a heróis em missão',
        icon: 'verified_user',
        tone: 'success',
        filter: { status: 'EM_USO' },
      },
      {
        id: 'manutencao',
        label: 'Em Manutenção',
        value: '2 Itens',
        caption: 'Recarga de reator e nanotecnologia',
        icon: 'build',
        tone: 'warning',
        filter: { status: 'MANUTENCAO' },
      },
      {
        id: 'estoque',
        label: 'Em Reserva de Arsenal',
        value: '4 Itens',
        caption: 'Disponíveis no cofre central',
        icon: 'inventory_2',
        tone: 'neutral',
        filter: { status: 'DISPONIVEL' },
      },
    ],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'nome', 'tipo', 'resistencia', 'proprietarioNome', 'status'],
      order: ['id', 'nome', 'tipo', 'resistencia', 'proprietarioNome', 'status'],
      overrides: {
        id: { width: '80px', align: 'center', header: 'Cód.' },
        nome: { width: '260px', header: 'Equipamento / Traje' },
        tipo: { width: '160px', align: 'center', header: 'Categoria Tática' },
        resistencia: {
          width: '190px',
          align: 'center',
          header: 'Integridade da Blindagem',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: 'row.resistencia * 10',
                total: 100,
                toneExpr: "row.resistencia >= 8 ? 'success' : row.resistencia >= 6 ? 'info' : row.resistencia >= 4 ? 'warning' : 'danger'",
                fallbackText: 'Blindagem',
              },
            },
          },
        },
        proprietarioNome: { width: '220px', header: 'Custodiante / Herói' },
        status: { width: '160px', align: 'center', header: 'Status de Custódia' },
      },
    },
    columns: [],
    toolbar: {
      visible: true,
      filters: {
        enabled: true,
        showAdvancedButton: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Itens', icon: 'inventory_2', filter: {} },
          { id: 'custodia', label: 'Em Uso / Custódia', icon: 'verified_user', filter: { status: 'EM_USO' } },
          { id: 'manutencao', label: 'Em Manutenção', icon: 'build', filter: { status: 'MANUTENCAO' } },
          { id: 'estoque', label: 'Disponível em Arsenal', icon: 'shelves', filter: { status: 'DISPONIVEL' } },
        ],
      },
    },
    behavior: {
      filtering: {
        enabled: true,
        columnFilters: {
          enabled: true,
        },
        advancedFilters: {
          enabled: true,
          settings: {
            showAdvanced: true,
            alwaysVisibleFields: ['nome', 'tipo', 'status'],
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

