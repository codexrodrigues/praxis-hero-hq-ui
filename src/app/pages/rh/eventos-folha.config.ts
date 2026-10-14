import type { CrudMetadata } from '@praxisui/crud';

export const EVENTOS_FOLHA_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'human-resources/eventos-folha',
    idField: 'id',
  },
  kpiBand: {
    enabled: true,
    columns: 4,
    cards: [
      {
        id: 'total',
        label: 'Eventos Lançados',
        value: 'Conferência Ativa',
        caption: 'Rubricas vinculadas às folhas de pagamento',
        icon: 'receipt_long',
        tone: 'neutral',
        filter: {},
      },
      {
        id: 'pendentes',
        label: 'Aguardando Aprovação',
        value: 'Fila de Conferência',
        caption: 'Elegíveis para aprovação ou revisão em lote',
        icon: 'pending_actions',
        tone: 'warning',
        filter: { status: 'PENDENTE' },
      },
      {
        id: 'aprovados',
        label: 'Eventos Homologados',
        value: 'Prontos para Fechamento',
        caption: 'Aprovados pelo fluxo governado de folha',
        icon: 'task_alt',
        tone: 'success',
        filter: { status: 'APROVADO' },
      },
      {
        id: 'rejeitados',
        label: 'Eventos Glosados',
        value: 'Revisão Necessária',
        caption: 'Bloqueados na auditoria de folha',
        icon: 'cancel',
        tone: 'danger',
        filter: { status: 'REJEITADO' },
      },
    ],
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'descricao', 'tipo', 'valor', 'folhaPagamentoNome', 'status'],
      order: ['id', 'descricao', 'tipo', 'valor', 'folhaPagamentoNome', 'status'],
      overrides: {
        id: { width: '90px', align: 'center', header: 'Evento ID' },
        descricao: { width: '280px', header: 'Descrição da Rubrica / Evento' },
        tipo: { width: '160px', align: 'center', header: 'Natureza (Provento/Desconto)' },
        valor: { width: '160px', align: 'right', type: 'currency', format: 'BRL', header: 'Valor Financeiro' },
        folhaPagamentoNome: { width: '220px', header: 'Folha de Competência' },
        status: { width: '150px', align: 'center', header: 'Status do Workflow' },
      },
    },
    toolbar: {
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todos os Eventos', filter: {}, icon: 'receipt_long' },
          { id: 'pendentes', label: 'Pendentes de Aprovação', filter: { status: 'PENDENTE' }, icon: 'pending_actions' },
          { id: 'aprovados', label: 'Aprovados', filter: { status: 'APROVADO' }, icon: 'task_alt' },
          { id: 'rejeitados', label: 'Rejeitados', filter: { status: 'REJEITADO' }, icon: 'cancel' },
        ],
        showAdvancedButton: true,
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
        advancedFilters: {
          settings: {
            inline: true,
            alwaysVisibleFields: ['descricao', 'tipo', 'status'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
      expansion: {
        enabled: true,
        source: 'schema',
      },
    },
  },
  defaults: {
    openMode: 'drawer',
  },
};
