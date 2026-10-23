import type { CrudMetadata } from '@praxisui/crud';

export const HEROES_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/funcionarios',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    source: 'human-resources/funcionarios/stats/group-by',
    method: 'POST',
    payload: {
      filter: {},
      field: 'ativo',
      metrics: [{ operation: 'COUNT', alias: 'total' }],
    },
    cards: [
      {
        id: 'total',
        label: 'Efetivo Total',
        value: '101 Cadastrados',
        valueExpr: '${totalCount | number | default:101} Cadastrados',
        caption: 'Quadro ativo e reserva tática',
        icon: 'group',
        tone: 'info',
        filter: {},
      },
      {
        id: 'ativos',
        label: 'Em Prontidão Ativa',
        value: '53 Ativos',
        valueExpr: '${byKey.true | number | default:53} Ativos',
        caption: '52,5% da força operacional mobilizável',
        captionExpr: "${((byKey.true / totalCount) * 100) | round:1 | default:'52,5'}% da força operacional mobilizável",
        icon: 'verified_user',
        tone: 'success',
        filter: { ativo: true },
      },
      {
        id: 'inativos',
        label: 'Em Reserva / Licença',
        value: '48 Inativos',
        valueExpr: '${byKey.false | number | default:48} Inativos',
        caption: 'Reserva tática ou licença civil',
        icon: 'person_off',
        tone: 'warning',
        filter: { ativo: false },
      },
      {
        id: 'reputacao',
        label: 'Score Reputacional Médio',
        value: '91,2 / 100',
        caption: 'Índice combinado público-governo',
        icon: 'auto_awesome',
        tone: 'neutral',
      },
    ],
  },
  filterBar: {
    placement: 'scope-bar',
    inlineFields: ['nomeCompleto', 'departamentoNome', 'ativo'],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['nomeCompleto', 'cargoNome', 'ativo', 'dataAdmissao'],
      order: ['nomeCompleto', 'cargoNome', 'ativo', 'prontidaoScore', 'dataAdmissao'],
      additions: [
        {
          field: 'prontidaoScore',
          header: 'Prontidão de Campo',
          width: '180px',
          align: 'center',
          renderer: {
            type: 'microVisualization',
            microVisualization: {
              visualization: {
                kind: 'radial',
                surface: 'table-cell',
                valueExpr: '= row.ativo ? 90 : 40',
                total: 100,
                toneExpr: "= row.ativo ? 'success' : 'warning'",
                fallbackText: 'Prontidão',
              },
            },
          },
        },
      ],
      overrides: {
        // Media object: foto à esquerda; nome em destaque e código do cadastro logo abaixo.
        // O "id" é o identificador técnico do cadastro (não há matrícula funcional no DTO), por isso o rótulo "Cód.".
        nomeCompleto: {
          width: '280px',
          header: 'Colaborador',
          renderer: {
            type: 'compose',
            compose: {
              items: [
                {
                  type: 'avatar',
                  avatar: {
                    srcField: 'avatarUrl',
                    altField: 'nomeCompleto',
                    initialsField: 'nomeCompleto',
                    shape: 'circle',
                    size: 38,
                  },
                },
                { type: 'value', field: 'nomeCompleto', emphasis: 'strong' },
                { type: 'value', field: 'id', prefix: 'Cód. #', emphasis: 'subtle' },
              ],
              layout: { direction: 'media', gap: 12, align: 'start', ellipsis: true },
            },
          },
        },
        // Cargo em destaque com a lotação (departamento) em segunda linha.
        cargoNome: {
          width: '260px',
          header: 'Cargo & Lotação',
          renderer: {
            type: 'compose',
            compose: {
              items: [
                { type: 'value', field: 'cargoNome', emphasis: 'strong' },
                { type: 'value', field: 'departamentoNome', emphasis: 'subtle' },
              ],
              layout: { direction: 'column', gap: 2, align: 'start', ellipsis: true },
            },
          },
        },
        ativo: {
          width: '150px',
          align: 'center',
          header: 'Status Operacional',
          conditionalRenderers: [
            {
              condition: { '==': [{ var: 'ativo' }, true] },
              renderer: {
                type: 'chip',
                chip: { text: 'Prontidão Ativa', variant: 'soft', color: 'primary', icon: 'verified_user' },
              },
            },
            {
              condition: { '==': [{ var: 'ativo' }, false] },
              renderer: {
                type: 'chip',
                chip: { text: 'Reserva / Licença', variant: 'outlined', color: 'basic', icon: 'person_off' },
              },
            },
          ],
        },
        dataAdmissao: { width: '160px', header: 'Data de Admissão' },
      },
    },
    toolbar: {
      filters: {
        quickFilters: [
          { id: 'all', label: 'Todos os Heróis', icon: 'group', filter: {} },
          { id: 'ativos', label: 'Em Prontidão', icon: 'verified_user', filter: { ativo: true } },
          { id: 'inativos', label: 'Reserva / Licença', icon: 'person_off', filter: { ativo: false } },
        ],
      },
    },
    behavior: {
      selection: {
        enabled: true,
      },
      filtering: {
        advancedFilters: {
          settings: {
            alwaysVisibleFields: ['nomeCompleto', 'departamentoNome', 'ativo'],
          },
        },
      },
      expansion: {
        enabled: false,
      },
    },
  },
  actions: [
    {
      id: 'edit',
      label: 'Editar Dossiê',
      action: 'edit',
      openMode: 'modal',
      formId: 'funcionarios-edit',
      params: [{ from: 'id', to: 'input', name: 'id' }],
    },
    {
      id: 'create',
      label: 'Novo Colaborador',
      action: 'create',
      openMode: 'modal',
      formId: 'funcionarios-create',
    },
  ],
  defaults: {
    openMode: 'modal',
    modal: { width: '920px', maxWidth: '95vw' },
  },
};


