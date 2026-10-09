import type { CrudMetadata } from '@praxisui/crud';

export const DEPARTAMENTOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/departamentos',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    cards: [
      {
        id: 'divisoes',
        label: 'Divisões Ativas',
        value: '28 Departamentos',
        caption: 'Estrutura operacional e estratégica',
        icon: 'corporate_fare',
        tone: 'info',
        filter: {},
      },
      {
        id: 'liderancas',
        label: 'Lideranças Nomeadas',
        value: '96,4% Cobertura',
        caption: 'Diretoria e supervisão tática',
        icon: 'military_tech',
        tone: 'success',
      },
      {
        id: 'cargos',
        label: 'Cargos Mapeados',
        value: '15 Funções',
        caption: 'Catálogo de carreiras ativas',
        icon: 'account_tree',
        tone: 'warning',
      },
      {
        id: 'senioridade',
        label: 'Níveis de Carreira',
        value: '5 Níveis',
        caption: 'Do Júnior ao Executivo/Diretor',
        icon: 'trending_up',
        tone: 'neutral',
      },
    ],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'nome', 'codigo', 'responsavelNome'],
      order: ['id', 'nome', 'codigo', 'ocupacaoScore', 'responsavelNome'],
      additions: [
        {
          field: 'ocupacaoScore',
          header: 'Taxa de Ocupação',
          width: '180px',
          align: 'center',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: '85',
                total: 100,
                toneExpr: "'info'",
                fallbackText: 'Ocupação',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '80px', align: 'center', header: 'ID' },
        nome: { width: '280px', header: 'Nome da Divisão' },
        codigo: { width: '130px', align: 'center', header: 'Sigla / Código' },
        responsavelNome: { width: '260px', header: 'Diretor / Líder Responsável' },
      },
    },
    columns: [],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar divisões por nome, sigla ou diretor responsável...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Divisões', filter: '', icon: 'corporate_fare' },
          { id: 'operacoes', label: 'Operações & Defesa', filter: "codigo='OP' or codigo='TAC' or codigo='DEF'", icon: 'shield' },
          { id: 'pesquisa', label: 'P&D e Tecnologia', filter: "codigo='RD' or codigo='TECH' or codigo='LAB'", icon: 'science' },
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
          schemaUrl: '/schemas/filtered?path=/api/human-resources/departamentos/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['nome', 'codigo', 'responsavelNome'],
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

