import type { CrudMetadata } from '@praxisui/crud';

export const INCIDENTES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'operations/incidentes',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    cards: [
      {
        id: 'all',
        label: 'Total de Ocorrências',
        value: '74 Registros',
        caption: 'Sinistros pós-combate catalogados',
        icon: 'report',
        tone: 'neutral',
        filter: {},
      },
      {
        id: 'criticos',
        label: 'Severidade Crítica',
        value: '18 Casos Críticos',
        caption: 'Alto impacto civil e estrutural',
        icon: 'warning',
        tone: 'danger',
        filter: { severidade: 'CRITICA' },
      },
      {
        id: 'danos',
        label: 'Danos Materiais Totais',
        value: 'R$ 154,4 M',
        caption: 'Cobertura via Fundo Tático de Indenizações',
        icon: 'account_balance',
        tone: 'warning',
      },
      {
        id: 'mitigacao',
        label: 'Taxa de Mitigação',
        value: '96,2% Contido',
        caption: 'Evacuação prévia e blindagem energética',
        icon: 'shield_with_heart',
        tone: 'success',
      },
    ],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'descricao', 'local', 'severidade', 'danosCivis', 'feridos', 'ocorridoEm'],
      order: ['id', 'descricao', 'local', 'severidade', 'indiceSinistro', 'danosCivis', 'feridos', 'ocorridoEm'],
      additions: [
        {
          field: 'indiceSinistro',
          header: 'Índice de Danos',
          width: '180px',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: '= round(min(100, (danosCivis / 4000000) * 100))',
                total: 100,
                toneExpr: {
                  if: [
                    { '==': [{ var: 'severidade' }, 'CRITICA'] },
                    'danger',
                    { '==': [{ var: 'severidade' }, 'ALTA'] },
                    'warning',
                    'info',
                  ],
                } as any,
                fallbackText: 'Índice de Danos',
              },
            },
          },
        },
      ],
      overrides: {
        id: { width: '90px', align: 'center', header: 'Registro' },
        descricao: { width: '320px', header: 'Descrição do Sinistro / Impacto' },
        local: { width: '200px', header: 'Teatro do Dano' },
        severidade: { width: '130px', align: 'center', header: 'Severidade' },
        danosCivis: { width: '170px', align: 'right', type: 'currency', format: 'BRL', header: 'Prejuízo Civil (R$)' },
        feridos: { width: '90px', align: 'center', header: 'Feridos' },
        ocorridoEm: { width: '150px', align: 'center', type: 'date', header: 'Data do Ocorrido' },
      },
    },
    columns: [],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar incidentes por local, descrição ou severidade...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Ocorrências', filter: '', icon: 'report' },
          { id: 'critico', label: 'Severidade Crítica', filter: "severidade='CRITICA'", icon: 'warning' },
          { id: 'alta', label: 'Alta Severidade', filter: "severidade='ALTA'", icon: 'crisis_alert' },
          { id: 'media', label: 'Severidade Moderada', filter: "severidade='MEDIA'", icon: 'info' },
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
          schemaUrl: '/schemas/filtered?path=/api/operations/incidentes/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['local', 'severidade', 'descricao'],
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

