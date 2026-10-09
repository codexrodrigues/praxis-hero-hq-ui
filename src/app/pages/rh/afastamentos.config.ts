import type { CrudMetadata } from '@praxisui/crud';

export const AFASTAMENTOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/ferias-afastamentos',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    cards: [
      {
        id: 'ciclos',
        label: 'Total de Registros',
        value: '111 Registros',
        caption: 'Férias regulamentares e licenças',
        icon: 'history',
        tone: 'neutral',
        filter: {},
      },
      {
        id: 'criticos',
        label: 'Casos Críticos / Graves',
        value: '51 Ocorrências',
        caption: 'Trauma de combate e regeneração',
        icon: 'health_and_safety',
        tone: 'danger',
        filter: { tipo: 'LICENCA_MEDICA' },
      },
      {
        id: 'padrao',
        label: 'Licenças Padrão',
        value: '60 Registros',
        caption: 'Descanso e suporte preventivo',
        icon: 'event_available',
        tone: 'info',
        filter: { tipo: 'FERIAS' },
      },
      {
        id: 'dias',
        label: 'Dias em Recuperação',
        value: '1.204 Dias',
        caption: 'Total acumulado em afastamento',
        icon: 'calendar_month',
        tone: 'warning',
      },
    ],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'tipo', 'funcionarioId', 'dataInicio', 'dataFim', 'observacoes'],
      order: ['id', 'tipo', 'funcionarioId', 'dataInicio', 'dataFim', 'progressoRecuperacao', 'observacoes'],
      additions: [
        {
          field: 'progressoRecuperacao',
          header: 'Progresso / Recuperação',
          width: '190px',
          align: 'center',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: "row.tipo === 'FERIAS' ? 85 : row.tipo === 'TREINAMENTO' ? 90 : 65",
                total: 100,
                toneExpr: "row.tipo === 'FERIAS' ? 'info' : row.tipo === 'TREINAMENTO' ? 'success' : 'warning'",
                fallbackText: 'Progresso',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '80px', align: 'center', header: 'ID' },
        tipo: { width: '180px', align: 'left', header: 'Tipo de Licença / Ausência' },
        funcionarioId: { width: '140px', align: 'center', header: 'Colaborador ID' },
        dataInicio: { width: '150px', align: 'center', type: 'date', format: 'dd/MM/yyyy', header: 'Início da Vigência' },
        dataFim: { width: '150px', align: 'center', type: 'date', format: 'dd/MM/yyyy', header: 'Término Previsto' },
        observacoes: { width: '320px', header: 'Observações / Parecer Operacional' },
      },
    },
    columns: [],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar afastamentos por tipo, colaborador ou observações...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Registros', filter: '', icon: 'history' },
          { id: 'ferias', label: 'Férias Regulamentares', filter: "tipo='FERIAS'", icon: 'beach_access' },
          { id: 'medica', label: 'Licença Médica / Recuperação', filter: "tipo='LICENCA_MEDICA' or tipo='MEDICA'", icon: 'health_and_safety' },
          { id: 'treinamento', label: 'Treinamento Tático', filter: "tipo='TREINAMENTO'", icon: 'model_training' },
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
          schemaUrl: '/schemas/filtered?path=/api/human-resources/ferias-afastamentos/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['tipo', 'funcionarioId', 'dataInicio'],
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

