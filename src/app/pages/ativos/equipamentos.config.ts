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
    source: 'assets/equipamentos/stats/group-by',
    method: 'POST',
    payload: {
      filter: {},
      field: 'status',
      metrics: [{ operation: 'COUNT', alias: 'total' }],
    },
    cards: [
      {
        id: 'all',
        label: 'Total de Itens Táticos',
        value: '72 Ativos',
        valueExpr: '${totalCount | number | default:72} Ativos',
        caption: 'Trajes, armas e exoesqueletos',
        icon: 'shield',
        tone: 'info',
        filter: {},
      },
      {
        id: 'custodia',
        label: 'Em Custódia / Uso Ativo',
        value: '56 Itens',
        valueExpr: '${byKey.EM_USO | number | default:56} Itens',
        caption: 'Alocados a heróis em missão (77,8%)',
        captionExpr: "Alocados a heróis em missão (${((byKey.EM_USO / totalCount) * 100) | round:1 | default:'77,8'}%)",
        icon: 'verified_user',
        tone: 'success',
        filter: { status: 'EM_USO' },
      },
      {
        id: 'manutencao',
        label: 'Em Manutenção',
        value: '2 Itens',
        valueExpr: '${byKey.MANUTENCAO | number | default:2} Itens',
        caption: 'Recarga de reator e nanotecnologia',
        icon: 'build',
        tone: 'warning',
        filter: { status: 'MANUTENCAO' },
      },
      {
        id: 'estoque',
        label: 'Em Reserva de Arsenal',
        value: '2 Itens',
        valueExpr: '${byKey.ESTOQUE | number | default:2} Itens',
        caption: 'Disponíveis no cofre central',
        icon: 'inventory_2',
        tone: 'neutral',
        filter: { status: 'ESTOQUE' },
      },
    ],
  },
  filterBar: {
    placement: 'scope-bar',
    inlineFields: ['nome', 'tipo', 'status'],
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
                valueExpr: '= min(100, row.resistencia * 10)',
                total: 100,
                toneExpr: "= row.resistencia >= 8 ? 'success' : row.resistencia >= 6 ? 'info' : row.resistencia >= 4 ? 'warning' : 'danger'",
                fallbackText: 'Blindagem',
              },
            },
          },
        },
        proprietarioNome: { width: '220px', header: 'Custodiante / Herói' },
        status: {
          width: '160px',
          align: 'center',
          header: 'Status de Custódia',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'status' }, 'EM_USO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Em Custódia', variant: 'soft', color: 'primary', icon: 'verified_user' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'MANUTENCAO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Em Manutenção', variant: 'soft', color: 'accent', icon: 'build' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'ESTOQUE'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Em Arsenal', variant: 'outlined', color: 'basic', icon: 'inventory_2' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'QUEBRADO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Danificado', variant: 'soft', color: 'warn', icon: 'broken_image' },
              },
            },
            {
              condition: { '==': [{ var: 'status' }, 'PERDIDO'] },
              renderer: {
                type: 'chip',
                chip: { text: 'Extraviado', variant: 'soft', color: 'warn', icon: 'gpp_bad' },
              },
            },
          ],
        },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todos os Itens', icon: 'inventory_2', filter: {} },
          { id: 'custodia', label: 'Em Uso / Custódia', icon: 'verified_user', filter: { status: 'EM_USO' } },
          { id: 'manutencao', label: 'Em Manutenção', icon: 'build', filter: { status: 'MANUTENCAO' } },
          { id: 'estoque', label: 'Disponível em Arsenal', icon: 'shelves', filter: { status: 'ESTOQUE' } },
        ],
      },
    },
    behavior: {
      filtering: {
        advancedFilters: {
          settings: {
            alwaysVisibleFields: ['nome', 'tipo', 'status'],
          },
        },
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};


