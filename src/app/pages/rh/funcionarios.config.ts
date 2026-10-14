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
    cards: [
      {
        id: 'total',
        label: 'Efetivo Total',
        value: '24 Cadastrados',
        caption: 'Quadro ativo e reserva',
        icon: 'group',
        tone: 'info',
        filter: {},
      },
      {
        id: 'ativos',
        label: 'Em Prontidão Ativa',
        value: '21 Ativos',
        caption: '87,5% da força operacional',
        icon: 'verified_user',
        tone: 'success',
        filter: { ativo: true },
      },
      {
        id: 'inativos',
        label: 'Em Reserva / Licença',
        value: '03 Inativos',
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
  table: {
    columnProjection: {
      source: 'schema',
      include: ['avatarUrl', 'nomeCompleto', 'cargoNome', 'departamentoNome', 'ativo', 'dataAdmissao'],
      order: ['avatarUrl', 'nomeCompleto', 'cargoNome', 'departamentoNome', 'ativo', 'prontidaoScore', 'dataAdmissao'],
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
                valueExpr: 'row.ativo ? 90 : 40',
                total: 100,
                toneExpr: "row.ativo ? 'success' : 'warning'",
                fallbackText: 'Prontidão',
              },
            },
          },
        },
      ],
      overrides: {
        avatarUrl: {
          width: '72px',
          align: 'center',
          header: 'Avatar',
          renderer: {
            type: 'avatar',
            avatar: {
              srcField: 'avatarUrl',
              altField: 'nomeCompleto',
              initialsField: 'nomeCompleto',
              shape: 'circle',
              size: 40,
            },
          },
        },
        nomeCompleto: { width: '240px', header: 'Nome Completo / Civil' },
        cargoNome: { width: '220px', header: 'Cargo' },
        departamentoNome: { width: '240px', header: 'Departamento' },
        ativo: { width: '132px', header: 'Status' },
        dataAdmissao: { width: '160px', header: 'Data de Admissão' },
      },
    },
    behavior: {
      selection: {
        enabled: true,
        type: 'multiple',
        mode: 'checkbox',
        allowSelectAll: true,
        checkboxPosition: 'start',
        persistSelection: true,
        persistOnDataUpdate: false,
        visual: {
          highlightSelected: true,
          showSelectionCount: true,
        },
      },
      filtering: {
        columnFilters: {
          enabled: true,
        },
      },
    },
  },
  filterBar: {
    inlineFields: ['nomeCompleto', 'departamentoNome', 'ativo'],
    quickFilters: [
      { id: 'all', label: 'Todos os Heróis', icon: 'group', filter: {} },
      { id: 'ativos', label: 'Em Prontidão', icon: 'verified_user', filter: { ativo: true } },
      { id: 'inativos', label: 'Reserva / Licença', icon: 'person_off', filter: { ativo: false } },
    ],
    showAdvanced: true,
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

