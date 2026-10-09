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
    columns: [
      {
        field: 'fotoPerfilUrl',
        header: 'Avatar',
        width: '72px',
        align: 'center',
        sortable: false,
        filterable: false,
        renderer: {
          type: 'avatar',
          avatar: {
            srcField: 'fotoPerfilUrl',
            altField: 'nomeCompleto',
            initialsField: 'nomeCompleto',
            shape: 'circle',
            size: 40,
          },
        },
      },
      {
        field: 'nomeCompleto',
        header: 'Nome Completo / Civil',
        width: '240px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'cargoNome',
        header: 'Cargo',
        width: '220px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'departamentoNome',
        header: 'Departamento',
        width: '240px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'ativo',
        header: 'Status',
        type: 'boolean',
        format: 'custom|Ativo|Inativo',
        width: '110px',
        sortable: true,
        filterable: true,
      },
      {
        field: 'prontidaoScore',
        header: 'Prontidão de Campo',
        width: '180px',
        align: 'center',
        sortable: true,
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
      {
        field: 'dataAdmissao',
        header: 'Data de Admissão',
        type: 'date',
        format: 'dd/MM/yyyy',
        width: '160px',
        sortable: true,
        filterable: true,
      },
    ],
    behavior: {
      filtering: {
        enabled: true,
        columnFilters: {
          enabled: true,
        },
      },
    },
  } as unknown as CrudMetadata['table'],
  filterBar: {
    inlineFields: ['nomeCompleto', 'departamentoNome', 'ativo'],
    quickFilters: [
      { id: 'all', label: 'Todos os Heróis', icon: 'group', filter: {} },
      { id: 'ativos', label: 'Em Prontidão', icon: 'verified_user', filter: 'ativo=true' },
      { id: 'inativos', label: 'Reserva / Licença', icon: 'person_off', filter: 'ativo=false' },
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

export const SAMPLE_HERO: Record<string, unknown> = {
  id: 1,
  nomeCompleto: 'Anthony Edward Stark',
  codinome: 'Homem de Ferro',
  cargoNome: 'Engenheiro Chefe & Especialista Tático',
  departamentoNome: 'P&D e Tecnologia Avançada',
  universo: 'Terra-616',
  ativo: true,
  salario: 95000,
  cpf: '109.876.543-21',
  telefone: '+55 (11) 99887-6655',
  email: 'tony.stark@avengers.praxis.org',
  fotoPerfilUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=face',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=face',
  scorePublico: 96,
  scoreGovernamental: 88,
  dataAdmissao: '15/04/2018',
};
